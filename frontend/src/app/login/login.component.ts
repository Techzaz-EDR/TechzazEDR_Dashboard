import { Component, AfterViewInit, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, EyeOff, User, Lock, Mail, Twitter, Linkedin, Globe, Github, X } from 'lucide-angular';
import { gsap } from 'gsap';
import { AuthService } from '../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit, OnInit {
    email = '';
    password = '';
    showPassword = false;
    isSignUpMode = false;
    errorMessage = '';

    // Sign Up Fields
    signupName = '';
    signupEmail = '';
    signupPassword = '';

    readonly Eye = Eye;
    readonly EyeOff = EyeOff;
    readonly User = User;
    readonly Lock = Lock;
    readonly Mail = Mail;
    readonly Twitter = Twitter;
    readonly Linkedin = Linkedin;
    readonly Globe = Globe;
    readonly Github = Github;
    private glowElement: HTMLElement | null = null;
    screenWidth = 1920;
    screenHeight = 1080;

    constructor(private router: Router, private authService: AuthService, private route: ActivatedRoute) { }

    @HostListener('window:resize')
    onResize() {
        if (typeof window !== 'undefined') {
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
        }
    }

    ngOnInit() {
        if (typeof window !== 'undefined') {
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
        }

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

    async signIn() {
        this.errorMessage = '';
        try {
            await this.authService.login(this.email, this.password);
            await this.playLoginAnimation();
            this.router.navigate(['/dashboard']);
        } catch (error: any) {
            console.error('Login failed', error);
            this.errorMessage = error.message || 'Authentication failed. Please check your credentials.';
        }
    }

    playLoginAnimation(): Promise<void> {
        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });

            // Highlight line goes around the border of the box smoothly
            tl.to('.anim-card-border', {
                strokeDashoffset: 0,
                duration: 1.5,
                ease: 'power1.inOut'
            });

            // Brief pause before dashboard opens
            tl.to({}, { duration: 0.4 });
        });
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    toggleMode() {
        this.isSignUpMode = !this.isSignUpMode;
        this.errorMessage = '';
    }
}
