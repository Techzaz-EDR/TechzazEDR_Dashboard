import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, getIdTokenResult, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, from, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface ProfileUpdateData {
    name?: string;
    phone?: string;
    bio?: string;
    companyEmail?: string;
    companyAddress?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = getAuth(initializeApp(environment.firebase));
    private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
    public user$ = this.userSubject.asObservable();

    private userProfileSubject = new BehaviorSubject<any | null>(null);
    public userProfile$ = this.userProfileSubject.asObservable();

    private tenantIdSubject = new BehaviorSubject<string | null>(null);
    public tenantId$ = this.tenantIdSubject.asObservable();

    public role: string | null = null;
    public tenantId: string | null = null;

    private db = getFirestore(this.auth.app);
    private storage = getStorage(this.auth.app);
    private apiUrl = environment.apiUrl;

    constructor(
        private router: Router, 
        private zone: NgZone,
        private http: HttpClient
    ) {
        // Firebase callbacks run outside Angular's zone. Using .then() chains
        // (not async/await) ensures every .next() call stays inside zone.run().
        onAuthStateChanged(this.auth, (user: User | null) => {
            if (user) {
                this.zone.run(() => {
                    this.userSubject.next(user);
                });

                // Update last_seen immediately and start interval
                const updateLastSeen = () => {
                    const userDocRef = doc(this.db, 'users', user.uid);
                    updateDoc(userDocRef, { last_seen: serverTimestamp() })
                        .catch(error => console.error('Error updating last_seen:', error));
                };
                updateLastSeen();
                if ((window as any).lastSeenInterval) clearInterval((window as any).lastSeenInterval);
                (window as any).lastSeenInterval = setInterval(updateLastSeen, 60000); // every 60s

                // Load claims then profile, each .next() wrapped in zone.run()
                this.refreshClaims(user).then(() => {
                    const userDocRef = doc(this.db, 'users', user.uid);
                    return getDoc(userDocRef);
                }).then(snap => {
                    this.zone.run(() => {
                        if (snap.exists()) {
                            const profileData = snap.data();
                            this.userProfileSubject.next({ uid: user.uid, ...profileData });
                            console.log('User profile fetched:', profileData);

                            // Fallback: If tenantId was missing from claims, try to get it from the profile document
                            if (!this.tenantId && profileData['tenantId']) {
                                console.log('AuthService: tenantId missing from claims, using fallback from Firestore profile:', profileData['tenantId']);
                                this.tenantId = profileData['tenantId'];
                                this.tenantIdSubject.next(this.tenantId);
                            }
                        } else {
                            console.warn('User document not found in Firestore for uid:', user.uid);
                            this.userProfileSubject.next(null);
                        }
                    });
                }).catch(error => {
                    console.error('Error fetching user profile:', error);
                    this.zone.run(() => this.userProfileSubject.next(null));
                });

            } else {
                if ((window as any).lastSeenInterval) clearInterval((window as any).lastSeenInterval);
                this.zone.run(() => {
                    this.userSubject.next(null);
                    this.role = null;
                    this.tenantId = null;
                    this.tenantIdSubject.next(null);
                    this.userProfileSubject.next(null);
                });
            }
        });
    }

    async login(email: string, pass: string) {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, pass);
        const user = userCredential.user;
        
        // Update last login timestamp in Firestore (fire-and-forget)
        const userDocRef = doc(this.db, 'users', user.uid);
        updateDoc(userDocRef, { last_login_at: serverTimestamp() })
            .catch(error => console.error('Error updating last_login_at:', error));

        return userCredential;
    }

    async requestPasswordReset(email: string) {
        return sendPasswordResetEmail(this.auth, email);
    }

    async logout() {
        await signOut(this.auth);
        this.tenantIdSubject.next(null);
        this.router.navigate(['/']);
    }

    async getToken(): Promise<string | null> {
        const user = this.auth.currentUser;
        return user ? user.getIdToken() : null;
    }

    private async refreshClaims(user: User) {
        const result = await getIdTokenResult(user);
        this.role = (result.claims['role'] as string) || null;
        this.tenantId = (result.claims['tenantId'] as string) || null;
        this.zone.run(() => this.tenantIdSubject.next(this.tenantId));
    }

    get isLoggedIn(): boolean {
        return !!this.userSubject.value;
    }

    get currentUser(): User | null | undefined {
        return this.userSubject.value;
    }

    /**
     * Registers a new user and initializes their organization.
     */
    async register(email: string, pass: string, orgData: any) {
        // 1. Create user in Firebase Auth
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, pass);
        const user = userCredential.user;

        // 2. Get the ID token for the backend call
        const token = await user.getIdToken();

        // 3. Call backend to initialize organization and set claims
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        
        try {
            await firstValueFrom(
                this.http.post(`${this.apiUrl}/auth/register`, orgData, { headers })
            );

            // 4. Force refresh the token to get the new custom claims (tenantId, role)
            await user.getIdToken(true);

            return userCredential;
        } catch (error) {
            // Cleanup: If backend fails, we should probably delete the firebase user 
            // but for simplicity in this MVP we just throw.
            console.error('Organization initialization failed:', error);
            throw error;
        }
    }

    /**
     * Saves user data to Firestore users collection only.
     * Does NOT create a Firebase Authentication account.
     */
    async addUserToFirestore(email: string, name: string, role: string, extraData: any = {}) {
        const adminTenantId = await firstValueFrom(this.tenantId$);
        if (!adminTenantId) throw new Error('No tenant context found for administrator');

        const usersRef = collection(this.db, 'users');
        const newUserDoc = await addDoc(usersRef, {
            email,
            name,
            role,
            organization_id: adminTenantId,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...extraData
        });

        console.log(`User ${email} saved to Firestore with ID: ${newUserDoc.id}`);
        return { id: newUserDoc.id, email, name, role };
    }

    /**
     * Deletes a user document from Firestore.
     */
    async deleteUserFromFirestore(userId: string) {
        console.log(`AuthService: Attempting to delete user document: users/${userId}`);
        const userDocRef = doc(this.db, 'users', userId);
        try {
            await deleteDoc(userDocRef);
            console.log(`AuthService: User ${userId} successfully deleted from Firestore.`);
        } catch (error) {
            console.error(`AuthService: Error deleting user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Updates an existing user document in Firestore.
     */
    async updateUserInFirestore(userId: string, data: any) {
        const userDocRef = doc(this.db, 'users', userId);
        await updateDoc(userDocRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        console.log(`User ${userId} updated in Firestore.`);
    }

    updateProfile(data: ProfileUpdateData): void {
        const user = this.auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        // 1. Optimistic update immediately — button will unstick right away
        const current = this.userProfileSubject.value || {};
        this.userProfileSubject.next({ ...current, ...data, uid: user.uid });

        // 2. Fire-and-forget Firestore write in the background
        const userDocRef = doc(this.db, 'users', user.uid);
        const update: Record<string, any> = { updatedAt: serverTimestamp() };
        if (data.name !== undefined)          update['name']          = data.name;
        if (data.phone !== undefined)         update['phone']         = data.phone;
        if (data.bio !== undefined)           update['bio']           = data.bio;
        if (data.companyEmail !== undefined)  update['companyEmail']  = data.companyEmail;
        if (data.companyAddress !== undefined) update['companyAddress'] = data.companyAddress;

        updateDoc(userDocRef, update)
            .then(() => console.log('Profile saved to Firestore'))
            .catch(err => console.error('Profile Firestore write error:', err));
    }

    async updateProfilePictureData(photoUrl: string): Promise<void> {
        const user = this.auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const userDocRef = doc(this.db, 'users', user.uid);
        await updateDoc(userDocRef, { 
            photoUrl: photoUrl,
            updatedAt: serverTimestamp()
        });

        // Update the local state
        const current = this.userProfileSubject.value || {};
        this.userProfileSubject.next({ ...current, photoUrl: photoUrl });
    }

    async uploadProfilePicture(file: File): Promise<string> {
        const user = this.auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        // Create a reference to the storage location
        const storageRef = ref(this.storage, `profile_pictures/${user.uid}_${Date.now()}_${file.name}`);
        
        // Upload the file
        await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update Firestore with the new photo URL
        const userDocRef = doc(this.db, 'users', user.uid);
        await updateDoc(userDocRef, { 
            photoUrl: downloadURL,
            updatedAt: serverTimestamp()
        });

        // Update the local state
        const current = this.userProfileSubject.value || {};
        this.userProfileSubject.next({ ...current, photoUrl: downloadURL });

        return downloadURL;
    }
}
