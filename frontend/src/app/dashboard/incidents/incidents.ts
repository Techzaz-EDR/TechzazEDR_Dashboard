import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule,
    Plus, Search, Monitor, AlertTriangle, ShieldOff, Shield, Eye, Circle
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
    readonly PlusIcon = Plus;
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
            this.firestoreService.getIncidents().subscribe(data => {
                this.incidents = data;
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

    // Modal Logic
    showNewIncidentModal = false;
    newIncident = {
        title: '',
        description: '',
        severity: 'Medium',
        status: 'Open',
        endpoints: [] as string[],
        assignee: 'Me'
    };

    availableEndpoints = ['Desktop-A1', 'Server-DB01', 'Laptop-CEO', 'HR-Workstation-04', 'FileServer-02'];
    availableUsers = ['Me', 'Security Team', 'John Doe', 'Jane Smith', 'System Admin'];

    toggleEndpoint(endpoint: string) {
        const index = this.newIncident.endpoints.indexOf(endpoint);
        if (index === -1) {
            this.newIncident.endpoints.push(endpoint);
        } else {
            this.newIncident.endpoints.splice(index, 1);
        }
    }

    isEndpointSelected(endpoint: string): boolean {
        return this.newIncident.endpoints.includes(endpoint);
    }

    openModal() {
        this.showNewIncidentModal = true;
    }

    closeModal() {
        this.showNewIncidentModal = false;
        this.newIncident = {
            title: '',
            description: '',
            severity: 'Medium',
            status: 'Open',
            endpoints: [],
            assignee: 'Me'
        };
    }

    saveIncident() {
        if (!this.newIncident.title) return;

        const incidentData = {
            title: this.newIncident.title,
            description: this.newIncident.description,
            status: this.newIncident.status.toLowerCase(),
            severity: this.newIncident.severity.toLowerCase(),
            priority: this.newIncident.severity.toLowerCase(),
            endpoints: this.newIncident.endpoints,
            endpoints_count: this.newIncident.endpoints.length,
            assignee: this.newIncident.assignee,
            threats: 0
        };

        this.firestoreService.addIncident(incidentData).then(() => {
            console.log('Incident saved to Firestore');
            this.zone.run(() => {
                this.closeModal();
            });
        }).catch(err => {
            console.error('Error saving incident:', err);
        });
    }

    // Actions
    isolateEndpoint(id: number) {
        console.log(`Isolating endpoint for incident ${id}`);
        // Mock action
        alert(`Endpoint isolate command sent for Incident #${id}`);
    }

    blockThreat(id: number) {
        console.log(`Blocking threat for incident ${id}`);
        // Mock action
        alert(`Global block rule created for threat in Incident #${id}`);
    }

    investigate(id: number) {
        console.log(`Investigating incident ${id}`);
        // navigate to details or show details modal
    }
}
