import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, getIdTokenResult } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = getAuth(initializeApp(environment.firebase));
    private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
    public user$ = this.userSubject.asObservable();

    private userProfileSubject = new BehaviorSubject<any | null>(null);
    public userProfile$ = this.userProfileSubject.asObservable();

    public role: string | null = null;
    public tenantId: string | null = null;

    private db = getFirestore(this.auth.app);

    constructor(private router: Router) {
        onAuthStateChanged(this.auth, async (user: User | null) => {
            console.log('Auth State Changed:', user ? `User ${user.email}` : 'No User');
            this.userSubject.next(user);
            if (user) {
                this.refreshClaims(user);
                
                // Fetch the user's profile from the users collection
                try {
                    const userDocRef = doc(this.db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        this.userProfileSubject.next({ uid: user.uid, ...userDocSnap.data() });
                        console.log('User profile fetched:', userDocSnap.data());
                    } else {
                        console.warn('User document not found in Firestore for uid:', user.uid);
                        // Fallback or handle missing profile
                        this.userProfileSubject.next(null);
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    this.userProfileSubject.next(null);
                }

            } else {
                this.role = null;
                this.tenantId = null;
                this.userProfileSubject.next(null);
            }
        });
    }

    async login(email: string, pass: string) {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, pass);
        const user = userCredential.user;
        
        // Update last login timestamp in Firestore
        try {
            const userDocRef = doc(this.db, 'users', user.uid);
            await updateDoc(userDocRef, {
                last_login_at: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating last_login_at:', error);
            // Non-blocking error, allow login to proceed
        }

        return userCredential;
    }

    async register(name: string, email: string, pass: string) {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, pass);
        const user = userCredential.user;

        // Create user document in Firestore
        try {
            const userDocRef = doc(this.db, 'users', user.uid);
            await setDoc(userDocRef, {
                uid: user.uid,
                display_name: name,
                email: email,
                role: 'user', // Default role
                created_at: serverTimestamp(),
                last_login_at: serverTimestamp()
            });
        } catch (error) {
            console.error('Error creating user document:', error);
            // Even if setDoc fails, the user is created in Auth
        }

        return userCredential;
    }

    async logout() {
        await signOut(this.auth);
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
    }

    get isLoggedIn(): boolean {
        return !!this.userSubject.value;
    }
}
