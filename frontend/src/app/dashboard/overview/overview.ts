import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Info, ArrowUp, AlertTriangle, XCircle, RefreshCw, Ban, Search,
  CheckCircle, Shield, Activity
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

  // Global time filter
  activeTimeFilter = '24h';
  customFrom = '';
  customTo = '';

  // Per-period KPI snapshots
  private kpiSnapshots: Record<string, {
    securityStatus: { label: string; value: string; subtitle: string; status: string; icon: any };
    activeIncidents: { label: string; value: number; status: string; icon: any };
    atRiskEndpoints: { label: string; value: number; status: string; icon: any };
    unmanagedDevices: { label: string; value: number; status: string; icon: any };
  }> = {
    '24h': {
      securityStatus: { label: 'Security Score', value: '85%', subtitle: 'Overall Security Posture', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 3, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 12, status: 'critical', icon: XCircle },
      unmanagedDevices: { label: 'Unmanaged Devices', value: 8, status: 'neutral', icon: Ban }
    },
    '7d': {
      securityStatus: { label: 'Security Score', value: '78%', subtitle: 'Overall Security Posture', status: 'degraded', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 11, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 24, status: 'critical', icon: XCircle },
      unmanagedDevices: { label: 'Unmanaged Devices', value: 13, status: 'neutral', icon: Ban }
    },
    '30d': {
      securityStatus: { label: 'Security Score', value: '71%', subtitle: 'Overall Security Posture', status: 'critical', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 38, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 47, status: 'critical', icon: XCircle },
      unmanagedDevices: { label: 'Unmanaged Devices', value: 21, status: 'neutral', icon: Ban }
    },
    'custom': {
      securityStatus: { label: 'Security Score', value: '—', subtitle: 'Select a date range', status: 'secure', icon: Info },
      activeIncidents: { label: 'Active Incidents', value: 0, status: 'critical', icon: AlertTriangle },
      atRiskEndpoints: { label: 'At-Risk Endpoints', value: 0, status: 'critical', icon: XCircle },
      unmanagedDevices: { label: 'Unmanaged Devices', value: 0, status: 'neutral', icon: Ban }
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
    offline: 17
  };

  // 3. Secondary Row
  // Agent Health & Updates
  agentHealth: any[] = [
    { label: 'Outdated Agents', count: 42, color: 'warning', action: 'Update', isProcessing: false },
    { label: 'Failed Updates', count: 3, color: 'critical', action: 'Retry', isProcessing: false },
    { label: 'Pending Restart', count: 12, color: 'neutral', action: 'Reboot', isProcessing: false }
  ];

  handleHealthAction(item: any) {
    if (item.isProcessing || item.count === 0) return;

    item.isProcessing = true;

    // Simulate background process
    const duration = 1500 + Math.random() * 1500;
    setTimeout(() => {
      item.isProcessing = false;
      if (item.count > 0) {
        item.count--;
      }
    }, duration);
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

  private mockThreatsPool = [
    { name: 'Cobalt Strike Beacon', host: 'FIN-WKS-023', severity: 'critical', type: 'Malware', technique: 'Command & Control' },
    { name: 'Mimikatz Dump', host: 'IT-ADM-001', severity: 'critical', type: 'Privilege Escalation', technique: 'Credential Dumping' },
    { name: 'Cryptominer', host: 'DEV-SRV-004', severity: 'medium', type: 'PUP', technique: 'Resource Hijacking' },
    { name: 'Port Scan', host: 'EXT-FW-01', severity: 'low', type: 'Recon', technique: 'Network Discovery' },
    { name: 'Emotet Trojan', host: 'SALES-PC-05', severity: 'critical', type: 'Trojan', technique: 'Phishing Payload' }
  ];

  private intervalId: any;

  // Animation properties
  animatedProtectionPct = 0;
  animatedAtRiskPct = 0;
  animatedOfflinePct = 0;
  targetProtected = 0;
  targetAtRisk = 0;
  targetOffline = 0;

  private subs = new Subscription();

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.setTrendPeriod('24h');
    this.initThreatSimulation();
    this.animateDonutChart();
    
    // Fetch real incident count
    this.subs.add(
      this.firestoreService.getOrganizationAlerts().subscribe(alerts => {
        if (this.kpiData && this.kpiData.activeIncidents) {
          this.kpiData.activeIncidents.value = alerts.length;
        }
      })
    );
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

  initThreatSimulation() {
    // Initial population
    this.recentThreats = [
      { id: '1', time: '2m ago', name: 'Cobalt Strike Beacon', host: 'FIN-WKS-023', severity: 'critical', type: 'Malware', technique: 'Command & Control' },
      { id: '2', time: '15m ago', name: 'PowerShell Empire', host: 'HR-LAP-009', severity: 'high', type: 'Exploit', technique: 'Lateral Movement' },
      { id: '3', time: '1h ago', name: 'Mimikatz Dump', host: 'IT-ADM-001', severity: 'critical', type: 'Privilege Escalation', technique: 'Credential Dumping' }
    ];

    this.intervalId = setInterval(() => {
      this.addNewThreat();
    }, 5000);
  }

  addNewThreat() {
    const randomThreat = this.mockThreatsPool[Math.floor(Math.random() * this.mockThreatsPool.length)];
    const newThreat = {
      id: Math.random().toString(36).substr(2, 9),
      time: 'Just now',
      name: randomThreat.name,
      host: randomThreat.host,
      severity: randomThreat.severity,
      type: randomThreat.type,
      technique: randomThreat.technique
    };

    this.recentThreats.unshift(newThreat);
    if (this.recentThreats.length > 5) this.recentThreats.pop();
  }
}
