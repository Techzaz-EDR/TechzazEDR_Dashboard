import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  LucideAngularModule, 
  Terminal, 
  Shield, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Search, 
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Play
} from 'lucide-angular';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-endpoint-details',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './details.html',
  styleUrl: './details.scss'
})
export class EndpointDetails implements OnInit, OnDestroy {
  // Icons
  readonly TerminalIcon = Terminal;
  readonly ShieldIcon = Shield;
  readonly ActivityIcon = Activity;
  readonly ClockIcon = Clock;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly SearchIcon = Search;
  readonly SettingsIcon = Settings;
  readonly RefreshCwIcon = RefreshCw;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly PlayIcon = Play;

  agentId: string | null = null;
  agentDetails: any = null;
  alerts: any[] = [];
  commands: any[] = [];
  
  loadingCommands: { [key: string]: boolean } = {};

  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private firestoreService: FirestoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.agentId = this.route.snapshot.paramMap.get('id');
    
    if (this.agentId) {
      // Mock Data Fallbacks
      this.agentDetails = {
        status: 'active',
        ip: '192.168.1.101',
        os: 'Windows 10 Pro',
        last_seen: { toDate: () => new Date() }
      };

      this.alerts = [
        { name: 'Unauthorized PowerShell Execution', severity: 'High', description: 'Encoded command detected in user context', timestamp: { toDate: () => new Date(Date.now() - 1000 * 60 * 15) } },
        { name: 'Suspicious Network Connection', severity: 'Medium', description: 'Connection attempt to known C2 IP', timestamp: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 2) } }
      ];

      this.commands = [
        { command: 'run_hids_scan', status: 'completed', timestamp: { toDate: () => new Date(Date.now() - 1000 * 60 * 30) } }
      ];

      // Real-time Firestore Subscriptions
      this.subscriptions.add(
        this.firestoreService.getAgentDetails(this.agentId).subscribe(details => {
          if (details) { this.agentDetails = details; this.cdr.detectChanges(); }
        })
      );

      this.subscriptions.add(
        this.firestoreService.getAgentAlerts(this.agentId).subscribe(alerts => {
          if (alerts && alerts.length > 0) { this.alerts = alerts; this.cdr.detectChanges(); }
        })
      );

      this.subscriptions.add(
        this.firestoreService.getAgentCommands(this.agentId).subscribe(commands => {
          if (commands && commands.length > 0) { this.commands = commands; this.cdr.detectChanges(); }
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async runNetworkScan() {
    if (!this.agentId) return;
    this.loadingCommands['network'] = true;
    try {
      await this.firestoreService.sendCommand(this.agentId, 'run_network_scan');
    } finally {
      setTimeout(() => this.loadingCommands['network'] = false, 2000);
    }
  }

  async runSystemScan() {
    if (!this.agentId) return;
    this.loadingCommands['system'] = true;
    try {
      await this.firestoreService.sendCommand(this.agentId, 'run_hids_scan');
    } finally {
      setTimeout(() => this.loadingCommands['system'] = false, 2000);
    }
  }

  async updateConfig() {
    if (!this.agentId) return;
    this.loadingCommands['config'] = true;
    try {
      await this.firestoreService.sendCommand(this.agentId, 'update_config');
    } finally {
      setTimeout(() => this.loadingCommands['config'] = false, 2000);
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return '';
    }
  }
}
