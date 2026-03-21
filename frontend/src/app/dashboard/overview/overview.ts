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
    protectionCoverage: { label: string; value: string; status: string; icon: any };
  }> = {
    '24h': {
      securityStatus: { label: 'Security Score', value: '85%', subtitle: 'Overall Security Posture', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 3, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 12, status: 'critical', icon: XCircle },
      protectionCoverage: { label: 'Protection Coverage', value: '85%', status: 'secure', icon: Shield }
    },
    '7d': {
      securityStatus: { label: 'Security Score', value: '78%', subtitle: 'Overall Security Posture', status: 'degraded', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 11, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 24, status: 'critical', icon: XCircle },
      protectionCoverage: { label: 'Protection Coverage', value: '78%', status: 'degraded', icon: Shield }
    },
    '30d': {
      securityStatus: { label: 'Security Score', value: '71%', subtitle: 'Overall Security Posture', status: 'critical', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 38, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 47, status: 'critical', icon: XCircle },
      protectionCoverage: { label: 'Protection Coverage', value: '71%', status: 'critical', icon: Shield }
    },
    'custom': {
      securityStatus: { label: 'Security Score', value: '—', subtitle: 'Select a date range', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 0, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 0, status: 'critical', icon: XCircle },
      protectionCoverage: { label: 'Protection Coverage', value: '—', status: 'secure', icon: Shield }
    }
  };

  // 1. Top KPI Strip
  kpiData = this.kpiSnapshots['24h'];

  // 2. Main Visual Row - Risk Trend
  currentTrendPeriod = '24h'; // 24h, 7d, 30d
  riskTrendData: number[] = [];

  // Mock trend data
  trends = {
    '24h': [65, 68, 72, 70, 68, 65, 62, 60, 58, 55, 58, 62],
    '7d': [45, 52, 58, 62, 70, 65, 60],
    '30d': [30, 35, 42, 48, 55, 60, 58, 62, 65, 70, 72, 68]
  };

  trendTimeLabels: string[] = [];
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipScore = 0;
  tooltipTime = '';

  // Endpoint Protection Status (Donut)
  protectionStats = {
    total: 350,
    protected: 298,
    protectedPct: 85,
    atRisk: 35,
    offline: 17,
    totalCriticalAlerts: 0
  };

  // 3. Secondary Row
  // Agent Health & Updates
  agentHealth: any[] = [
    { label: 'Outdated Agents', count: 0, color: 'warning', action: 'Update', isProcessing: false },
    { label: 'Failed Updates', count: 0, color: 'critical', action: 'Retry', isProcessing: false },
    { label: 'Pending Restart', count: 0, color: 'neutral', action: 'Reboot', isProcessing: false }
  ];

  handleHealthAction(item: any) {
    // No-op for now as it's real data
    console.log(`Action ${item.action} requested for ${item.label}`);
  }

  // Top Risk Contributors
  riskContributors = [
    { name: 'Unpatched Endpoints', count: 12, impact: 'High', devices: 27 },
    { name: 'Active Critical Malware', count: 3, impact: 'Critical', devices: 14 },
    { name: 'Offline Devices (>30d)', count: 5, impact: 'Medium', devices: 9 },
    { name: 'Weak Passwords', count: 8, impact: 'Medium', devices: 31 }
  ];

  // 4. Bottom Row
  recentIncidents = [
    { id: 'INC-001', endpoint: 'CEO-LAPTOP', threat: 'Ransomware Precursor', severity: 'critical', status: 'Active', detectedTime: '2 minutes ago' },
    { id: 'INC-002', endpoint: 'FILE-SRV-02', threat: 'Data Exfiltration', severity: 'high', status: 'Investigating', detectedTime: '18 minutes ago' },
    { id: 'INC-003', endpoint: 'HR-LAP-009', threat: 'Powershell Empire', severity: 'high', status: 'Blocked', detectedTime: '1 hour ago' },
    { id: 'INC-004', endpoint: 'GUEST-WIFI', threat: 'Network Scan', severity: 'medium', status: 'Monitored', detectedTime: '3 hours ago' }
  ];

  // Threat Feed
  recentThreats: any[] = [];

  private intervalId: any;

  // Real incident count from Firestore (null = loading)
  activeIncidentsCount: number | null = null;
  activeCriticalIncidentsCount: number | null = null;
  private currentAlerts: any[] = [];

  // Animation properties
  animatedProtectionPct = 0;
  animatedAtRiskPct = 0;
  animatedOfflinePct = 0;
  targetProtected = 0;
  targetAtRisk = 0;
  targetOffline = 0;

  private subs = new Subscription();

  constructor(
    private firestoreService: FirestoreService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.setTrendPeriod('24h');
    this.animateDonutChart();

    // Fetch real incident count from Firestore
    this.subs.add(
      this.firestoreService.getOrganizationIncidents().subscribe(incidents => {
        this.zone.run(() => {
          const active = incidents.filter(i => (i.status || 'open').toLowerCase() !== 'resolved');
          this.activeIncidentsCount = active.length;
          
          this.activeCriticalIncidentsCount = active.filter(i => 
            (i.priority || i.severity || '').toLowerCase() === 'critical'
          ).length;
          
          // Populate recent incidents table (limit to 5)
          this.recentIncidents = incidents.slice(0, 5).map(inc => ({
            id: inc.id,
            endpoint: inc.agent_name || inc.endpoint_name || 'Unknown',
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

    // Fetch real threat feed (alerts)
    this.subs.add(
      this.firestoreService.getOrganizationAlerts().subscribe(alerts => {
        this.zone.run(() => {
          this.currentAlerts = alerts;
          this.recentThreats = alerts.slice(0, 5).map(alert => ({
            id: alert.id,
            time: alert.time || 'Recently',
            name: alert.RuleName || alert.name || 'Detection Alert',
            host: alert.agent_id || alert.hostname || 'Unknown Host',
            severity: alert.Severity?.toLowerCase() || 'medium',
            type: alert.Type || 'Detection',
            technique: alert.Technique || alert.rule_id || ''
          }));
          this.calculateSecurityScore();
          this.cdr.detectChanges();
        });
      })
    );
  }

  private calculateProtectionStats(agents: any[]) {
    const total = agents.length || 0;
    if (total === 0) {
      this.protectionStats = { total: 0, protected: 0, protectedPct: 0, atRisk: 0, offline: 0, totalCriticalAlerts: 0 };
      this.animateDonutChart();
      return;
    }

    const now = new Date().getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let offline = 0;
    let atRisk = 0;
    let ok = 0;
    
    let totalCriticalAlerts = 0;
    
    let outdated = 0;
    let failedUpdates = 0;
    let pendingRestart = 0;

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

      // Health heuristics
      if (agent.version && agent.version !== '1.2.0') outdated++;
      if (agent.update_status === 'failed') failedUpdates++;
      if (agent.restart_pending === true) pendingRestart++;

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

    // Update Protection Coverage KPI status and values across all snapshots
    const coverageVal = `${this.protectionStats.protectedPct}%`;
    let coverageStatus = 'secure';
    if (this.protectionStats.protectedPct < 70) {
      coverageStatus = 'critical';
    } else if (this.protectionStats.protectedPct < 90) {
      coverageStatus = 'degraded';
    }

    Object.values(this.kpiSnapshots).forEach(snap => {
      if (snap.protectionCoverage) {
        snap.protectionCoverage.value = coverageVal as any;
        snap.protectionCoverage.status = coverageStatus;
      }
    });

    this.agentHealth = [
      { label: 'Outdated Agents', count: outdated, color: 'warning', action: 'Update', isProcessing: false },
      { label: 'Failed Updates', count: failedUpdates, color: 'critical', action: 'Retry', isProcessing: false },
      { label: 'Pending Restart', count: pendingRestart, color: 'neutral', action: 'Reboot', isProcessing: false }
    ];

    this.riskContributors = [
      { name: 'Active Critical Malware', count: criticalMalwareHosts, impact: 'Critical', devices: criticalMalwareHosts },
      { name: 'Offline Devices (>30d)', count: offline30d, impact: 'Medium', devices: offline30d },
      { name: 'Unpatched Endpoints', count: 12, impact: 'High', devices: 27 }, // Still mock
      { name: 'Weak Passwords', count: 8, impact: 'Medium', devices: 31 } // Still mock
    ];

    this.calculateSecurityScore();
    this.animateDonutChart();
  }

  private calculateSecurityScore() {
    const totalEndpoints = this.protectionStats.total;
    if (totalEndpoints === 0) {
      this.updateSecurityKpi(100);
      return;
    }

    const offlineAgents = this.protectionStats.offline;
    
    // Status !== 'resolved' (Active alerts)
    const activeAlerts = this.currentAlerts.filter(a => (a.status || 'open').toLowerCase() !== 'resolved');
    
    const critical = activeAlerts.filter(a => (a.Severity || '').toLowerCase() === 'critical').length;
    const high = activeAlerts.filter(a => (a.Severity || '').toLowerCase() === 'high').length;
    const medium = activeAlerts.filter(a => (a.Severity || '').toLowerCase() === 'medium').length;

    // Formula: Security Score = max(0, 100 - ((C*20 + H*10 + M*5 + O*10) / E))
    const penalty = ((critical * 20) + (high * 10) + (medium * 5) + (offlineAgents * 10)) / totalEndpoints;
    const score = Math.max(0, 100 - penalty);
    
    this.updateSecurityKpi(score);
  }

  private updateSecurityKpi(score: number) {
    const roundedScore = Math.round(score);
    const valueStr = `${roundedScore}%`;
    
    // Thresholds: >=90 (Secure), >=70 (Degraded), <70 (Critical)
    let status = 'secure';
    if (roundedScore < 70) {
      status = 'critical';
    } else if (roundedScore < 90) {
      status = 'degraded';
    }

    // Update current KPI
    if (this.kpiData.securityStatus) {
      this.kpiData.securityStatus.value = valueStr;
      this.kpiData.securityStatus.status = status;
    }

    // Update snapshots to keep state across filter changes
    Object.values(this.kpiSnapshots).forEach(snap => {
       if (snap.securityStatus) {
         snap.securityStatus.value = valueStr;
         snap.securityStatus.status = status;
       }
    });
  }

  animateDonutChart() {
    const duration = 1500;
    let start: number | null = null;

    this.targetProtected = this.protectionStats.protectedPct;
    this.targetAtRisk = Math.round((this.protectionStats.atRisk / this.protectionStats.total) * 100);
    this.targetOffline = Math.round((this.protectionStats.offline / this.protectionStats.total) * 100);

    const animate = (time: number) => {
      if (!start) start = time;
      let progress = (time - start) / duration;
      if (progress > 1) progress = 1;

      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      this.animatedProtectionPct = Math.round(this.targetProtected * easeProgress);
      this.animatedAtRiskPct = Math.round(this.targetAtRisk * easeProgress);
      this.animatedOfflinePct = Math.round(this.targetOffline * easeProgress);

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
  }

  generateTimeLabels(period: string, count: number): string[] {
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      if (period === '24h') {
        labels.push(`${i * 2}h`);
      } else if (period === '7d') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        labels.push(days[i % 7]);
      } else {
        labels.push(`Day ${i + 1}`);
      }
    }
    return labels;
  }

  getTrendPolylinePoints(): string {
    const data = this.riskTrendData;
    if (!data || data.length === 0) return '';
    const maxVal = 100;
    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 50 - (val / maxVal) * 50;
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
    const maxVal = 100;
    return data.map((val, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 50 - (val / maxVal) * 50,
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
