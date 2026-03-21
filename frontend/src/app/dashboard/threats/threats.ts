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
            this.firestoreService.getIncidents().subscribe(incidents => {
                this.zone.run(() => {
                    this.threats = incidents.map(incident => ({
                        id: incident.id,
                        title: incident.title || incident.name || 'Untitled Incident',
                        description: incident.description || 'No description available.',
                        endpoint: (incident.affectedAssets?.length || 0) > 1 ? `${incident.affectedAssets.length} Endpoints` : (incident.affectedAssets?.[0]?.hostname || incident.agent_id || 'Unknown'),
                        time: incident.time || 'Recently',
                        rawTime: incident.timestamp,
                        severity: (incident.priority || incident.severity || 'medium').toLowerCase(),
                        type: incident.type || 'Incident',
                        status: (incident.status || 'active').toLowerCase(),
                        icon: '🛡️'
                    }));
                    
                    this.updateStats();
                    this.updateChartData();
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
            { label: 'Malware', categories: ['malware', 'virus', 'trojan', 'ransomware', 'mal'], count: 0, prevCount: 0, color: 'critical' },
            { label: 'Exploits', categories: ['exploit', 'vulnerability', 'cve'], count: 0, prevCount: 0, color: 'high' },
            { label: 'PUPs', categories: ['pup', 'adware', 'unwanted', 'hids'], count: 0, prevCount: 0, color: 'medium', expandedLabel: 'Potentially Unwanted Programs' },
            { label: 'Network Attacks', categories: ['network', 'dns', 'brute', 'scanning'], count: 0, prevCount: 0, color: 'high' }
        ];

        let maxHours = 24;
        if (this.filterTimeRange === 'Last 7 Days') maxHours = 7 * 24;
        else if (this.filterTimeRange === 'Last 30 Days') maxHours = 30 * 24;

        this.threats.forEach(t => {
            // Apply current severity/status filters for KPI consistency
            const matchSeverity = this.filterSeverity === 'All Severities' || t.severity.toLowerCase() === this.filterSeverity.toLowerCase();
            const matchStatus = this.filterStatus === 'All Status' || t.status.toLowerCase() === this.filterStatus.toLowerCase();
            if (!matchSeverity || !matchStatus) return;

            const hoursAgo = this.parseTimeAgo(t.time);
            const isInCurrent = hoursAgo <= maxHours;
            const isInPrevious = hoursAgo > maxHours && hoursAgo <= maxHours * 2;

            if (!isInCurrent && !isInPrevious) return;

            const type = (t.type || '').toUpperCase();
            const title = (t.title || '').toUpperCase();
            
            let matchedStat: any = null;

            // Priority 1: Specific Rule Prefixes
            if (type.includes('HIDS') || title.startsWith('HIDS') || title.includes(': HIDS')) {
                matchedStat = statsMapping[2]; // PUPs
            } else if (type.includes('MAL') || title.startsWith('MAL') || title.includes(': MAL')) {
                matchedStat = statsMapping[0]; // Malware
            } else if (type.includes('NET') || title.startsWith('NET') || title.includes(': NET')) {
                matchedStat = statsMapping[3]; // Network Attacks
            } else {
                // Fallback: Original keyword search
                const content = `${type} ${title} ${(t.description || '')}`.toLowerCase();
                matchedStat = statsMapping.find(s => s.categories.some(c => {
                    if (c === 'mal') return content.includes('mal-') || content.includes(' mal ');
                    return content.includes(c);
                }));
            }

            if (matchedStat) {
                if (isInCurrent) matchedStat.count++;
                if (isInPrevious) matchedStat.prevCount++;
            }
        });

        const currentTotal = statsMapping.reduce((acc, s) => acc + s.count, 0);
        const prevTotal = statsMapping.reduce((acc, s) => acc + s.prevCount, 0);

        this.classificationStats = statsMapping.map(s => {
            let trend = '0%';
            
            // Calculate current and previous distribution percentages
            const currentShare = currentTotal > 0 ? (s.count / currentTotal) * 100 : 0;
            const prevShare = prevTotal > 0 ? (s.prevCount / prevTotal) * 100 : 0;
            
            // Growth of the category's share relative to all incidents
            if (prevShare === 0 && currentShare > 0) {
                trend = `+${Math.round(currentShare)}%`;
            } else if (prevShare > 0) {
                const diff = currentShare - prevShare;
                trend = (diff >= 0 ? '+' : '') + Math.round(diff) + '%';
            } else {
                trend = '0%';
            }

            return {
                label: s.label,
                count: s.count,
                trend: trend,
                color: s.color,
                expandedLabel: s.expandedLabel
            };
        });
    }

    threats: ThreatLogEntry[] = [];

    selectedThreat: ThreatLogEntry | null = null;

    // Filters
    filterSeverity = 'All Severities';
    filterStatus = 'All Status';
    filterTimeRange = 'Last 30 Days'; // Default to show more

    onFilterChange() {
        this.updateChartData();
    }

    // Chart Properties
    chartLinePath: string = 'M24,92 L71,92 L118,92 L165,92 L212,92 L259,92 L306,92 L353,92 L400,92 L447,92 L494,92 L541,92 L588,92';
    chartAreaPath: string = 'M24,92 L71,92 L118,92 L165,92 L212,92 L259,92 L306,92 L353,92 L400,92 L447,92 L494,92 L541,92 L588,92 L588,92 L24,92 Z';
    yAxisLabels: string[] = ['40', '30', '20', '10', '0'];

    private updateChartData() {
        // SVG Coordinates Configuration for Timeline
        const xPoints = [24, 118, 212, 306, 400, 494, 588];
        const minY = 92; // Baseline (0 threats)
        const maxY = 16; // Peak line (Max threats)

        const buckets = [0, 0, 0, 0, 0, 0, 0];
        
        let maxHours = 24;
        if (this.filterTimeRange === 'Last 7 Days') maxHours = 7 * 24;
        else if (this.filterTimeRange === 'Last 30 Days') maxHours = 30 * 24;

        this.filteredThreats.forEach(threat => {
            const hoursAgo = this.parseTimeAgo(threat.time);
            if (hoursAgo <= maxHours) {
                let bucketIndex = 6 - Math.floor((hoursAgo / maxHours) * 6);
                if (bucketIndex < 0) bucketIndex = 0;
                if (bucketIndex > 6) bucketIndex = 6;
                buckets[bucketIndex]++;
            }
        });

        const maxCount = Math.max(...buckets, 4); // minimum ceiling format

        this.yAxisLabels = [
            maxCount.toString(),
            Math.ceil(maxCount * 0.75).toString(),
            Math.ceil(maxCount * 0.5).toString(),
            Math.ceil(maxCount * 0.25).toString(),
            '0'
        ];

        let lineD = '';
        let areaD = '';
        const points = buckets.map((count, i) => {
            const normalized = count / maxCount;
            const y = minY - (normalized * (minY - maxY)); 
            return { x: xPoints[i], y };
        });

        points.forEach((p, i) => {
            const cmd = i === 0 ? 'M' : 'L';
            lineD += `${cmd}${p.x},${p.y} `;
            areaD += `${cmd}${p.x},${p.y} `;
        });

        areaD += `L${xPoints[xPoints.length - 1]},${minY} L${xPoints[0]},${minY} Z`;

        this.chartLinePath = lineD.trim();
        this.chartAreaPath = areaD.trim();
    }

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
        if (!timeString || timeString === 'Recently' || timeString === 'Just now') return 0.1; // Small value so it shows in current window
        
        const value = parseInt(timeString);
        if (isNaN(value)) return 0;
        
        const lower = timeString.toLowerCase();
        if (lower.includes('min')) return value / 60;
        if (lower.includes('hour')) return value;
        if (lower.includes('day')) return value * 24;
        if (lower.includes('week')) return value * 24 * 7;
        
        return value; // Assume hours if no unit matched but number exists
    }
}

