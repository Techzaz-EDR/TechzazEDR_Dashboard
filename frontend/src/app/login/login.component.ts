import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, User, Lock, Mail, Twitter, Linkedin, Globe, Github, X } from 'lucide-angular';
import { gsap } from 'gsap';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit {
    showPassword = false;
    isSignUpMode = false;

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

    constructor(private router: Router) { }

    ngAfterViewInit() {
        this.glowElement = document.querySelector('.hover-glow');
        // Initial state
        if (this.glowElement) {
            gsap.set(this.glowElement, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
        }
    }

    onMouseMove(e: MouseEvent) {
        if (!this.glowElement) return;

        // Make visible on first move within container
        if (!this.glowElement.classList.contains('visible')) {
            this.glowElement.classList.add('visible');
        }

        // Ultra-smooth cursor tracking using GSAP (Spring effect)
        gsap.to(this.glowElement, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.8,
            ease: "power2.out"
        });

        // Eased Card Tilt
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

    signIn() {
        this.router.navigate(['/dashboard']);
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    toggleMode() {
        this.isSignUpMode = !this.isSignUpMode;
    }
}
