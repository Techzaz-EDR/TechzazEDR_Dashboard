import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule,
    Search, Monitor, AlertTriangle, ShieldOff, Shield, Eye, Circle
} from 'lucide-angular';

@Component({
    selector: 'app-incidents',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
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

    incidents: any[] = [];

    constructor(private firestoreService: FirestoreService, private zone: NgZone) {}

    ngOnInit() {
        this.subs.add(
            this.firestoreService.getOrganizationAlerts().subscribe(data => {
                this.incidents = data.map(item => ({
                    ...item,
                    title: item.title || item.RuleId || item.rule_name || 'Security Alert',
                    description: item.description || item.Details?.description || item.reason || 'Potential threat detected',
                    severity: (item.severity || item.Severity || 'medium').toLowerCase(),
                    priority: (item.severity || item.Severity || 'medium').toLowerCase(),
                    status: item.status || item.Status || 'open',
                    endpoints: item.agent_id || 'Unknown',
                    threats: 1,
                    assignee: item.assignee || 'Unassigned'
                }));
            })
        );
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
}
