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
            status: 'active'
        },
        {
            id: 2,
            title: 'Unauthorized Network Connection',
            description: 'Outbound connection to known C2 server detected',
            endpoint: 'LAPTOP-042',
            time: '15 minutes ago',
            severity: 'high',
            type: 'Network',
            status: 'investigating'
        },
        {
            id: 3,
            title: 'Malware Signature Detected',
            description: 'File matched known malware signature in threat database',
            endpoint: 'SERVER-005',
            time: '1 hour ago',
            severity: 'high',
            type: 'Malware',
            status: 'quarantined'
        },
        {
            id: 4,
            title: 'Privilege Escalation Attempt',
            description: 'Detected attempt to escalate privileges using UAC bypass',
            endpoint: 'WORKSTATION-023',
            time: '3 hours ago',
            severity: 'high',
            type: 'Privilege Esc',
            status: 'blocked'
        },
        {
            id: 5,
            title: 'DNS Tunneling Detected',
            description: 'Suspicious DNS queries detected indicating data exfiltration',
            endpoint: 'DESKTOP-002',
            time: '5 hours ago',
            severity: 'medium',
            type: 'Network',
            status: 'investigating'
        },
        {
            id: 6,
            title: 'Legacy Protocol Usage',
            description: 'SMBv1 traffic detected on internal segment',
            endpoint: 'FILE-SRV-01',
            time: '2 days ago',
            severity: 'medium',
            type: 'Policy',
            status: 'resolved'
        },
        {
            id: 7,
            title: 'Suspicious Admin Login',
            description: 'Login from unusual IP address detected',
            endpoint: 'DC-01',
            time: '2 weeks ago',
            severity: 'high',
            type: 'Account',
            status: 'investigating'
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

    // Interactive Chart Logic
    readonly chartData = [20, 40, 30, 80, 60, 90, 70, 100, 60, 40, 50, 30, 40];
    readonly svgWidth = 600;
    readonly svgHeight = 120;

    hovering = false;
    hoverX = 0;
    hoverY = 0;
    tooltipX = 0;
    tooltipY = 0;
    currentValue = 0;
    currentTime = '';

    get linePath() {
        const step = this.svgWidth / (this.chartData.length - 1);
        return this.chartData.map((val, i) => `${i === 0 ? 'M' : 'L'}${i * step},${this.svgHeight - val}`).join(' ');
    }

    get areaPath() {
        const step = this.svgWidth / (this.chartData.length - 1);
        const points = this.chartData.map((val, i) => `L${i * step},${this.svgHeight - val}`).join(' ');
        // Area includes bottom corners
        return `M0,${this.svgHeight} ${points} L${this.svgWidth},${this.svgHeight} Z`;
    }

    onMouseMove(event: MouseEvent) {
        const container = event.currentTarget as HTMLElement;
        const svg = container.querySelector('svg');
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const step = rect.width / (this.chartData.length - 1);
        const index = Math.round(x / step);
        const clampedIndex = Math.max(0, Math.min(this.chartData.length - 1, index));

        this.hovering = true;
        this.hoverX = clampedIndex * (this.svgWidth / (this.chartData.length - 1));
        this.currentValue = this.chartData[clampedIndex];
        this.hoverY = this.svgHeight - this.currentValue;

        this.tooltipX = x + 15;
        this.tooltipY = y - 40;

        // Mock time based on 24h index
        const hour = clampedIndex * 2;
        this.currentTime = `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`;

        if (this.tooltipX > rect.width - 120) {
            this.tooltipX = x - 130;
        }
    }

    onMouseLeave() {
        this.hovering = false;
    }
}
