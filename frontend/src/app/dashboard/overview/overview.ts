import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Info, ArrowUp, AlertTriangle, XCircle, RefreshCw, Ban, Search,
  CheckCircle, Shield, Activity
} from 'lucide-angular';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
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

  // 1. Top KPI Strip
  kpiData = {
    securityStatus: { label: 'Security Status', value: 'Secure', status: 'secure', icon: Info }, // secure, degraded, critical
    activeIncidents: { label: 'Active Incidents', value: 3, status: 'critical', icon: AlertTriangle },
    atRiskEndpoints: { label: 'At-Risk Endpoints', value: 12, status: 'critical', icon: XCircle },
    unmanagedDevices: { label: 'Unmanaged Devices', value: 8, status: 'neutral', icon: Ban }
  };

  // 2. Main Visual Row - Risk Trend
  currentTrendPeriod = '24h'; // 24h, 7d, 30d
  riskTrendData: number[] = [];

  // Mock trend data
  trends = {
    '24h': [65, 68, 72, 70, 68, 65, 62, 60, 58, 55, 58, 62],
    '7d': [45, 52, 58, 62, 70, 65, 60],
    '30d': [30, 35, 42, 48, 55, 60, 58, 62, 65, 70, 72, 68]
  };

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
  agentHealth = [
    { label: 'Outdated Agents', count: 42, color: 'warning', action: 'Update' },
    { label: 'Failed Updates', count: 3, color: 'critical', action: 'Retry' },
    { label: 'Pending Restart', count: 12, color: 'neutral', action: 'Reboot' }
  ];

  // Top Risk Contributors
  riskContributors = [
    { name: 'Unpatched Endpoints', count: 12, impact: 'High' },
    { name: 'Active Critical Malware', count: 3, impact: 'Critical' },
    { name: 'Offline Devices (>30d)', count: 5, impact: 'Medium' },
    { name: 'Weak Passwords', count: 8, impact: 'Medium' }
  ];

  // 4. Bottom Row
  recentIncidents = [
    { id: 'INC-001', endpoint: 'CEO-LAPTOP', threat: 'Ransomware Precursor', severity: 'critical', status: 'Active' },
    { id: 'INC-002', endpoint: 'FILE-SRV-02', threat: 'Data Exfiltration', severity: 'high', status: 'Investigating' },
    { id: 'INC-003', endpoint: 'HR-LAP-009', threat: 'Powershell Empire', severity: 'high', status: 'Blocked' },
    { id: 'INC-004', endpoint: 'GUEST-WIFI', threat: 'Network Scan', severity: 'medium', status: 'Monitored' }
  ];

  // Threat Feed
  recentThreats: any[] = [];

  private mockThreatsPool = [
    { name: 'Cobalt Strike Beacon', host: 'FIN-WKS-023', severity: 'critical', type: 'Malware' },
    { name: 'Mimikatz Dump', host: 'IT-ADM-001', severity: 'critical', type: 'Privilege Escalation' },
    { name: 'Cryptominer', host: 'DEV-SRV-004', severity: 'medium', type: 'PUP' },
    { name: 'Port Scan', host: 'EXT-FW-01', severity: 'low', type: 'Recon' },
    { name: 'Emotet Trojan', host: 'SALES-PC-05', severity: 'critical', type: 'Trojan' }
  ];

  private intervalId: any;

  // Animation properties
  animatedProtectionPct = 0;
  animatedAtRiskPct = 0;
  animatedOfflinePct = 0;

  // CSS Target Properties
  targetProtected = 0;
  targetAtRisk = 0;
  targetOffline = 0;

  ngOnInit() {
    this.setTrendPeriod('24h');
    this.initThreatSimulation();
    this.animateDonutChart();
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

  setTrendPeriod(period: string) {
    this.currentTrendPeriod = period;
    this.riskTrendData = this.trends[period as keyof typeof this.trends];
  }

  initThreatSimulation() {
    // Initial population
    this.recentThreats = [
      { id: '1', time: '2m ago', name: 'Cobalt Strike Beacon', host: 'FIN-WKS-023', severity: 'critical', type: 'Malware' },
      { id: '2', time: '15m ago', name: 'PowerShell Empire', host: 'HR-LAP-009', severity: 'high', type: 'Exploit' },
      { id: '3', time: '1h ago', name: 'Mimikatz Dump', host: 'IT-ADM-001', severity: 'critical', type: 'Privilege Escalation' }
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
      type: randomThreat.type
    };

    this.recentThreats.unshift(newThreat);
    if (this.recentThreats.length > 5) this.recentThreats.pop();
  }
}
