import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Important for @for and ngClass
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule,
    RefreshCw, Monitor, Eye
} from 'lucide-angular';

@Component({
    selector: 'app-threats',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './threats.html',
    styleUrl: './threats.scss',
})
export class Threats {
    // Icons
    readonly RefreshIcon = RefreshCw;
    readonly MonitorIcon = Monitor;
    readonly EyeIcon = Eye;

    isRefreshing = false;

    refresh() {
        this.isRefreshing = true;
        setTimeout(() => {
            this.isRefreshing = false;
        }, 1500);
    }

    // Classification Stats
    classificationStats = [
        { label: 'Malware', count: 145, trend: '+12%', color: 'critical' },
        { label: 'Exploits', count: 32, trend: '+5%', color: 'high' },
        { label: 'PUPs', count: 89, trend: '-2%', color: 'medium' },
        { label: 'Network Attacks', count: 24, trend: '+8%', color: 'high' },
        { label: 'Privilege Escalation', count: 7, trend: '0%', color: 'critical' }
    ];

    threats = [
        {
            id: 1,
            title: 'Suspicious Process Execution',
            description: 'Detected execution of unsigned binary from temp directory',
            endpoint: 'DESKTOP-001',
            time: '2 minutes ago',
            severity: 'critical',
            type: 'Malware',
            status: 'active',
            icon: '⚡'
        },
        {
            id: 2,
            title: 'Unauthorized Network Connection',
            description: 'Outbound connection to known C2 server detected',
            endpoint: 'LAPTOP-042',
            time: '15 minutes ago',
            severity: 'high',
            type: 'Network',
            status: 'investigating',
            icon: '🌐'
        },
        {
            id: 3,
            title: 'Malware Signature Detected',
            description: 'File matched known malware signature in threat database',
            endpoint: 'SERVER-005',
            time: '1 hour ago',
            severity: 'high',
            type: 'Malware',
            status: 'quarantined',
            icon: '⚠️'
        },
        {
            id: 4,
            title: 'Privilege Escalation Attempt',
            description: 'Detected attempt to escalate privileges using UAC bypass',
            endpoint: 'WORKSTATION-023',
            time: '3 hours ago',
            severity: 'high',
            type: 'Privilege Esc',
            status: 'blocked',
            icon: '🔒'
        },
        {
            id: 5,
            title: 'DNS Tunneling Detected',
            description: 'Suspicious DNS queries detected indicating data exfiltration',
            endpoint: 'DESKTOP-002',
            time: '5 hours ago',
            severity: 'medium',
            type: 'Network',
            status: 'investigating',
            icon: '🌐'
        },
        {
            id: 6,
            title: 'Legacy Protocol Usage',
            description: 'SMBv1 traffic detected on internal segment',
            endpoint: 'FILE-SRV-01',
            time: '2 days ago',
            severity: 'medium',
            type: 'Policy',
            status: 'resolved',
            icon: '⚠️'
        },
        {
            id: 7,
            title: 'Suspicious Admin Login',
            description: 'Login from unusual IP address detected',
            endpoint: 'DC-01',
            time: '2 weeks ago',
            severity: 'high',
            type: 'Account',
            status: 'investigating',
            icon: '👤'
        }
    ];

    // Filters
    filterSeverity = 'All Severities';
    filterStatus = 'All Status';
    filterTimeRange = 'Last 30 Days'; // Default to show more

    get filteredThreats() {
        return this.threats.filter(threat => {
            const matchSeverity = this.filterSeverity === 'All Severities' || threat.severity.toLowerCase() === this.filterSeverity.toLowerCase();
            const matchStatus = this.filterStatus === 'All Status' || threat.status.toLowerCase() === this.filterStatus.toLowerCase();

            const hoursAgo = this.parseTimeAgo(threat.time);
            let matchTime = true;

            if (this.filterTimeRange === 'Last 24 Hours') {
                matchTime = hoursAgo <= 24;
            } else if (this.filterTimeRange === 'Last 7 Days') {
                matchTime = hoursAgo <= (7 * 24);
            } else if (this.filterTimeRange === 'Last 30 Days') {
                matchTime = hoursAgo <= (30 * 24);
            }

            return matchSeverity && matchStatus && matchTime;
        });
    }

    parseTimeAgo(timeString: string): number {
        const value = parseInt(timeString);
        if (timeString.includes('minute')) return value / 60;
        if (timeString.includes('hour')) return value;
        if (timeString.includes('day')) return value * 24;
        if (timeString.includes('week')) return value * 24 * 7;
        return 0; // Just now or unknown
    }
}
