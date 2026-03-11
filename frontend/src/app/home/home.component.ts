import { Component, HostListener, ElementRef, ViewChild, ViewChildren, QueryList, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Activity, Cloud, Lock, Cpu, Radar, Zap, FileText, Youtube, Users, Check, Crosshair, Eye, Bot, Brain, Globe, BarChart, X, Bug, Twitter, Linkedin, Server, Network, Search, Fingerprint, Share2, Key, Upload, Layout, Rocket, Play } from 'lucide-angular';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        LucideAngularModule
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
    // Icon Configuration
    readonly Shield = Shield;
    readonly Lock = Lock;
    readonly Cloud = Cloud;
    readonly Crosshair = Crosshair;
    readonly Zap = Zap;
    readonly Activity = Activity;
    readonly Eye = Eye;
    readonly Bot = Bot;
    readonly Brain = Brain;
    readonly Globe = Globe;
    readonly Radar = Radar;
    readonly Check = Check;
    readonly X = X;
    readonly Server = Server;
    readonly Cpu = Cpu;
    readonly Network = Network;
    readonly Search = Search;
    readonly Fingerprint = Fingerprint;
    readonly FileText = FileText;
    readonly Users = Users;
    readonly BarChart = BarChart;
    readonly Twitter = Twitter;
    readonly Linkedin = Linkedin;
    readonly Youtube = Youtube;
    readonly Bug = Bug;
    readonly Share2 = Share2;
    readonly Key = Key;
    readonly Upload = Upload;
    readonly Layout = Layout;
    readonly Rocket = Rocket;
    readonly Play = Play;

    // State
    scrolled = false;

    // Hero animated background data streams
    dataStreams = Array.from({ length: 20 }, (_, i) => ({
        left: (i * 5 + Math.random() * 3) + '%',
        duration: (3 + Math.random() * 4) + 's',
        delay: (Math.random() * 5) + 's',
        opacity: (0.15 + Math.random() * 0.35).toString()
    }));

    // Hero Animation Data
    headlineLine1 = Array.from("Next-Gen Endpoint");
    headlineLine2 = Array.from("Detection & Response");

    // 3D Text Interaction
    heroMouseX = 0;
    heroMouseY = 0;
    heroTiltX = 0;
    heroTiltY = 0;

    // Preloader State
    step = 0;

    @ViewChild('navbar') navbar!: ElementRef;
    @ViewChildren('navItem') navItems!: QueryList<ElementRef>;
    @ViewChild('ctaBtn') ctaBtn!: ElementRef;
    @ViewChild('coreScene') coreScene!: ElementRef;
    @ViewChild('coreAssembly') coreAssembly!: ElementRef;
    @ViewChild('preloader') preloader!: ElementRef;
    @ViewChild('progressBar') progressBar!: ElementRef;
    @ViewChild('progressGlow') progressGlow!: ElementRef;
    @ViewChild('energyPulse') energyPulse!: ElementRef;
    @ViewChild('finalFlash') finalFlash!: ElementRef;
    @ViewChild('particlesContainer') particlesContainer!: ElementRef;
    @ViewChild('centerAssembly') centerAssembly!: ElementRef;
    @ViewChild('cyberCanvas') cyberCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
    @ViewChild('dashboardInterface') dashboardInterface!: ElementRef;
    @ViewChild('stepperRow') stepperRow!: ElementRef;
    @ViewChild('glowPath') glowPath!: ElementRef;

    constructor(private cdr: ChangeDetectorRef) { }

    private cyberAnimId = 0;

    ngOnDestroy() {
        cancelAnimationFrame(this.cyberAnimId);
    }

    scrollToSection(sectionId: string, event: Event) {
        event.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    ngAfterViewInit() {
        // Initial set to prevent FOUC
        gsap.set('.hero-background', { opacity: 0 });
        gsap.set('.visual-scene', { opacity: 0, scale: 0.95 });
        gsap.set('.energy-core', { scale: 0.9, opacity: 0 });
        gsap.set('.hero-headline', { opacity: 0, y: 50 });
        gsap.set('.hero-subheadline', { opacity: 0, y: 30 });
        gsap.set('.cta-actions .btn', { opacity: 0, y: 20 });
        gsap.set('.navbar', { y: -100, opacity: 0 });

        this.initNavbar3D();
        this.initCore3D();
        this.initScrollAnimations();
        this.createParticles();
        this.initPreloaderParallax();

        // Slight delay to ensure rendering performance check
        setTimeout(() => this.initHeroIntro(), 100);
        // Start canvas immediately
        this.initCyberNetwork();
    }

    private initCyberNetwork() {
        const canvas = this.cyberCanvas?.nativeElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let cw = window.innerWidth;
        let ch = window.innerHeight;

        const resize = () => {
            cw = window.innerWidth;
            ch = window.innerHeight;
            canvas.width = cw * window.devicePixelRatio;
            canvas.height = ch * window.devicePixelRatio;
            ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        interface Node { x: number; y: number; vx: number; vy: number; ip: string; color: string; size: number; }

        const ips = [
            '192.168.1.105', '10.0.0.42', '172.16.0.8', '203.0.113.50', '198.51.100.23',
            '64.48.114.127', '157.240.16.35', '105.120.194.241', '176.103.131.209', '216.58.211.14',
            '91.108.56.121', '151.101.1.140', '104.26.10.78', '23.227.38.65', '13.107.42.14',
            '185.125.190.36', '208.67.222.222', '1.1.1.1', '8.8.8.8', '45.33.32.156',
            '93.184.216.34', '52.85.132.96', '140.82.121.4', '199.232.69.194', '162.159.135.42',
            '76.76.21.21', '9.9.9.9', '208.91.112.55', '195.46.39.39', '119.29.29.29',
            '185.199.108.153', '151.101.65.69', '104.244.42.129', '31.13.65.36', '157.240.1.35'
        ];
        const colors = ['#00e5ff', '#ff3d3d', '#ffffff', '#00e5ff', '#00e5ff', '#ff3d3d'];

        const nodeCount = 35;
        const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => ({
            x: Math.random() * (cw || window.innerWidth),
            y: Math.random() * (ch || window.innerHeight),
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            ip: ips[i % ips.length],
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 2 + 1.5
        }));

        const maxDist = 220;

        const animate = () => {
            ctx.clearRect(0, 0, cw, ch);

            // Update positions
            for (const n of nodes) {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > cw) n.vx *= -1;
                if (n.y < 0 || n.y > ch) n.vy *= -1;
            }

            // Draw connections
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * 0.6;
                        const isRed = nodes[i].color === '#ff3d3d' || nodes[j].color === '#ff3d3d';
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = isRed
                            ? `rgba(255, 61, 61, ${alpha})`
                            : `rgba(0, 229, 255, ${alpha})`;
                        ctx.lineWidth = isRed ? 1.5 : 1;
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes and labels
            for (const n of nodes) {
                // Glow
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.size + 4, 0, Math.PI * 2);
                ctx.fillStyle = n.color === '#ff3d3d'
                    ? 'rgba(255, 61, 61, 0.15)'
                    : 'rgba(0, 229, 255, 0.15)';
                ctx.fill();

                // Node dot
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
                ctx.fillStyle = n.color;
                ctx.fill();

                // IP label
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
                ctx.fillText(n.ip, n.x + 6, n.y - 6);
            }

            this.cyberAnimId = requestAnimationFrame(animate);
        };

        animate();
    }

    createParticles() {
        if (!this.particlesContainer) return;
        const container = this.particlesContainer.nativeElement;
        const count = 30;

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 3 + 1;
            const isBlue = Math.random() > 0.4;

            Object.assign(p.style, {
                position: 'absolute',
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: isBlue ? '#3b82f6' : '#8b5cf6',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: (Math.random() * 0.5 + 0.2).toString(),
                filter: 'blur(1px)',
                boxShadow: `0 0 10px ${isBlue ? '#3b82f6' : '#8b5cf6'}`
            });

            container.appendChild(p);

            // Random floating motion
            gsap.to(p, {
                x: `random(-100, 100)`,
                y: `random(-100, 100)`,
                duration: `random(10, 20)`,
                repeat: -1,
                yoyo: true,
                ease: "none"
            });
        }
    }

    initPreloaderParallax() {
        window.addEventListener('mousemove', (e) => {
            if (!this.preloader || this.preloader.nativeElement.style.display === 'none') return;

            const x = (e.clientX - window.innerWidth / 2) / window.innerWidth;
            const y = (e.clientY - window.innerHeight / 2) / window.innerHeight;

            if (this.centerAssembly) {
                gsap.to(this.centerAssembly.nativeElement, {
                    rotationY: x * 10,
                    rotationX: -y * 10,
                    duration: 1,
                    ease: "power2.out"
                });
            }

            gsap.to('.digital-grid-floor', {
                x: x * 30,
                duration: 1.5,
                ease: "power2.out"
            });
        });
    }

    initHeroIntro() {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        const preloader = this.preloader?.nativeElement;

        // PART 1: CINEMATIC PRELOADER SEQUENCE
        if (preloader) {
            const preTl = gsap.timeline();

            // Initial states for preloader elements
            gsap.set('.center-assembly', { opacity: 0, scale: 0.9 });
            gsap.set('.brand-logo', { opacity: 0, y: 20 });
            gsap.set('.loader-metrics', { opacity: 0 });

            preTl
                // 1. Background elements appear
                .to('.preloader-bg-ambient', { duration: 1.5, opacity: 1 })

                // 2. Logo Reveal
                .to('.center-assembly', { duration: 1, opacity: 1, scale: 1 }, "-=1")
                .to('.brand-logo', { duration: 1, opacity: 1, y: 0, filter: 'blur(0px)', ease: "power2.out" }, "-=0.5")

                // 4. Progress & Status Sequence
                .to('.loader-metrics', { duration: 0.8, opacity: 1 }, "-=0.3")
                .to(this.progressBar.nativeElement, {
                    width: '100%',
                    duration: 3,
                    ease: "power1.inOut",
                    onUpdate: () => {
                        const progress = parseFloat(this.progressBar.nativeElement.style.width);
                        let changed = false;
                        if (progress > 20 && this.step < 1) { this.step = 1; changed = true; }
                        if (progress > 50 && this.step < 2) { this.step = 2; changed = true; }
                        if (progress > 80 && this.step < 3) { this.step = 3; changed = true; }
                        if (changed) this.cdr.detectChanges();
                    }
                })
                .call(() => { this.step = 4; this.cdr.detectChanges(); }) // SYSTEM READY

                // 5. Final Pulse & Flash
                .to(this.energyPulse.nativeElement, {
                    duration: 0.8,
                    width: "200vw",
                    height: "200vw",
                    opacity: 1,
                    ease: "power4.out"
                }, "+=0.2")
                .to(this.finalFlash.nativeElement, { duration: 0.4, opacity: 1 }, "-=0.2")

                // 6. Exit Transition
                .to(preloader, {
                    duration: 0.8,
                    opacity: 0,
                    pointerEvents: 'none',
                    display: 'none'
                })
                .to(this.finalFlash.nativeElement, { duration: 0.8, opacity: 0 });

            tl.add(preTl, 0);
        }

        // PART 2: HERO INTRO
        const heroStart = preloader ? ">-0.5" : 0;

        // Start video playback
        const vid = this.heroVideo?.nativeElement;
        if (vid) { vid.muted = true; vid.currentTime = 0; vid.play().catch(() => {}); }

        tl.to('.hero-background', { duration: 1.5, opacity: 1 }, heroStart)
            .to('.navbar', { duration: 1, y: 0, opacity: 1 }, "-=1")
            .to('.visual-scene', { duration: 1.5, opacity: 1, scale: 1 }, "-=0.5")
            .to('.energy-core', { duration: 1.5, scale: 1, opacity: 1, ease: "power2.out" }, "-=1")
            .to('.hero-headline', {
                duration: 1,
                opacity: 1,
                y: 0
            }, "-=1.5")
            .to('.hero-subheadline', { duration: 1, opacity: 1, y: 0 }, "-=1")
            .to('.cta-actions .btn', {
                duration: 0.8,
                opacity: 1,
                y: 0,
                stagger: 0.2
            }, "-=0.8");
    }

    initCore3D() {
        if (!this.coreScene || !this.coreAssembly) return;

        const scene = this.coreScene.nativeElement;
        const assembly = this.coreAssembly.nativeElement;

        // Mouse Move Effect (Tilt & Parallax)
        scene.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = scene.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
            const relY = (e.clientY - rect.top) / rect.height - 0.5;

            // Tilt Assembly
            gsap.to(assembly, {
                duration: 1,
                rotationY: relX * 25,
                rotationX: relY * -25,
                ease: "power2.out"
            });

            // Shift Elements (Parallax)
            const rings = scene.querySelectorAll('.segmented-ring');
            const beams = scene.querySelectorAll('.v-beam');

            gsap.to(rings, {
                duration: 1.2,
                x: relX * -20,
                y: relY * -20,
                ease: "power2.out"
            });

            gsap.to(beams, {
                duration: 2,
                x: relX * 40,
                y: relY * 40,
                ease: "power2.out"
            });
        });

        // Reset on Leave
        scene.addEventListener('mouseleave', () => {
            gsap.to(assembly, {
                duration: 1.5,
                rotationY: 0,
                rotationX: 0,
                ease: "elastic.out(1, 0.5)"
            });

            const rings = scene.querySelectorAll('.holo-ring');
            gsap.to(rings, {
                duration: 1.5,
                x: 0,
                y: 0,
                ease: "elastic.out(1, 0.5)"
            });
        });
    }

    initScrollAnimations() {
        // 0. Set Initial States (Prevent FOUC)
        gsap.set('.sc-grid-card, .pricing-card, .section-header, .feature-icon, .feature-card, .audience-card, .cap-item, .preview-text h2, .preview-text .lead, .feature-list li, .why-edr h2, .why-edr .lead, .why-edr .point', {
            opacity: 0,
            y: 50
        });

        // Initialize How It Works states
        gsap.set('.dashboard-interface', { opacity: 0 });
        gsap.set('.step-item', { opacity: 0, x: -50 });
        gsap.set('.glow-path', { width: 0 });

        gsap.set('.comparison-card', {
            opacity: 0,
            scale: 0.8,
            rotateX: -20
        });

        gsap.set('.comparison-card .side', { opacity: 0 });

        // 1. Section Headers (Fade Up)
        ScrollTrigger.batch('.section-header, .preview-text h2, .preview-text .lead, .why-edr h2, .why-edr .lead', {
            onEnter: batch => gsap.to(batch, {
                opacity: 1,
                y: 0,
                stagger: 0.15,
                duration: 1,
                ease: "power3.out"
            }),
            start: "top 85%"
        });

        // 2. Feature/Grid/Audience Cards & List Items (Staggered Slide Up)
        ScrollTrigger.batch('.sc-grid-card, .feature-card, .audience-card, .cap-item, .feature-list li, .why-edr .point', {
            interval: 0.1, // Wait between batches
            onEnter: batch => gsap.to(batch, {
                opacity: 1,
                y: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: "back.out(1.2)"
            }),
            start: "top 90%"
        });

        // 2.5 Why EDR Comparison Card Special Reveal
        ScrollTrigger.create({
            trigger: '.comparison-card',
            start: "top 80%",
            onEnter: () => {
                const tl = gsap.timeline();
                tl.to('.comparison-card', {
                    opacity: 1,
                    scale: 1,
                    rotateX: 0,
                    duration: 1,
                    ease: "power4.out"
                })
                    .to('.comparison-card .side.traditional', {
                        opacity: 1,
                        duration: 0.5
                    }, "-=0.2")
                    .to('.comparison-card .side.next-gen', {
                        opacity: 1,
                        duration: 0.5
                    }, "-=0.2");
            }
        });

        // 2.6 Futuristic "How It Works" Sequence
        ScrollTrigger.create({
            trigger: '.how-it-works',
            start: "top 70%",
            onEnter: () => {
                const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

                tl.to('.dashboard-interface', {
                    opacity: 1,
                    duration: 0.5
                })
                    .to('.step-item', {
                        opacity: 1,
                        x: 0,
                        stagger: 0.2,
                        duration: 1.2,
                        ease: "expo.out"
                    }, "-=0.2")
                    .to('.glow-path', {
                        width: "100%",
                        duration: 2.5,
                        ease: "power2.inOut"
                    }, "-=2.2");
            }
        });

        // 3. Interactive Mouse Effect for 3D Cards
        const cards = document.querySelectorAll('.audience-card, .cap-item');
        cards.forEach((card: any) => {
            card.addEventListener('mousemove', (e: MouseEvent) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
                card.style.setProperty('--mouse-angle', `${Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90}deg`);
            });
        });

        // 3. Pricing Cards (3D Tilt Effect Entrance)
        gsap.utils.toArray<HTMLElement>('.pricing-card').forEach((card, i) => {
            gsap.fromTo(card,
                { opacity: 0, y: 100, rotationX: 15 },
                {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                    },
                    opacity: 1,
                    y: 0,
                    rotationX: 0,
                    duration: 1,
                    delay: i * 0.1, // Manual stagger
                    ease: "power2.out"
                }
            );
        });

        // 4. Footer Reveal
        gsap.from('.footer-container', {
            scrollTrigger: {
                trigger: '.footer',
                start: "top 95%"
            },
            opacity: 0,
            y: 30,
            duration: 1.2,
            ease: "power2.out"
        });
    }

    initNavbar3D() {
        const navEl = this.navbar.nativeElement;

        // 1. 3D Tilt on Navbar
        gsap.set(navEl, { transformStyle: "preserve-3d", perspective: 1000 });

        navEl.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = navEl.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width - 0.5;
            const relY = (e.clientY - rect.top) / rect.height - 0.5;

            gsap.to(navEl, {
                duration: 0.5,
                rotationY: relX * 10, // Max 5 deg tilt
                rotationX: relY * -10,
                ease: "power2.out",
                overwrite: "auto"
            });
        });

        navEl.addEventListener('mouseleave', () => {
            gsap.to(navEl, {
                duration: 0.8,
                rotationY: 0,
                rotationX: 0,
                ease: "elastic.out(1, 0.5)",
                overwrite: "auto"
            });
        });

        // 2. Nav Items Hover
        this.navItems.forEach((item) => {
            const el = item.nativeElement;
            el.addEventListener('mouseenter', () => {
                gsap.to(el, {
                    duration: 0.3,
                    y: -4,
                    scale: 1.05,
                    color: "#ffffff",
                    textShadow: "0 0 12px rgba(59, 130, 246, 0.6)",
                    ease: "back.out(1.7)"
                });
            });

            el.addEventListener('mouseleave', () => {
                gsap.to(el, {
                    duration: 0.3,
                    y: 0,
                    scale: 1,
                    color: "#94a3b8",
                    textShadow: "none",
                    ease: "power2.out"
                });
            });
        });

        // 3. CTA Pulse & Scale
        const btn = this.ctaBtn.nativeElement;
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn, {
                duration: 0.3,
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(37, 99, 235, 0.6)",
                ease: "back.out(1.5)"
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                duration: 0.3,
                scale: 1,
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                ease: "power2.out"
            });
        });

        btn.addEventListener('mousedown', () => {
            gsap.to(btn, { duration: 0.1, scale: 0.95 });
        });

        btn.addEventListener('mouseup', () => {
            gsap.to(btn, { duration: 0.1, scale: 1.05 });
        });
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        const offset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.scrolled = offset > 50;
    }

    onHeroMouseMove(event: MouseEvent) {
        // Calculate relative to window center for a global feel
        const x = (event.clientX / window.innerWidth) - 0.5;
        const y = (event.clientY / window.innerHeight) - 0.5;

        // Calculate tilt (max 20deg) - Invert Y for correct 3D feel
        this.heroTiltX = y * -20;
        this.heroTiltY = x * 20;
    }

    onHeroMouseLeave() {
        this.heroTiltX = 0;
        this.heroTiltY = 0;
    }
}
