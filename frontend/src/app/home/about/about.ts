import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Target, Eye, Users, Linkedin, Github, Layout, ArrowRight } from 'lucide-angular';
import { gsap } from 'gsap';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, RouterLink, LucideAngularModule],
    templateUrl: './about.html',
    styleUrls: ['./about.scss']
})
export class AboutComponent implements OnInit, AfterViewInit {
    readonly Shield = Shield;
    readonly Target = Target;
    readonly Eye = Eye;
    readonly Users = Users;
    readonly Linkedin = Linkedin;
    readonly Github = Github;
    readonly Layout = Layout;
    readonly ArrowRight = ArrowRight;

    teamMembers = [
        {
            name: 'Inuka Wijerathna',
            role: 'Project Lead',
            avatar: '/assets/team/avatar-male.svg',
            linkedin: 'https://www.linkedin.com/in/inukawijerathna',
            github: '#'
        },
        {
            name: 'Imesh Silva',
            role: 'Technical Lead',
            avatar: '/assets/team/avatar-male.svg',
            linkedin: '#',
            github: '#'
        },
        {
            name: 'Kavya Dissanayake',
            role: 'Frontend Lead',
            avatar: '/assets/team/avatar-female.svg',
            linkedin: 'https://www.linkedin.com/in/kavya-dissanayake-95a463263/',
            github: '#'
        },
        {
            name: 'Limuthu Lohiru',
            role: 'Backend Lead',
            avatar: '/assets/team/avatar-male.svg',
            linkedin: 'https://www.linkedin.com/in/limuthu',
            github: '#'
        },
        {
            name: 'Tharuki Jayasuriya',
            role: 'Architecture & Documentation Lead',
            avatar: '/assets/team/avatar-female.svg',
            linkedin: 'https://www.linkedin.com/in/tharuki-jayasuriya-a9a8b3319',
            github: '#'
        },
        {
            name: 'Yeheni Alwis',
            role: 'QA & Validation Lead',
            avatar: '/assets/team/avatar-female.svg',
            linkedin: 'https://www.linkedin.com/in/yeheni-alwis-3836a5353',
            github: '#'
        }
    ];

    constructor() { }

    ngOnInit(): void { }

    ngAfterViewInit(): void {
        this.initAnimations();
    }

    private initAnimations() {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('.about-hero h1', { opacity: 0, y: 30, duration: 1 })
          .from('.about-hero p', { opacity: 0, y: 20, duration: 0.8 }, '-=0.6')
    }
}
