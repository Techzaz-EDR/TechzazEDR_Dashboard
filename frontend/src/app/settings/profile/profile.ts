import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Zap, Key, CheckCircle, User } from 'lucide-angular';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
    templateUrl: './profile.html',
    styleUrls: ['./profile.scss']
})
export class Profile {
    readonly Shield = Shield;
    readonly Zap = Zap;
    readonly Key = Key;
    readonly CheckCircle = CheckCircle;
    readonly User = User;

    user = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@techzaz.com',
        role: 'Senior Security Operations Lead',
        phone: '+1 (555) 942-0101',
        bio: 'Overseeing global endpoint security and incident response protocols. Specialized in threat hunting and automated remediation at scale.',
        timezone: 'UTC-5 (Eastern Time)',
        clearance: 'Level 5 (Full Access)',
        managedEndpoints: 1240,
        lastLogin: 'Today at 08:45 AM',
        status: 'Active'
    };

    securityStats = [
        { label: 'Incidents Resolved', value: '142', trend: '+12%', color: '#10b981' },
        { label: 'Security Score', value: '98/100', trend: '+5%', color: '#8b5cf6' },
        { label: 'Active Policies', value: '24', trend: 'Stable', color: '#6366f1' }
    ];

    recentActivity = [
        { type: 'policy', action: 'Updated Firewall Policy', target: 'Global HQ', time: '2 hours ago', icon: Shield },
        { type: 'incident', action: 'Resolved Critical Threat', target: 'Endpoint 082', time: '5 hours ago', icon: Zap },
        { type: 'access', action: 'Authorized New Admin', target: 'Sarah Chen', time: 'Yesterday', icon: Key }
    ];

    isEditing = false;

    saveProfile() {
        this.isEditing = false;
        console.log('Profile saved', this.user);
    }
}
