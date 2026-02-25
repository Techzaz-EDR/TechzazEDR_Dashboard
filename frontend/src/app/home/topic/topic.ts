import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { gsap } from 'gsap';

@Component({
    selector: 'app-topic',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './topic.html',
    styleUrls: ['./topic.scss']
})
export class TopicComponent implements OnInit, AfterViewInit {
    @ViewChild('content') content!: ElementRef;

    topicName: string = '';
    topicData: any = {
        'pricing': { 
            title: 'Pricing Plans', 
            desc: 'Transparent pricing for enterprises of all sizes. Secure your infrastructure with flexible plans starting from $0.', 
            icon: '💰',
            features: ['Unlimited Endpoints', '24/7 Priority Support', 'Threat Intelligence Feeds']
        },
        'about': { 
            title: 'About Techzaz', 
            desc: 'Leading the way in simplified endpoint security for modern teams since 2024.', 
            icon: '🏢',
            features: ['Security-First Culture', 'Global Threat Lab', 'Innovative AI Engineering']
        },
        'features': {
            title: 'Platform Features',
            desc: 'Comprehensive protection across every layer of your digital ecosystem.',
            icon: '⚡',
            features: ['Behavioral Analysis', 'Network Containment', 'Cloud-Native Telemetry']
        },
        'roadmap': {
            title: 'Product Roadmap',
            desc: 'Visualizing the future of endpoint defense. See what is coming next.',
            icon: '🗺️',
            features: ['Zero-Trust Integration', 'Advanced Mobile Protection', 'Edge Intelligence']
        },
        'careers': {
            title: 'Join the Mission',
            desc: 'Build the future of cybersecurity with a team that values innovation and impact.',
            icon: '🚀',
            features: ['Remote-First', 'Equity Packages', 'Continuous Learning']
        },
        'contact': {
            title: 'Contact Us',
            desc: 'Reach out to our experts for demos, support, or partnership inquiries.',
            icon: '📧',
            features: ['Instant Response', 'Global Presence', 'Expert Support']
        },
        'blog': {
            title: 'Security Insights',
            desc: 'Latest research and updates from the frontline of cybersecurity.',
            icon: '✍️',
            features: ['Threat Analysis', 'Best Practices', 'Product Updates']
        },
        'docs': {
            title: 'Documentation',
            desc: 'Technical implementation guides and API references for developers.',
            icon: '📚',
            features: ['API Reference', 'SDK Downloads', 'Tutorials']
        },
        'support': {
            title: 'Support Center',
            desc: 'We are here to help you secure your environment 24/7.',
            icon: '🎧',
            features: ['Knowledge Base', 'Ticket System', 'Community Forum']
        }
    };

    currentTopic: any = { title: 'Topic Details', desc: 'Information about this security topic.', icon: '🛡️', features: [] };

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.topicName = params['name'] || '';
            this.loadTopicData();
        });
    }

    ngAfterViewInit() {
        this.animateIn();
    }

    loadTopicData() {
        const data = this.topicData[this.topicName];
        if (data) {
            this.currentTopic = data;
        } else {
            // Create a readable title from slug
            const title = this.topicName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            this.currentTopic = {
                title: title,
                desc: `Learn more about ${title} and how it enhances your endpoint security posture with Techzaz EDR.`,
                icon: '🛡️',
                features: ['Standard Security', 'Full Integration', '24/7 Visibility']
            };
        }
        
        // Re-trigger animation when topic changes
        setTimeout(() => this.animateIn(), 100);
    }

    animateIn() {
        if (!this.content) return;

        const tl = gsap.timeline();
        
        tl.fromTo('.topic-header', 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
        )
        .fromTo('.placeholder-content', 
            { opacity: 0, scale: 0.95 }, 
            { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
            '-=0.4'
        )
        .fromTo('.feature-pill', 
            { opacity: 0, x: -20 }, 
            { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
            '-=0.2'
        )
        .fromTo('.related-topics', 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
            '-=0.3'
        );
    }
}
