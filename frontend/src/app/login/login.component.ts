import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, EyeOff, User, Lock, Mail, Twitter, Linkedin, Globe, Github, X, ShieldCheck, Building2, Phone, CheckCircle } from 'lucide-angular';
import { gsap } from 'gsap';
import { AuthService } from '../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit, OnInit {
    // Sign-In Fields
    email = '';
    password = '';
    showPassword = false;
    isSignUpMode = false;
    errorMessage = '';
    loginSubmitted = false;

    // Sign Up Fields
    signupFirstName = '';
    signupLastName = '';
    signupEmail = '';
    signupCompany = '';
    signupCountry = '';
    signupPhone = '';
    signupPassword = '';
    signupConfirmPassword = '';
    showSignupPassword = false;
    showSignupConfirmPassword = false;
    agreeTerms = false;
    agreeContact = false;
    signupError = '';
    signupSuccess = false;
    signupSubmitted = false;

    readonly Eye = Eye;
    readonly EyeOff = EyeOff;
    readonly User = User;
    readonly Lock = Lock;
    readonly Mail = Mail;
    readonly Twitter = Twitter;
    readonly Linkedin = Linkedin;
    readonly Globe = Globe;
    readonly Github = Github;
    readonly ShieldCheck = ShieldCheck;
    readonly Building2 = Building2;
    readonly Phone = Phone;
    readonly CheckCircle = CheckCircle;
    private glowElement: HTMLElement | null = null;

    constructor(private router: Router, private authService: AuthService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['mode'] === 'signup') {
                this.isSignUpMode = true;
            }
        });
    }

    ngAfterViewInit() {
        this.glowElement = document.querySelector('.hover-glow');
        if (this.glowElement) {
            gsap.set(this.glowElement, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
        }
    }

    onMouseMove(e: MouseEvent) {
        if (!this.glowElement) return;

        if (!this.glowElement.classList.contains('visible')) {
            this.glowElement.classList.add('visible');
        }

        gsap.to(this.glowElement, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.8,
            ease: "power2.out"
        });

        const card = document.querySelector('.auth-card') as HTMLElement;
        if (card) {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const rotateX = (e.clientY - centerY) / 25;
            const rotateY = (centerX - e.clientX) / 25;

            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 0.5,
                ease: "power1.out"
            });
        }
    }

    onMouseLeave() {
        if (this.glowElement) {
            this.glowElement.classList.remove('visible');
        }

        const card = document.querySelector('.auth-card') as HTMLElement;
        if (card) {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.5)"
            });
        }
    }

    async signIn(signInForm: any) {
        this.loginSubmitted = true;
        this.errorMessage = '';

        if (signInForm.invalid) {
            return;
        }

        try {
            await this.authService.login(this.email, this.password);
            this.router.navigate(['/dashboard']);
        } catch (error: any) {
            console.error('Login failed', error);
            this.errorMessage = error.message || 'Authentication failed. Please check your credentials.';
        }
    }

    async signUp(signUpForm: any) {
        this.signupSubmitted = true;
        this.signupError = '';

        if (signUpForm.invalid) {
            return;
        }

        if (this.signupPassword !== this.signupConfirmPassword) {
            this.signupError = 'Passwords do not match. Please try again.';
            return;
        }

        if (!this.agreeTerms) {
            this.signupError = 'You must agree to the Terms of Service and Privacy Policy.';
            return;
        }

        try {
            // Registration logic — wire to AuthService when backend is ready
            console.log('Sign up payload:', {
                firstName: this.signupFirstName,
                lastName: this.signupLastName,
                email: this.signupEmail,
                company: this.signupCompany,
                country: this.signupCountry,
                phone: this.signupPhone,
            });
            // On success, show confirmation state
            this.signupSuccess = true;
        } catch (error: any) {
            console.error('Sign up failed', error);
            this.signupError = error.message || 'Registration failed. Please try again.';
        }
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    toggleSignupPassword() {
        this.showSignupPassword = !this.showSignupPassword;
    }

    toggleSignupConfirmPassword() {
        this.showSignupConfirmPassword = !this.showSignupConfirmPassword;
    }

    goToLogin() {
        this.isSignUpMode = false;
        this.signupSuccess = false;
        this.router.navigate(['/login']);
    }

    goToHome() {
        this.router.navigate(['/']);
    }

    toggleMode() {
        this.isSignUpMode = !this.isSignUpMode;
        this.signupSuccess = false;
        this.errorMessage = '';
        this.signupError = '';
    }
}

