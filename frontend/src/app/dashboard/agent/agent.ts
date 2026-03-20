import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  Play,
  History,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X
} from 'lucide-angular';
import { FirestoreService } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
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
  readonly HistoryIcon = History;
  readonly EyeIcon = Eye;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly MaximizeIcon = Maximize2;
  readonly CloseIcon = X;
  readonly Math = Math;

  agentId: string | null = null;
  agentDetails: any = null;
  alerts: any[] = [];
  commands: any[] = [];
  commandStats: { total: number, completed: number, pending: number, failed: number } = { total: 0, completed: 0, pending: 0, failed: 0 };
  
  showCommandHistoryModal: boolean = false;
  showConfigureAgentModal: boolean = false;
  showAlertModal: boolean = false;
  loadingCommands: { [key: string]: boolean } = {};

  // Investigation Form
  investigationSeverity: string = 'High';
  investigationAssignee: string = '';
  isCreatingIncident: boolean = false;

  // Real organization users for assignment
  availableUsers: { id: string; name: string; email: string; role: string }[] = [];
  isLoadingUsers: boolean = false;
  private firestoreDb = getFirestore(getAuth().app);

  // Pagination for Alerts
  currentPage: number = 1;
  pageSize: number = 50;
  ruleDescriptions: { [key: string]: any } = {};

  get totalPages(): number {
    return Math.ceil(this.alerts.length / this.pageSize);
  }

  get paginatedAlerts(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.alerts.slice(startIndex, startIndex + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.detectChanges();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.detectChanges();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.cdr.detectChanges();
  }

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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

    // Load real organization users for the assignee dropdown
    this.loadOrganizationUsers();
  }

  private loadOrganizationUsers() {
    this.isLoadingUsers = true;
    this.subscriptions.add(
      this.authService.userProfile$.subscribe(async profile => {
        if (profile && profile.organization_id) {
          try {
            const usersRef = collection(this.firestoreDb, 'users');
            const q = query(usersRef, where('organization_id', '==', profile.organization_id));
            const snapshot = await getDocs(q);
            this.availableUsers = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data['name'] || data['email'] || 'Unknown',
                email: data['email'] || '',
                role: data['role'] || 'Analyst'
              };
            });
            // Default assignee to the first user if available
            if (this.availableUsers.length > 0 && !this.investigationAssignee) {
              this.investigationAssignee = this.availableUsers[0].email;
            }
          } catch (error) {
            console.error('Error loading organization users:', error);
          } finally {
            this.isLoadingUsers = false;
            this.cdr.detectChanges();
          }
        }
      })
    );
  }

  private loadAgentData(agentId: string) {
    this.agentDetails = null; // Reset
    this.alerts = [];
    this.commands = [];
    this.currentPage = 1;

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
            last_seen: this.formatLastSeen(details.last_seen)
          };
          this.cdr.detectChanges();
        } else {
          // No data found in Firestore
          this.agentDetails = { id: agentId, status: 'unknown' };
          this.cdr.detectChanges();
        }
      })
    );

    this.subscriptions.add(
      this.firestoreService.getAgentAlerts(agentId).subscribe(alerts => {
        this.alerts = alerts.map(a => {
          let description = a.description || '';
          
          // If description is missing or looks like raw JSON, try to extract better info
          if (a.Details) {
            const d = a.Details;
            // Prioritize specific fields if description is generic or missing
            if (!description || description.startsWith('{')) {
              const parts = [];
              if (d.Source) parts.push(`Source: ${d.Source}`);
              if (d.Target) parts.push(`Target: ${d.Target}`);
              if (d.Reason) parts.push(`Reason: ${d.Reason}`);
              if (d.Action) parts.push(`Action: ${d.Action}`);
              
              if (parts.length > 0) {
                description = parts.join(' | ');
              } else if (d.description) {
                description = d.description;
              } else if (!description) {
                description = JSON.stringify(d);
              }
            }
          }

          if (!description) {
            description = 'Security event details not available';
          }

          return {
            ...a,
            severity: a.Severity || a.severity || 'Medium',
            name: a.RuleId || a.Category || a.name || 'Security Alert',
            description: description,
            ruleInfo: this.ruleDescriptions[a.RuleId] || null,
            displayTime: this.formatAlertTime(a.Timestamp || a.timestamp)
          };
        });

        // Trigger rule info fetching for all unique RuleIds
        this.enrichAlertsWithRules();
        
        // Ensure selectedAlert remains valid if it's still in the list
        if (this.selectedAlert) {
          const updated = this.alerts.find(a => 
            (a.Timestamp && a.Timestamp === this.selectedAlert.Timestamp) || 
            (a.id && a.id === this.selectedAlert.id)
          );
          if (updated) this.selectedAlert = updated;
        }

        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.firestoreService.getAgentCommands(agentId).subscribe(commands => {
        this.commands = commands;
        this.calculateCommandStats();
        this.cdr.detectChanges();
      })
    );
  }

  private enrichAlertsWithRules() {
    const ruleIds = [...new Set(this.alerts.map(a => a.RuleId).filter(id => id && !this.ruleDescriptions[id]))];
    
    ruleIds.forEach(ruleId => {
      // Initialize with a pending state to avoid redundant fetches
      this.ruleDescriptions[ruleId] = { loading: true };
      
      this.subscriptions.add(
        this.firestoreService.getRule(ruleId).subscribe(rule => {
          if (rule) {
            this.ruleDescriptions[ruleId] = rule;
            // Update the name and description of all matching alerts
            this.alerts.forEach(a => {
              if (a.RuleId === ruleId) {
                a.ruleInfo = rule;
                // If the rule has a better name, use it (keep RuleId prefix if preferred)
                if (rule.name) {
                  a.name = `${ruleId}: ${rule.name}`;
                }
              }
            });
            this.cdr.detectChanges();
          } else {
            this.ruleDescriptions[ruleId] = { notFound: true };
          }
        })
      );
    });
  }

  private calculateCommandStats() {
    this.commandStats = {
      total: this.commands.length,
      completed: this.commands.filter(c => c.status === 'completed').length,
      pending: this.commands.filter(c => c.status === 'pending').length,
      failed: this.commands.filter(c => c.status === 'failed').length
    };
  }

  getCommandIcon(command: string): any {
    const cmd = command.toLowerCase();
    if (cmd.includes('scan') || cmd.includes('network')) return this.ActivityIcon;
    if (cmd.includes('system') || cmd.includes('hids')) return this.ShieldIcon;
    if (cmd.includes('config')) return this.SettingsIcon;
    return this.TerminalIcon;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async runRemoteScan() {
    if (!this.agentId) return;
    this.loadingCommands['remoteScan'] = true;
    try {
      await this.firestoreService.sendCommand(this.agentId, 'run_remote_scan');
    } finally {
      setTimeout(() => this.loadingCommands['remoteScan'] = false, 2000);
    }
  }

  openConfigureAgentModal() {
    this.showConfigureAgentModal = true;
    this.cdr.detectChanges();
  }

  closeConfigureAgentModal() {
    this.showConfigureAgentModal = false;
    this.cdr.detectChanges();
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

  toggleCommandHistory() {
    this.showCommandHistoryModal = !this.showCommandHistoryModal;
    this.cdr.detectChanges();
  }

  openCommandHistoryModal() {
    this.showCommandHistoryModal = true;
    this.cdr.detectChanges();
  }

  closeCommandHistoryModal() {
    this.showCommandHistoryModal = false;
    this.cdr.detectChanges();
  }

  public formatAlertTime(timestamp: any): string {
    if (!timestamp) return 'Just now';
    
    // If it's a Firestore Timestamp
    if (timestamp && typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      return this.formatDate(date);
    }
    
    // If it's an ISO string or other date format
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return this.formatDate(date);
    }
    
    return String(timestamp);
  }

  public formatLastSeen(timestamp: any): string {
    if (!timestamp) return 'Never';
    
    if (timestamp && typeof timestamp.toDate === 'function') {
      return this.formatRelativeTime(timestamp.toDate());
    }
    
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return this.formatRelativeTime(date);
    }
    
    return String(timestamp);
  }

  private formatDate(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  selectedAlert: any | null = null;

  openAlertDetails(alert: any, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedAlert = alert;
    this.cdr.detectChanges();
  }

  closeAlertDetails(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedAlert = null;
    this.showAlertModal = false;
    this.cdr.detectChanges();
  }

  openAlertModal(): void {
    this.showAlertModal = true;
    if (this.selectedAlert) {
      this.investigationSeverity = this.selectedAlert.severity || 'High';
    }
    this.cdr.detectChanges();
  }

  closeAlertModal(): void {
    this.showAlertModal = false;
    this.cdr.detectChanges();
  }

  async createInvestigation() {
    if (!this.selectedAlert || !this.agentId) return;

    this.isCreatingIncident = true;
    this.cdr.detectChanges();

    const incidentData = {
      name: this.selectedAlert.name,
      description: this.selectedAlert.description,
      severity: this.investigationSeverity,
      assignee: this.investigationAssignee,
      agent_id: this.agentId,
      alert_id: this.selectedAlert.id || 'unknown',
      org_id: this.agentDetails?.org_id || 'demo-org',
      type: this.selectedAlert.Category || 'Malware',
      source_alert: {
        id: this.selectedAlert.id,
        name: this.selectedAlert.name,
        severity: this.selectedAlert.severity
      }
    };

    try {
      await this.firestoreService.createIncident(incidentData);
      // Optionally update alert status to 'investigating'
      if (this.selectedAlert.id) {
        await this.firestoreService.updateAlertStatus(this.agentId, this.selectedAlert.id, 'investigating');
      }
      
      this.closeAlertModal();
      // Show some success feedback if needed, but for now just close
    } catch (error) {
      console.error("Error creating incident:", error);
    } finally {
      this.isCreatingIncident = false;
      this.cdr.detectChanges();
    }
  }
}
