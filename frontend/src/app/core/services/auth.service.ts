import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, getIdTokenResult } from 'firebase/auth';
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

    public role: string | null = null;
    public tenantId: string | null = null;

    constructor(private router: Router) {
        onAuthStateChanged(this.auth, (user: User | null) => {
            console.log('Auth State Changed:', user ? `User ${user.email}` : 'No User');
            this.userSubject.next(user);
            if (user) {
                this.refreshClaims(user);
            } else {
                this.role = null;
                this.tenantId = null;
            }
        });
    }

    async login(email: string, pass: string) {
        return signInWithEmailAndPassword(this.auth, email, pass);
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
