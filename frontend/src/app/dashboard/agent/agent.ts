import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { FirestoreService } from '../../core/services/firestore.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './agent.html',
  styleUrl: './agent.scss'
})
export class AgentComponent implements OnInit, OnDestroy {
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
    private router: Router,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.firestoreService.selectedAgentId$.subscribe(id => {
        this.agentId = id;
        if (this.agentId) {
          this.loadAgentData(this.agentId);
        } else {
          // If no agent selected, redirect back
          this.router.navigate(['/dashboard/endpoints']);
        }
      })
    );
  }

  private loadAgentData(agentId: string) {
    this.agentDetails = null; // Reset
    this.alerts = [];
    this.commands = [];

    // Real-time Firestore Subscriptions
    this.subscriptions.add(
      this.firestoreService.getAgentDetails(agentId).subscribe(details => {
        if (details) {
          this.agentDetails = {
            ...details,
            name: details.hostname || details.id,
            os: details.os || 'Unknown OS',
            ip: details.ip || '0.0.0.0',
            status: details.status || 'offline',
            last_seen: details.last_seen
          };
        } else {
          // No data found in Firestore
          this.agentDetails = { id: agentId, status: 'unknown' };
        }
      })
    );

    this.subscriptions.add(
      this.firestoreService.getAgentAlerts(agentId).subscribe(alerts => {
        this.alerts = alerts;
      })
    );

    this.subscriptions.add(
      this.firestoreService.getAgentCommands(agentId).subscribe(commands => {
        this.commands = commands;
      })
    );
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

  backToEndpoints() {
    this.router.navigate(['/dashboard/endpoints']);
  }
}
