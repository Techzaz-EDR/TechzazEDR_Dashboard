import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Info, ArrowUp, AlertTriangle, XCircle, RefreshCw, Ban, Search,
  CheckCircle, Shield, Activity, Monitor
} from 'lucide-angular';

import { Subscription } from 'rxjs';
import { FirestoreService } from '../../core/services/firestore.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview implements OnInit, OnDestroy {
  // Icons
  readonly Info = Info;
  readonly ArrowUp = ArrowUp;
  readonly AlertTriangle = AlertTriangle;
  readonly XCircle = XCircle;
  readonly RefreshCw = RefreshCw;
  readonly Ban = Ban;
  readonly Search = Search;
  readonly CheckCircle = CheckCircle;
  readonly Shield = Shield;
  readonly Activity = Activity;
  readonly Monitor = Monitor;

  // Global time filter
  activeTimeFilter = '24h';
  customFrom = '';
  customTo = '';

  // Per-period KPI snapshots
  private kpiSnapshots: Record<string, {
    securityStatus: { label: string; value: string; subtitle: string; status: string; icon: any };
    activeIncidents: { label: string; value: number; status: string; icon: any };
    atRiskEndpoints: { label: string; value: number; status: string; icon: any };
    totalEndpoints: { label: string; value: string; status: string; icon: any };
  }> = {
    '24h': {
      securityStatus: { label: 'Security Score', value: '85%', subtitle: 'Overall Security Posture', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 3, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 12, status: 'critical', icon: XCircle },
      totalEndpoints: { label: 'Total Endpoints', value: '—', status: 'critical', icon: Monitor }
    },
    '7d': {
      securityStatus: { label: 'Security Score', value: '78%', subtitle: 'Overall Security Posture', status: 'degraded', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 11, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 24, status: 'critical', icon: XCircle },
      totalEndpoints: { label: 'Total Endpoints', value: '—', status: 'critical', icon: Monitor }
    },
    '30d': {
      securityStatus: { label: 'Security Score', value: '71%', subtitle: 'Overall Security Posture', status: 'critical', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 38, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 47, status: 'critical', icon: XCircle },
      totalEndpoints: { label: 'Total Endpoints', value: '—', status: 'critical', icon: Monitor }
    },
    'custom': {
      securityStatus: { label: 'Security Score', value: '—', subtitle: 'Select a date range', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 0, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 0, status: 'critical', icon: XCircle },
      totalEndpoints: { label: 'Total Endpoints', value: '—', status: 'critical', icon: Monitor }
    }
  };

  // 1. Top KPI Strip
  kpiData = this.kpiSnapshots['24h'];

  // 2. Main Visual Row - Risk Trend
  currentTrendPeriod = '7d'; // Default to one week
  riskTrendData: number[] = [];

  // Mock trend data
  trends = {
    '24h': [65, 68, 72, 70, 68, 65, 62, 60, 58, 55, 58, 62],
    '7d': [45, 52, 58, 62, 70, 65, 60],
    '30d': [30, 35, 42, 48, 55, 60, 58, 62, 65, 70, 72, 68, 65, 60, 55, 50, 48, 45, 42, 40, 38, 35, 32, 30, 28, 25, 22, 20, 18, 15]
  };

  yAxisLabels: string[] = ['100', '75', '50', '25', '0'];

  trendTimeLabels: string[] = [];
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipScore = 0;
  tooltipTime = '';

  // Endpoint Protection Status (Donut)
  protectionStats = {
    total: 0,
    protected: 0,
    protectedPct: 0,
    atRisk: 0,
    offline: 0,
    totalCriticalAlerts: 0
  };

  // 3. Secondary Row
  // Most Detected Alerts
  topDetectedRules: { name: string, count: number, severity: string, maxPct: number }[] = [];

  // Top Risk Contributors
  riskContributors = [
    { name: 'Unpatched Endpoints', count: 12, impact: 'High', devices: 27 },
    { name: 'Active Critical Malware', count: 3, impact: 'Critical', devices: 14 },
    { name: 'Offline Devices (>30d)', count: 5, impact: 'Medium', devices: 9 },
    { name: 'Weak Passwords', count: 8, impact: 'Medium', devices: 31 }
  ];

  // 4. Bottom Row
  recentIncidents: any[] = [];

  // Cyber Threat News Feed
  cyberNews: { title: string, link: string, pubDate: string, source: string }[] = [];

  private intervalId: any;

  // Real incident count from Firestore (null = loading)
  activeIncidentsCount: number | null = null;
  activeCriticalIncidentsCount: number | null = null;
  private currentAlerts: any[] = [];

  // Incident Stats
  incidentStats = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    criticalPct: 0,
    highPct: 0,
    mediumPct: 0,
    lowPct: 0
  };

  // Incident Status Distribution
  incidentStatusStats = {
    total: 0,
    open: 0,
    investigating: 0,
    contained: 0,
    resolved: 0,
    openPct: 0,
    investigatingPct: 0,
    containedPct: 0,
    resolvedPct: 0
  };

  // Animation properties
  animatedCriticalPct = 0;
  animatedHighPct = 0;
  animatedMediumPct = 0;
  animatedLowPct = 0;
  targetCritical = 0;
  targetHigh = 0;
  targetMedium = 0;
  targetLow = 0;

  // Status Animation properties
  animatedOpenPct = 0;
  animatedInvestigatingPct = 0;
  animatedContainedPct = 0;
  animatedResolvedPct = 0;
  targetOpen = 0;
  targetInvestigating = 0;
  targetContained = 0;
  targetResolved = 0;

  isRefreshing = false;
  private subs = new Subscription();

  constructor(
    private firestoreService: FirestoreService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.setTrendPeriod('7d');
    this.animateIncidentDonutChart();
    this.animateStatusDonutChart();
    this.loadDashboardData();
  }

  refresh() {
    this.isRefreshing = true;
    this.loadDashboardData();
    // Force a small delay for better UX visibility of the spinner
    setTimeout(() => {
      this.isRefreshing = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  private loadDashboardData() {
    // Clear existing subscriptions to avoid duplicates on manual refresh
    this.subs.unsubscribe();
    this.subs = new Subscription();

    // Fetch real incident count from Firestore
    this.subs.add(
      this.firestoreService.getOrganizationIncidents().subscribe(incidents => {
        this.zone.run(() => {
          const active = incidents.filter(i => (i.status || 'open').toLowerCase() !== 'resolved');
          this.activeIncidentsCount = active.length;
          
          this.activeCriticalIncidentsCount = active.filter(i => 
            (i.priority || i.severity || '').toLowerCase() === 'critical'
          ).length;
          
          this.updateIncidentStats(active);
          this.updateIncidentStatusDistribution(incidents);
          this.updateTrendData(incidents, this.currentTrendPeriod);
          
          this.recentIncidents = incidents.slice(0, 5).map(inc => ({
            id: inc.id,
            endpoint: inc.affectedAssets?.[0]?.hostname || inc.agent_id || 'Unknown',
            threat: inc.title || inc.name || 'Untitled Incident',
            severity: inc.priority || inc.severity || 'medium',
            status: inc.status || 'Active',
            detectedTime: inc.time || 'Recently'
          }));
          this.cdr.detectChanges();
        });
      })
    );

    // Fetch agents and calculate protection stats
    this.subs.add(
      this.firestoreService.getAgents().subscribe(agents => {
        this.zone.run(() => {
          this.calculateProtectionStats(agents);
          this.cdr.detectChanges();
        });
      })
    );

    // Fetch real threat feed (alerts) for Top Rules and Security Score
    this.subs.add(
      this.firestoreService.getOrganizationAlerts().subscribe(alerts => {
        this.zone.run(() => {
          this.currentAlerts = alerts;
          this.calculateSecurityScore();
          this.updateTopRules(alerts);
          this.cdr.detectChanges();
        });
      })
    );

    // Fetch Cyber Threat News
    this.subs.add(
      this.http.get<any>('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TheHackersNews')
        .subscribe({
          next: (response) => {
            if (response && response.items) {
              this.zone.run(() => {
                this.cyberNews = response.items.slice(0, 15).map((item: any) => ({
                  title: item.title,
                  link: item.link,
                  pubDate: this.formatNewsDate(item.pubDate),
                  source: 'The Hacker News'
                }));
                this.cdr.detectChanges();
              });
            }
          },
          error: (err) => console.error('Error fetching cyber news:', err)
        })
    );
  }

  private formatNewsDate(dateString: string): string {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  private calculateProtectionStats(agents: any[]) {
    const total = agents.length || 0;
    if (total === 0) {
      this.protectionStats = { total: 0, protected: 0, protectedPct: 0, atRisk: 0, offline: 0, totalCriticalAlerts: 0 };
      return;
    }

    const now = new Date().getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let offline = 0;
    let atRisk = 0;
    let ok = 0;
    
    let totalCriticalAlerts = 0;
    
    let offline30d = 0;
    let criticalMalwareHosts = 0;

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    agents.forEach(agent => {
      const lastSeen = agent.last_seen?.toDate ? agent.last_seen.toDate().getTime() : 0;
      const isOffline = (now - lastSeen) > oneDayMs;
      const isOffline30d = (now - lastSeen) > thirtyDaysMs;

      if (isOffline) {
        offline++;
        if (isOffline30d) offline30d++;
      } else if (agent.status === 'at_risk' || agent.critical_alerts > 0) {
        atRisk++;
        if (agent.critical_alerts > 0) criticalMalwareHosts++;
      } else {
        ok++;
      }

      totalCriticalAlerts += (agent.critical_alerts || 0);
    });

    const protectedCount = ok;
    this.protectionStats = {
      total,
      protected: protectedCount,
      protectedPct: total > 0 ? Math.round((protectedCount / total) * 100) : 0,
      atRisk,
      offline,
      totalCriticalAlerts
    };

    // Update Total Endpoints KPI across all snapshots
    Object.values(this.kpiSnapshots).forEach(snap => {
      if ((snap as any).totalEndpoints) {
        (snap as any).totalEndpoints.value = String(this.protectionStats.total);
      }
    });

    this.riskContributors = [
      { name: 'Active Critical Malware', count: criticalMalwareHosts, impact: 'Critical', devices: criticalMalwareHosts },
      { name: 'Offline Devices (>30d)', count: offline30d, impact: 'Medium', devices: offline30d },
      { name: 'Unpatched Endpoints', count: 12, impact: 'High', devices: 27 }, 
      { name: 'Weak Passwords', count: 8, impact: 'Medium', devices: 31 } 
    ];

    this.calculateSecurityScore();
  }

  private calculateSecurityScore() {
    const totalEndpoints = this.protectionStats.total;
    if (totalEndpoints === 0) {
      this.updateSecurityKpi(100);
      return;
    }

    const offlineAgents = this.protectionStats.offline;
    const activeAlerts = this.currentAlerts.filter(a => (a.status || 'open').toLowerCase() !== 'resolved');
    
    const critical = activeAlerts.filter(a => (a.Severity || a.severity || '').toLowerCase() === 'critical').length;
    const high = activeAlerts.filter(a => (a.Severity || a.severity || '').toLowerCase() === 'high').length;
    const medium = activeAlerts.filter(a => (a.Severity || a.severity || '').toLowerCase() === 'medium').length;

    const penalty = ((critical * 20) + (high * 10) + (medium * 5) + (offlineAgents * 10)) / totalEndpoints;
    const score = Math.max(0, 100 - penalty);
    
    this.updateSecurityKpi(score);
  }

  private updateSecurityKpi(score: number) {
    const roundedScore = Math.round(score);
    const valueStr = `${roundedScore}%`;
    
    let status = 'secure';
    if (roundedScore < 70) {
      status = 'critical';
    } else if (roundedScore < 90) {
      status = 'degraded';
    }

    if (this.kpiData.securityStatus) {
      this.kpiData.securityStatus.value = valueStr;
      this.kpiData.securityStatus.status = status;
    }

    Object.values(this.kpiSnapshots).forEach(snap => {
       if (snap.securityStatus) {
         snap.securityStatus.value = valueStr;
         snap.securityStatus.status = status;
       }
    });
  }

  updateIncidentStats(activeItems: any[]) {
    const critical = activeItems.filter(i => (i.priority || i.severity || i.Severity || '').toLowerCase() === 'critical').length;
    const high = activeItems.filter(i => (i.priority || i.severity || i.Severity || '').toLowerCase() === 'high').length;
    const medium = activeItems.filter(i => (i.priority || i.severity || i.Severity || '').toLowerCase() === 'medium').length;
    const low = activeItems.filter(i => {
        const sev = (i.priority || i.severity || i.Severity || '').toLowerCase();
        return sev === 'low' || sev === 'info';
    }).length;
    
    const total = activeItems.length;

    this.incidentStats = {
      total,
      critical,
      high,
      medium,
      low,
      criticalPct: total > 0 ? Math.round((critical / total) * 100) : 0,
      highPct: total > 0 ? Math.round((high / total) * 100) : 0,
      mediumPct: total > 0 ? Math.round((medium / total) * 100) : 0,
      lowPct: total > 0 ? Math.round((low / total) * 100) : 0,
    };
    
    this.animateIncidentDonutChart();
  }

  private updateTrendData(incidents: any[], period: string = '7d') {
    const now = new Date();
    let trendData: number[];
    let lookbackMs: number;
    let slots: number;

    if (period === '24h') {
      lookbackMs = 24 * 60 * 60 * 1000;
      slots = 12;
    } else if (period === '30d') {
      lookbackMs = 30 * 24 * 60 * 60 * 1000;
      slots = 30;
    } else {
      // Default to 7 days
      lookbackMs = 7 * 24 * 60 * 60 * 1000;
      slots = 7;
    }

    trendData = new Array(slots).fill(0);
    const startTime = new Date(now.getTime() - lookbackMs);

    incidents.forEach(incident => {
      const createdDate = incident.createdAt?.toDate ? incident.createdAt.toDate() :
        (incident.createdAt ? new Date(incident.createdAt) : null);

      if (createdDate && createdDate >= startTime) {
        const diffMs = now.getTime() - createdDate.getTime();
        
        let slot: number;
        if (period === '24h') {
          const diffHrs = diffMs / (60 * 60 * 1000);
          slot = Math.floor((24 - diffHrs) / 2);
        } else {
          const diffDays = diffMs / (24 * 60 * 60 * 1000);
          const totalDays = period === '30d' ? 30 : 7;
          slot = Math.floor((totalDays - 0.001 - diffDays));
        }

        if (slot >= 0 && slot < slots) {
          trendData[slot]++;
        }
      }
    });

    this.riskTrendData = trendData;
    this.trendTimeLabels = this.generateTimeLabels(period, trendData.length);
    this.updateYAxisLabels();
  }

  animateIncidentDonutChart() {
    const duration = 1500;
    let start: number | null = null;

    this.targetCritical = this.incidentStats.criticalPct;
    this.targetHigh = this.incidentStats.highPct;
    this.targetMedium = this.incidentStats.mediumPct;
    this.targetLow = this.incidentStats.lowPct;

    const animate = (time: number) => {
      if (!start) start = time;
      let progress = (time - start) / duration;
      if (progress > 1) progress = 1;

      const easeProgress = 1 - Math.pow(1 - progress, 4);

      this.animatedCriticalPct = Math.round(this.targetCritical * easeProgress);
      this.animatedHighPct = Math.round(this.targetHigh * easeProgress);
      this.animatedMediumPct = Math.round(this.targetMedium * easeProgress);
      this.animatedLowPct = Math.round(this.targetLow * easeProgress);

      this.cdr.detectChanges();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  updateIncidentStatusDistribution(allIncidents: any[]) {
    const total = allIncidents.length;
    const open = allIncidents.filter(i => (i.status || 'open').toLowerCase() === 'open').length;
    const investigating = allIncidents.filter(i => (i.status || '').toLowerCase() === 'investigating').length;
    const contained = allIncidents.filter(i => (i.status || '').toLowerCase() === 'contained').length;
    const resolved = allIncidents.filter(i => (i.status || '').toLowerCase() === 'resolved').length;

    this.incidentStatusStats = {
      total,
      open,
      investigating,
      contained,
      resolved,
      openPct: total > 0 ? Math.round((open / total) * 100) : 0,
      investigatingPct: total > 0 ? Math.round((investigating / total) * 100) : 0,
      containedPct: total > 0 ? Math.round((contained / total) * 100) : 0,
      resolvedPct: total > 0 ? Math.round((resolved / total) * 100) : 0
    };

    this.animateStatusDonutChart();
  }

  animateStatusDonutChart() {
    const duration = 1500;
    let start: number | null = null;

    this.targetOpen = this.incidentStatusStats.openPct;
    this.targetInvestigating = this.incidentStatusStats.investigatingPct;
    this.targetContained = this.incidentStatusStats.containedPct;
    this.targetResolved = this.incidentStatusStats.resolvedPct;

    const animate = (time: number) => {
      if (!start) start = time;
      let progress = (time - start) / duration;
      if (progress > 1) progress = 1;

      const easeProgress = 1 - Math.pow(1 - progress, 4);

      this.animatedOpenPct = Math.round(this.targetOpen * easeProgress);
      this.animatedInvestigatingPct = Math.round(this.targetInvestigating * easeProgress);
      this.animatedContainedPct = Math.round(this.targetContained * easeProgress);
      this.animatedResolvedPct = Math.round(this.targetResolved * easeProgress);

      this.cdr.detectChanges();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.subs.unsubscribe();
  }

  updateTopRules(items: any[]) {
    const ruleCounts = new Map<string, { count: number, severity: string }>();
    
    items.forEach(item => {
      const name = item.RuleName || item.rule_name || item.title || item.name || 'Unknown Rule';
      const severity = (item.Severity || item.severity || item.priority || 'medium').toLowerCase();
      
      if (ruleCounts.has(name)) {
        const current = ruleCounts.get(name)!;
        ruleCounts.set(name, { count: current.count + 1, severity: current.severity });
      } else {
        ruleCounts.set(name, { count: 1, severity });
      }
    });

    const sortedRules = Array.from(ruleCounts.entries())
      .map(([name, data]) => ({ name, count: data.count, severity: data.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxCount = sortedRules.length > 0 ? sortedRules[0].count : 1;

    this.topDetectedRules = sortedRules.map(r => ({
      ...r,
      maxPct: (r.count / Math.max(maxCount, 1)) * 100
    }));
  }

  setTimeFilter(filter: string) {
    this.activeTimeFilter = filter;
    this.kpiData = this.kpiSnapshots[filter] ?? this.kpiSnapshots['24h'];
    const trendPeriod = filter === 'custom' ? '24h' : filter;
    this.setTrendPeriod(trendPeriod);
  }

  setTrendPeriod(period: string) {
    this.currentTrendPeriod = period;
    this.riskTrendData = this.trends[period as keyof typeof this.trends];
    this.trendTimeLabels = this.generateTimeLabels(period, this.riskTrendData.length);
    this.updateYAxisLabels();
  }

  updateYAxisLabels() {
    const data = this.riskTrendData;
    if (!data || data.length === 0) {
      this.yAxisLabels = ['100', '75', '50', '25', '0'];
      return;
    }
    const maxVal = Math.max(...data, 10);
    const steppedMax = Math.ceil(maxVal / 10) * 10;
    this.yAxisLabels = [
      String(steppedMax),
      String(Math.round(steppedMax * 0.75)),
      String(Math.round(steppedMax * 0.5)),
      String(Math.round(steppedMax * 0.25)),
      '0'
    ];
  }

  generateTimeLabels(period: string, count: number): string[] {
    const labels: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      if (period === '24h') {
        labels.push(`${i * 2}h`);
      } else if (period === '7d') {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - i));
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels.push(dayNames[date.getDay()]);
      } else {
        labels.push(`Day ${i + 1}`);
      }
    }
    return labels;
  }

  getTrendPolylinePoints(): string {
    const data = this.riskTrendData;
    if (!data || data.length === 0) return '';
    const maxVal = Math.max(...data, 10);
    const steppedMax = Math.ceil(maxVal / 10) * 10;
    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 50 - (val / steppedMax) * 50;
      return `${x},${y}`;
    }).join(' ');
  }

  getTrendPolygonPoints(): string {
    const line = this.getTrendPolylinePoints();
    if (!line) return '';
    return `${line} 100,50 0,50`;
  }

  getTrendDataPoints(): { x: number; y: number; value: number; index: number }[] {
    const data = this.riskTrendData;
    if (!data || data.length === 0) return [];
    const maxVal = Math.max(...data, 10);
    const steppedMax = Math.ceil(maxVal / 10) * 10;
    return data.map((val, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 50 - (val / steppedMax) * 50,
      value: val,
      index: i
    }));
  }

  showTooltip(event: MouseEvent, point: { value: number; index: number }) {
    const container = (event.target as Element).closest('.line-chart-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.tooltipX = event.clientX - rect.left + 10;
    this.tooltipY = event.clientY - rect.top - 40;
    this.tooltipScore = point.value;
    this.tooltipTime = this.trendTimeLabels[point.index] || '';
    this.tooltipVisible = true;
  }

  hideTooltip() {
    this.tooltipVisible = false;
  }
}
