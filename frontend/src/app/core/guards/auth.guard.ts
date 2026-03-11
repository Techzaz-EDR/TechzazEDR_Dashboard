import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter, tap } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.user$.pipe(
        filter(user => user !== undefined), // Wait for Firebase to check session
        take(1),
        tap(user => console.log('Guard checking user:', user ? user.email : 'No user')),
        map(user => {
            if (user) {
                return true;
            } else {
                console.warn('Unauthorized access to dashboard, redirecting to /login');
                router.navigate(['/login']);
                return false;
            }
        })
    );
};
