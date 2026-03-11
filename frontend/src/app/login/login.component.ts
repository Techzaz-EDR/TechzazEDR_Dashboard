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

    spheres: any[] = [];

    constructor(private router: Router, private authService: AuthService, private route: ActivatedRoute) { }





    ngOnInit() {
        if (typeof window !== 'undefined') {
            this.generateSpheres();
            this.startAutomatedDrift();
        }

        this.route.queryParams.subscribe(params => {
            if (params['mode'] === 'signup') {
                this.isSignUpMode = true;
            }
        });
    }

    startAutomatedDrift() {
        // Subtle drift for spheres so they don't just stay still
        this.spheres.forEach((s, i) => {
            gsap.to(`.sphere-${i}`, {
                x: "+=20",
                y: "-=30",
                duration: 5 + Math.random() * 5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });
    }

    generateSpheres() {
        const colors = [
            'radial-gradient(circle at 30% 30%, #4facfe, #00f2fe)', // Cyan-ish Blue
            'radial-gradient(circle at 30% 30%, #a18cd1, #fbc2eb)', // Purple-ish Pink
            'radial-gradient(circle at 30% 30%, #2575fc, #6a11cb)', // Deep Blue/Purple
        ];

        this.spheres = Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            width: Math.random() * 250 + 150 + 'px',
            initialLeft: Math.random() * 90 + -5,
            initialTop: Math.random() * 90 + -5,
            background: colors[i % colors.length],
            delay: (Math.random() * -30) + 's',
            duration: (Math.random() * 10 + 20) + 's',
            blur: (Math.random() * 4 + 1) + 'px'
        }));
    }

    ngAfterViewInit() {
        this.glowElement = document.querySelector('.hover-glow');
        if (this.glowElement) {
            gsap.set(this.glowElement, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
        }
    }

    onMouseMove(e: MouseEvent) {
        if (typeof window === 'undefined') return;

        const mouseX = (e.clientX / window.innerWidth) - 0.5;
        const mouseY = (e.clientY / window.innerHeight) - 0.5;

        // Parallax effect for spheres - higher depth factors
        this.spheres.forEach((s, i) => {
            const factor = (i + 1) * 25; 
            gsap.to(`.sphere-${i}`, {
                x: mouseX * factor,
                y: mouseY * factor,
                duration: 1.5,
                ease: "power1.out"
            });
        });

        const card = document.querySelector('.auth-card') as HTMLElement;
        if (card) {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const rotateX = (e.clientY - centerY) / 50;
            const rotateY = (centerX - e.clientX) / 50;

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
            console.error('Auth failed', error);
            this.errorMessage = error.message || 'Authentication failed. Please check your credentials.';
        }
    }

    async signUp() {
        this.errorMessage = '';
        try {
            await this.authService.register(this.signupName, this.signupEmail, this.signupPassword);
            await this.playLoginAnimation();
            this.router.navigate(['/dashboard']);
        } catch (error: any) {
            console.error('Registration failed', error);
            this.errorMessage = error.message || 'Registration failed. Please try again.';
        }
    }

    playLoginAnimation(): Promise<void> {
        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });

            // Fade out the auth card
            tl.to('.auth-card', {
                opacity: 0,
                y: 20,
                duration: 0.6,
                ease: 'power2.in'
            });

            // Disperse spheres
            tl.to('.sphere', {
                scale: 1.5,
                opacity: 0,
                duration: 1,
                stagger: 0.05,
                ease: 'power2.inOut'
            }, "-=0.3");

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
