import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
    LucideAngularModule,
    RefreshCw, Monitor, Eye
} from 'lucide-angular';
import { FirestoreService } from '../../core/services/firestore.service';

type ThreatLogEntry = {
    id: string; // Changed from number to string for Firestore doc IDs
    title: string;
    description: string;
    endpoint: string;
    time: string;
    severity: string;
    type: string;
    status: string;
    icon: string;
    rawTime?: any;
};

@Component({
    selector: 'app-threats',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './threats.html',
    styleUrl: './threats.scss',
})
export class Threats implements OnInit, OnDestroy {
    private subs = new Subscription();

    // Icons
    readonly RefreshIcon = RefreshCw;
    readonly MonitorIcon = Monitor;
    readonly EyeIcon = Eye;

    isRefreshing = false;

    constructor(
        private firestoreService: FirestoreService,
        private cdr: ChangeDetectorRef,
        private zone: NgZone
    ) {}

    ngOnInit() {
        this.loadThreats();
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    private loadThreats() {
        this.isRefreshing = true;
        this.subs.add(
            this.firestoreService.getOrganizationAlerts().subscribe(alerts => {
                this.zone.run(() => {
                    this.threats = alerts.map(alert => ({
                        id: alert.id,
                        title: alert.RuleId || alert.title || 'Security Alert',
                        description: alert.Details?.msg || alert.description || 'No additional details available.',
                        endpoint: alert.agent_id || 'Unknown',
                        time: alert.time || 'Recently',
                        rawTime: alert.Timestamp || alert.timestamp,
                        severity: (alert.Severity || alert.severity || 'medium').toLowerCase(),
                        type: alert.Category || alert.type || 'Detection',
                        status: (alert.Status || alert.status || 'active').toLowerCase(),
                        icon: this.getIconForCategory(alert.Category || alert.type || '')
                    }));
                    
                    this.updateStats();
                    this.isRefreshing = false;
                    this.cdr.detectChanges();
                });
            })
        );
    }

    private getIconForCategory(category: string): string {
        const cat = category.toLowerCase();
        if (cat.includes('malware')) return '⚡';
        if (cat.includes('network')) return '🌐';
        if (cat.includes('account') || cat.includes('user')) return '👤';
        return '⚠️';
    }

    refresh() {
        // Since Firestore is real-time, we just trigger a visual refresh state
        this.isRefreshing = true;
        setTimeout(() => {
            this.isRefreshing = false;
            this.cdr.detectChanges();
        }, 1000);
    }

    // Classification Stats
    classificationStats: any[] = [
        { label: 'Malware', count: 0, trend: '0%', color: 'critical' },
        { label: 'Exploits', count: 0, trend: '0%', color: 'high' },
        { label: 'PUPs', expandedLabel: 'Potentially Unwanted Programs', count: 0, trend: '0%', color: 'medium' },
        { label: 'Network Attacks', count: 0, trend: '0%', color: 'high' }
    ];

    private updateStats() {
        const statsMapping = [
            { label: 'Malware', categories: ['malware', 'virus', 'trojan', 'ransomware'], count: 0, color: 'critical' },
            { label: 'Exploits', categories: ['exploit', 'vulnerability', 'cve'], count: 0, color: 'high' },
            { label: 'PUPs', categories: ['pup', 'adware', 'unwanted'], count: 0, color: 'medium', expandedLabel: 'Potentially Unwanted Programs' },
            { label: 'Network Attacks', categories: ['network', 'dns', 'brute', 'scanning'], count: 0, color: 'high' }
        ];

        this.threats.forEach(t => {
            const type = t.type.toLowerCase();
            const stat = statsMapping.find(s => s.categories.some(c => type.includes(c)));
            if (stat) {
                stat.count++;
            }
        });

        this.classificationStats = statsMapping.map(s => ({
            label: s.label,
            count: s.count,
            trend: '0%', // Mock trend for now
            color: s.color,
            expandedLabel: s.expandedLabel
        }));
    }

    threats: ThreatLogEntry[] = [];

    selectedThreat: ThreatLogEntry | null = null;

    // Filters
    filterSeverity = 'All Severities';
    filterStatus = 'All Status';
    filterTimeRange = 'Last 30 Days'; // Default to show more

    private readonly chartMarkersByRange: Record<string, string[]> = {
        'Last 24 Hours': ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        'Last 7 Days': ['6d ago', '5d', '4d', '3d', '2d', '1d', 'Now'],
        'Last 30 Days': ['30d', '25d', '20d', '15d', '10d', '5d', 'Now']
    };

    get chartTimeMarkers(): string[] {
        return this.chartMarkersByRange[this.filterTimeRange] ?? this.chartMarkersByRange['Last 24 Hours'];
    }

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

    openThreatDetails(threat: ThreatLogEntry, event?: Event): void {
        event?.stopPropagation();
        this.selectedThreat = threat;
    }

    closeThreatDetails(event?: Event): void {
        event?.stopPropagation();
        this.selectedThreat = null;
    }

    parseTimeAgo(timeString: string): number {
        const value = parseInt(timeString);
        if (isNaN(value)) return 0;
        if (timeString.includes('min')) return value / 60;
        if (timeString.includes('hour')) return value;
        if (timeString.includes('day')) return value * 24;
        if (timeString.includes('week')) return value * 24 * 7;
        return 0; // Just now or unknown
    }
}

