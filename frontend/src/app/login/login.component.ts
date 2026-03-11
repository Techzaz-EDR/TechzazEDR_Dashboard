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
    public screenWidth = 1920;
    public screenHeight = 1080;
    private glowElement: HTMLElement | null = null;

    // Cybersecurity Background Data
    binaryStreams: string[][] = [];
    networkNodes: any[] = [];
    networkLinks: any[] = [];

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
            this.generateCyberBackground();
        }

        this.route.queryParams.subscribe(params => {
            if (params['mode'] === 'signup') {
                this.isSignUpMode = true;
            }
        });
    }

    generateCyberBackground() {
        // Binary Streams
        const streamCount = 20;
        for (let i = 0; i < streamCount; i++) {
            const length = Math.floor(Math.random() * 20) + 10;
            const chars = Array.from({ length }, () => Math.random() > 0.5 ? '1' : '0');
            this.binaryStreams.push(chars);
        }

        // Network Nodes
        const nodeCount = 15;
        for (let i = 0; i < nodeCount; i++) {
            this.networkNodes.push({
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 3 + 2,
                opacity: Math.random() * 0.5 + 0.2,
                duration: Math.random() * 10 + 10,
                delay: Math.random() * -20
            });
        }

        // Links between nodes (simple random links)
        for (let i = 0; i < nodeCount; i++) {
            const targets = [ (i + 1) % nodeCount, (i + 3) % nodeCount ];
            targets.forEach(t => {
                this.networkLinks.push({
                    source: i,
                    target: t,
                    opacity: Math.random() * 0.2 + 0.1
                });
            });
        }
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

            // 1. Highlight line starts at the 3 edge trim lines and comes into the node
            tl.to('.anim-trim', {
                strokeDashoffset: 0,
                duration: 1.2,
                ease: 'power1.inOut'
            });

            // 2. The little dots in the nodes start glowing
            tl.to('.anim-node-dots-glow', {
                opacity: 1,
                duration: 0.8,
                ease: 'power1.inOut'
            }, "-=0.4");

            // 3. Highlight line comes out of the node and goes along the 4 connection lines
            tl.to('.anim-conn', {
                strokeDashoffset: 0,
                duration: 4.5,
                ease: 'power1.inOut'
            });

            // 4. Little 4 highlighted dots at the card connections glow
            tl.to('.anim-card-dots', {
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out'
            }, "-=0.2");

            // 5. Highlight line goes around the border of the box smoothly
            tl.to('.anim-card-border', {
                strokeDashoffset: 0,
                duration: 2.0,
                ease: 'power1.inOut'
            });

            // Brief pause before dashboard opens
            tl.to({}, { duration: 0.6 });
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
