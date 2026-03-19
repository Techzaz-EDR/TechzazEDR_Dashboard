import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, getIdTokenResult, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, from, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';

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

    constructor(private router: Router, private zone: NgZone) {
        // Firebase callbacks run outside Angular's zone. Using .then() chains
        // (not async/await) ensures every .next() call stays inside zone.run().
        onAuthStateChanged(this.auth, (user: User | null) => {
            if (user) {
                this.zone.run(() => {
                    this.userSubject.next(user);
                });

                // Load claims then profile, each .next() wrapped in zone.run()
                this.refreshClaims(user).then(() => {
                    const userDocRef = doc(this.db, 'users', user.uid);
                    return getDoc(userDocRef);
                }).then(snap => {
                    this.zone.run(() => {
                        if (snap.exists()) {
                            this.userProfileSubject.next({ uid: user.uid, ...snap.data() });
                            console.log('User profile fetched:', snap.data());
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
        this.router.navigate(['/login']);
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
