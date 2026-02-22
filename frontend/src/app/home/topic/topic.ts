import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
    selector: 'app-topic',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './topic.html',
    styleUrls: ['./topic.scss']
})
export class TopicComponent implements OnInit {
    topicName: string = '';
    topicData: any = {
        'pricing': { title: 'Pricing Plans', desc: 'Secure your infrastructure with flexible plans starting from $0.', icon: '💰' },
        'about-us': { title: 'About Techzaz', desc: 'Leading the way in simplified endpoint security for modern teams.', icon: '🏢' },
        'support-portal': { title: 'Support Portal', desc: 'Get help from our expert team 24/7.', icon: '🎧' },
        // Defaults for others
    };

    currentTopic: any = { title: 'Topic Details', desc: 'Information about this security topic.', icon: '🛡️' };

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.topicName = params['name'] || '';
            this.loadTopicData();
        });
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
                icon: '🛡️'
            };
        }
    }
}
