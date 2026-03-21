import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
    LucideAngularModule,
    Search, Monitor, AlertTriangle, ShieldOff, Shield, Eye, Circle, X, CheckCircle, Clock, User, MessageSquare, ArrowRight, ExternalLink
} from 'lucide-angular';

@Component({
    selector: 'app-incidents',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
    templateUrl: './incidents.html',
    styleUrl: './incidents.scss',
})
export class Incidents implements OnInit, OnDestroy {
    private subs = new Subscription();
    // Icons
    readonly SearchIcon = Search;
    readonly MonitorIcon = Monitor;
    readonly AlertTriangleIcon = AlertTriangle;
    readonly ShieldOffIcon = ShieldOff;
    readonly ShieldIcon = Shield;
    readonly EyeIcon = Eye;
    readonly CircleIcon = Circle;
    readonly XIcon = X;
    readonly CheckCircleIcon = CheckCircle;
    readonly ClockIcon = Clock;
    readonly UserIcon = User;
    readonly MessageSquareIcon = MessageSquare;
    readonly ArrowRightIcon = ArrowRight;
    readonly ExternalLinkIcon = ExternalLink;

    incidents: any[] = [];
    selectedIncident: any = null;

    constructor(
        private firestoreService: FirestoreService,
        private zone: NgZone,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.subs.add(
            this.firestoreService.getOrganizationIncidents().subscribe(data => {
                this.incidents = data.map(item => ({
                    ...item,
                    incidentId: item.incidentId || `#${item.id?.slice(0, 6).toUpperCase()}`,
                    title: item.title || item.name || 'Security Alert',
                    description: item.description || 'No description provided.',
                    severity: (item.severity || 'medium').toLowerCase(),
                    priority: (item.severity || 'medium').toLowerCase(),
                    status: item.status || 'open',
                    endpoints: item.affectedAssets?.[0]?.hostname || item.agent_id || 'Unknown',
                    endpointIp: item.affectedAssets?.[0]?.ip || '',
                    threats: item.affectedAssets?.length || 1,
                    time: this.formatTime(item.createdAt || item.timestamp),
                    assignee: item.assigneeName || item.assignee || 'Unassigned',
                    assigneeEmail: item.assignee || '',
                }));
                this.cdr.detectChanges();
            })
        );
    }

    private formatTime(value: any): string {
        if (!value) return 'Unknown';
        try {
            // Firestore Timestamp
            const date = value?.toDate ? value.toDate() : new Date(value);
            if (isNaN(date.getTime())) return String(value);
            const diffMs = Date.now() - date.getTime();
            const mins = Math.floor(diffMs / 60000);
            if (mins < 1) return 'Just now';
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            return `${Math.floor(hrs / 24)}d ago`;
        } catch { return String(value); }
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    // Filters
    filterStatus = 'All Status';
    filterPriority = 'All Priorities';
    searchTerm = '';

    get filteredIncidents() {
        console.log('Filtering triggered. Status:', this.filterStatus, 'Priority:', this.filterPriority, 'Search:', this.searchTerm);
        const results = this.incidents.filter(incident => {
            const matchStatus = this.filterStatus === 'All Status' || incident.status.toLowerCase() === this.filterStatus.toLowerCase();
            const matchPriority = this.filterPriority === 'All Priorities' || incident.priority.toLowerCase() === this.filterPriority.toLowerCase();

            const term = this.searchTerm.toLowerCase();
            const matchSearch = !term ||
                incident.title.toLowerCase().includes(term) ||
                incident.description.toLowerCase().includes(term) ||
                incident.assignee.toLowerCase().includes(term);

            return matchStatus && matchPriority && matchSearch;
        });
        console.log('Filtered Count:', results.length);
        return results;
    }


    // Actions
    async isolateEndpoint(incident: any) {
        if (!incident.agent_id) {
            console.error('Cannot isolate: No agent ID for incident', incident.id);
            alert('Error: Agent ID missing for this incident.');
            return;
        }

        console.log(`Sending ISOLATE command for agent ${incident.agent_id} (Incident #${incident.id})`);
        try {
            await this.firestoreService.sendCommand(incident.agent_id, 'isolate_endpoint');
            alert(`Isolation command sent successfully for Agent: ${incident.agent_id}`);
            
            // Optionally update status to contained
            await this.firestoreService.updateAlertStatus(incident.agent_id, incident.id, 'contained');
        } catch (error) {
            console.error('Failed to isolate endpoint:', error);
            alert('Failed to send isolation command. Check console for details.');
        }
    }

    async blockThreat(incident: any) {
        if (!incident.agent_id) {
            alert('Error: Agent ID missing for this incident.');
            return;
        }

        console.log(`Sending BLOCK_INDICATOR command for agent ${incident.agent_id} (Incident #${incident.id})`);
        try {
            await this.firestoreService.sendCommand(incident.agent_id, 'block_indicator', { 
                detail: incident.description,
                incident_id: incident.id 
            });
            alert(`Global block rule created for threat in Incident #${incident.id}. Distributed to agent ${incident.agent_id}.`);
        } catch (error) {
            console.error('Failed to block threat:', error);
            alert('Failed to create block rule. Check console for details.');
        }
    }

    async investigate(incident: any) {
        if (!incident.agent_id) {
            alert('Error: Agent ID missing for this incident.');
            return;
        }

        console.log(`Updating status to 'investigating' for Incident #${incident.id}`);
        try {
            await this.firestoreService.updateAlertStatus(incident.agent_id, incident.id, 'investigating');
            // UI will automatically update via Firestore onSnapshot
            console.log('Status updated successfully');
        } catch (error) {
            console.error('Failed to update incident status:', error);
            alert('Failed to update status. Check console for details.');
        }
    }

    selectIncident(incident: any) {
        console.log('CLICK: selectIncident called for', incident.incidentId);
        this.selectedIncident = { ...incident };
        this.cdr.detectChanges();
    }

    closeDetails() {
        console.log('CLICK: closeDetails called');
        this.selectedIncident = null;
        this.cdr.detectChanges();
    }

    async updateStatus(newStatus: string) {
        if (!this.selectedIncident) return;
        
        const incident = this.selectedIncident;
        console.log(`Updating status for Incident #${incident.id} to ${newStatus}`);
        
        try {
            await this.firestoreService.updateIncidentStatus(incident.id, newStatus.toLowerCase());
            // Update local state for immediate feedback
            this.selectedIncident.status = newStatus.toLowerCase();
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status. Check console for details.');
        }
    }
}
