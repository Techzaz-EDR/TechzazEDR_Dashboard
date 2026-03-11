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
    
    // Dynamic Path Geometry properties
    topLeftPath = '';
    topRightPath = '';
    bottomLeftPath = '';
    bottomRightPath = '';
    
    // Dot coords
    dotTL = {x: 0, y: 0};
    dotTR = {x: 0, y: 0};
    dotBL = {x: 0, y: 0};
    dotBR = {x: 0, y: 0};

    constructor(private router: Router, private authService: AuthService, private route: ActivatedRoute) { }

    @HostListener('window:resize')
    onResize() {
        if (typeof window !== 'undefined') {
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
            this.updateSvgPaths();
        }
    }

    updateSvgPaths() {
        const cx = this.screenWidth / 2;
        const cy = this.screenHeight / 2;

        const cardWidth = 380;
        const halfCard = cardWidth / 2;
        const cardLeft = cx - halfCard;
        const cardRight = cx + halfCard;

        // Connections slightly vertically inside the card bounds
        const connectTopY = cy - 200;
        const connectBotY = cy + 200;

        // Top Left Route - 45 degree exact route from Node(140, 47) to card
        const tlDy = connectTopY - 47;
        const tlTurnX = cardLeft - tlDy - 20; 
        this.topLeftPath = `M 140,47 L ${tlTurnX},47 L ${cardLeft - 20},${connectTopY} L ${cardLeft},${connectTopY}`;
        this.dotTL = { x: cardLeft, y: connectTopY };

        // Bottom Left Route - Node(140, screenHeight - 47)
        const blNodeY = this.screenHeight - 47;
        const blDy = blNodeY - connectBotY;
        const blTurnX = cardLeft - blDy - 20;
        this.bottomLeftPath = `M 140,${blNodeY} L ${blTurnX},${blNodeY} L ${cardLeft - 20},${connectBotY} L ${cardLeft},${connectBotY}`;
        this.dotBL = { x: cardLeft, y: connectBotY };

        // Top Right Route - Node(screenWidth - 140, 47)
        const trNodeX = this.screenWidth - 140;
        const trTurnX = cardRight + tlDy + 20;
        this.topRightPath = `M ${trNodeX},47 L ${trTurnX},47 L ${cardRight + 20},${connectTopY} L ${cardRight},${connectTopY}`;
        this.dotTR = { x: cardRight, y: connectTopY };

        // Bottom Right Route
        const brNodeX = this.screenWidth - 140;
        const brTurnX = cardRight + blDy + 20;
        this.bottomRightPath = `M ${brNodeX},${blNodeY} L ${brTurnX},${blNodeY} L ${cardRight + 20},${connectBotY} L ${cardRight},${connectBotY}`;
        this.dotBR = { x: cardRight, y: connectBotY };
    }

    ngOnInit() {
        if (typeof window !== 'undefined') {
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
            this.updateSvgPaths();
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
