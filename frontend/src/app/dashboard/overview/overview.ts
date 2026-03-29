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

  // Loading state — true until first real data arrives
  dataLoaded = false;

  // Per-period KPI snapshots — all start blank (no hardcoded placeholder numbers)
  private kpiSnapshots: Record<string, {
    securityStatus: { label: string; value: string; subtitle: string; status: string; icon: any };
    activeIncidents: { label: string; value: number | null; status: string; icon: any };
    atRiskEndpoints: { label: string; value: number | null; status: string; icon: any };
    totalEndpoints: { label: string; value: string; status: string; icon: any };
  }> = {
    '24h': {
      securityStatus: { label: 'Security Score', value: '—', subtitle: 'Overall Security Posture', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: null, status: 'secure', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: null, status: 'secure', icon: XCircle },
      totalEndpoints: { label: 'Total Endpoints', value: '—', status: 'secure', icon: Monitor }
    },
    '7d': {
      securityStatus: { label: 'Security Score', value: '—', subtitle: 'Overall Security Posture', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: null, status: 'secure', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: null, status: 'secure', icon: XCircle },
      totalEndpoints: { label: 'Total Endpoints', value: '—', status: 'secure', icon: Monitor }
    },
    '30d': {
      securityStatus: { label: 'Security Score', value: '—', subtitle: 'Overall Security Posture', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: null, status: 'secure', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: null, status: 'secure', icon: XCircle },
      totalEndpoints: { label: 'Total Endpoints', value: '—', status: 'secure', icon: Monitor }
    },
    'custom': {
      securityStatus: { label: 'Security Score', value: '—', subtitle: 'Select a date range', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: null, status: 'secure', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: null, status: 'secure', icon: XCircle },
      totalEndpoints: { label: 'Total Endpoints', value: '—', status: 'secure', icon: Monitor }
    }
  };

  // 1. Top KPI Strip
  kpiData = this.kpiSnapshots['24h'];

  // 2. Main Visual Row - Risk Trend
  currentTrendPeriod = '7d';
  riskTrendData: number[] = [];
  // Toggled false→true to destroy+recreate the SVG so the JS animation runs fresh each time
  trendChartVisible = false;
  trendAnimationKey = 0;
  // JS-driven stroke-dashoffset: starts at TREND_DASH_LEN (invisible), animates to 0 (fully drawn)
  // 2000 covers the worst-case 30d polyline path length in SVG user-space coordinates
  readonly TREND_DASH_LEN = 2000;
  trendDashOffset = 2000;

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
  private cachedIncidents: any[] = [];

  // Animated KPI display values (count up from 0)
  displayActiveIncidents = 0;
  displayCriticalIncidents = 0;
  displayTotalEndpoints = 0;
  displaySecurityScore = 0;

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
  /** Animations (count-up, donut, trend) only fire once on initial page load. */
  private hasAnimated = false;

  /** Animates a number from 0 to `target` over `duration`ms, calling `onUpdate` each frame. */
  private countUp(target: number, duration: number, onUpdate: (v: number) => void): void {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      onUpdate(Math.round(eased * target));
      this.cdr.detectChanges();
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  constructor(
    private firestoreService: FirestoreService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Don't call setTrendPeriod on init (it used mock data); start with empty array
    this.riskTrendData = [];
    this.trendTimeLabels = [];
    this.updateYAxisLabels();
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

          // Update KPI snapshots with live counts
          Object.values(this.kpiSnapshots).forEach(snap => {
            (snap as any).activeIncidents.value = active.length;
            (snap as any).activeIncidents.status = active.length > 0 ? 'critical' : 'secure';
          });
          this.kpiData = { ...this.kpiSnapshots[this.activeTimeFilter] ?? this.kpiSnapshots['24h'] };

          const criticalCount = active.filter(i =>
            (i.priority || i.severity || '').toLowerCase() === 'critical'
          ).length;

          if (this.hasAnimated) {
            // Subsequent updates: set values directly, no re-animation
            this.displayActiveIncidents = active.length;
            this.displayCriticalIncidents = criticalCount;
          } else {
            this.countUp(active.length, 2200, v => this.displayActiveIncidents = v);
            this.countUp(criticalCount, 2200, v => this.displayCriticalIncidents = v);
          }

          this.updateIncidentStats(active);
          this.updateIncidentStatusDistribution(incidents);
          this.cachedIncidents = incidents;
          this.updateTrendData(incidents, this.currentTrendPeriod);
          this.dataLoaded = true;

          this.recentIncidents = incidents.slice(0, 5).map(inc => ({
            id: inc.id,
            endpoint: inc.affectedAssets?.[0]?.hostname || inc.agent_name || inc.hostname || 'Unknown',
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
          if (this.hasAnimated) {
            this.displayTotalEndpoints = this.protectionStats.total;
          } else {
            this.countUp(this.protectionStats.total, 2200, v => this.displayTotalEndpoints = v);
          }
          if (!this.dataLoaded) {
            this.dataLoaded = true;
          }
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
      // last_seen may be a Firestore Timestamp object OR an ISO string from the Python backend
      const rawLastSeen = agent.last_seen;
      let lastSeenMs = 0;
      if (rawLastSeen) {
        if (rawLastSeen.toDate) {
          lastSeenMs = rawLastSeen.toDate().getTime();
        } else if (rawLastSeen.seconds) {
          lastSeenMs = rawLastSeen.seconds * 1000;
        } else {
          const parsed = new Date(rawLastSeen);
          lastSeenMs = isNaN(parsed.getTime()) ? 0 : parsed.getTime();
        }
      }

      const isOffline = (now - lastSeenMs) > oneDayMs;
      const isOffline30d = (now - lastSeenMs) > thirtyDaysMs;

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

    let status = 'secure';
    if (roundedScore < 70) {
      status = 'critical';
    } else if (roundedScore < 90) {
      status = 'degraded';
    }

    if (this.kpiData.securityStatus) {
      this.kpiData.securityStatus.status = status;
    }

    Object.values(this.kpiSnapshots).forEach(snap => {
       if (snap.securityStatus) {
         snap.securityStatus.status = status;
       }
    });

    if (this.hasAnimated) {
      // Subsequent updates: jump to value directly
      this.displaySecurityScore = roundedScore;
      const str = `${roundedScore}%`;
      if (this.kpiData.securityStatus) this.kpiData.securityStatus.value = str;
      Object.values(this.kpiSnapshots).forEach(snap => {
        if (snap.securityStatus) snap.securityStatus.value = str;
      });
    } else {
      // First load: animate count-up and mark as animated
      this.countUp(roundedScore, 2200, v => {
        this.displaySecurityScore = v;
        const str = `${v}%`;
        if (this.kpiData.securityStatus) this.kpiData.securityStatus.value = str;
        Object.values(this.kpiSnapshots).forEach(snap => {
          if (snap.securityStatus) snap.securityStatus.value = str;
        });
      });
      this.hasAnimated = true;
    }
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

    const pcts = [critical, high, medium, low].map(v => total > 0 ? Math.round((v / total) * 100) : 0);
    let sum = pcts.reduce((a, b) => a + b, 0);
    
    // Adjust if sum != 100 due to rounding
    if (total > 0 && sum !== 100) {
      const diff = 100 - sum;
      // Find the index of the largest segment to apply the difference
      const counts = [critical, high, medium, low];
      const maxIndex = counts.indexOf(Math.max(...counts));
      pcts[maxIndex] += diff;
    }

    this.incidentStats = {
      total,
      critical,
      high,
      medium,
      low,
      criticalPct: pcts[0],
      highPct: pcts[1],
      mediumPct: pcts[2],
      lowPct: pcts[3],
    };
    
    // Only animate donut chart on first load
    if (!this.hasAnimated) this.animateIncidentDonutChart();
    else {
      this.animatedCriticalPct = this.incidentStats.criticalPct;
      this.animatedHighPct = this.incidentStats.highPct;
      this.animatedMediumPct = this.incidentStats.mediumPct;
      this.animatedLowPct = this.incidentStats.lowPct;
    }
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
      lookbackMs = 7 * 24 * 60 * 60 * 1000;
      slots = 7;
    }

    trendData = new Array(slots).fill(0);
    const startTime = new Date(now.getTime() - lookbackMs);

    incidents.forEach(incident => {
      // Try every common field name — Firestore docs vary between projects
      const raw =
        incident.createdAt ??
        incident.created_at ??
        incident.timestamp ??
        incident.time ??
        incident.ts ??
        incident.CreatedAt ??
        incident.Timestamp ??
        null;

      // Handle Firestore Timestamp objects, ISO strings, and epoch numbers
      let createdDate: Date | null = null;
      if (raw?.toDate) {
        createdDate = raw.toDate();
      } else if (raw?.seconds) {
        // Firestore Timestamp serialized as { seconds, nanoseconds }
        createdDate = new Date(raw.seconds * 1000);
      } else if (raw) {
        createdDate = new Date(raw);
      }

      if (createdDate && !isNaN(createdDate.getTime()) && createdDate >= startTime) {
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
    this.trendAnimationKey++;
    // 1. Hide SVG → Angular removes it from DOM
    this.trendChartVisible = false;
    this.trendDashOffset = this.TREND_DASH_LEN;
    this.cdr.detectChanges();
    // 2. Show SVG on next tick → Angular creates fresh element → JS animation runs
    setTimeout(() => {
      this.trendChartVisible = true;
      this.cdr.detectChanges();
      requestAnimationFrame(() => requestAnimationFrame(() => this.animateTrendLine()));
    }, 0);
  }

  /** True when all trend slots are zero — used to show the "no data" message */
  get trendIsEmpty(): boolean {
    return this.riskTrendData.length > 0 && this.riskTrendData.every(v => v === 0);
  }


  /** JS-driven stroke-dashoffset animation: draws the polyline from left to right */
  private animateTrendLine(): void {
    const duration = 2200;
    const dashLen = this.TREND_DASH_LEN;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      this.trendDashOffset = dashLen - dashLen * eased;
      this.cdr.detectChanges();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  animateIncidentDonutChart() {
    const duration = 1000;
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

    const pcts = [open, investigating, contained, resolved].map(v => total > 0 ? Math.round((v / total) * 100) : 0);
    let sum = pcts.reduce((a, b) => a + b, 0);

    // Adjust if sum != 100 due to rounding
    if (total > 0 && sum !== 100) {
      const diff = 100 - sum;
      // Adjust the largest count to maintain visual balance
      const counts = [open, investigating, contained, resolved];
      const maxIndex = counts.indexOf(Math.max(...counts));
      pcts[maxIndex] += diff;
    }

    this.incidentStatusStats = {
      total,
      open,
      investigating,
      contained,
      resolved,
      openPct: pcts[0],
      investigatingPct: pcts[1],
      containedPct: pcts[2],
      resolvedPct: pcts[3]
    };

    // Only animate donut chart on first load
    if (!this.hasAnimated) this.animateStatusDonutChart();
    else {
      this.animatedOpenPct = this.incidentStatusStats.openPct;
      this.animatedInvestigatingPct = this.incidentStatusStats.investigatingPct;
      this.animatedContainedPct = this.incidentStatusStats.containedPct;
      this.animatedResolvedPct = this.incidentStatusStats.resolvedPct;
    }
  }

  animateStatusDonutChart() {
    const duration = 1000;
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
    if (this.cachedIncidents.length > 0) {
      // Re-compute from real incident data
      this.updateTrendData(this.cachedIncidents, period);
    } else {
      // Data not yet loaded — show empty until Firestore responds
      this.riskTrendData = [];
      this.trendTimeLabels = [];
      this.updateYAxisLabels();
      this.trendAnimationKey++;
    }
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
        // Every 2-hour mark: 0h, 2h, 4h … 22h
        labels.push(`${i * 2}h`);
      } else if (period === '7d') {
        // Short day names: Mon, Tue …
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - i));
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels.push(dayNames[date.getDay()]);
      } else {
        // 30d: show "Mar 1" style label every 5 slots, blank otherwise
        if (i % 5 === 0 || i === count - 1) {
          const date = new Date(now);
          date.setDate(now.getDate() - (count - 1 - i));
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          labels.push(`${months[date.getMonth()]} ${date.getDate()}`);
        } else {
          labels.push('');
        }
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
