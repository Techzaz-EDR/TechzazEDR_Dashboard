import { Component } from '@angular/core';
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
export class Incidents {
    // Icons
    readonly PlusIcon = Plus;
    readonly SearchIcon = Search;
    readonly MonitorIcon = Monitor;
    readonly AlertTriangleIcon = AlertTriangle;
    readonly ShieldOffIcon = ShieldOff;
    readonly ShieldIcon = Shield;
    readonly EyeIcon = Eye;
    readonly CircleIcon = Circle;

    incidents = [
        {
            id: 1,
            title: 'Critical Malware Outbreak',
            description: 'Multiple endpoints infected with ransomware',
            status: 'investigating',
            priority: 'critical',
            threats: 12,
            endpoints: 5,
            time: '2 hours ago',
            assignee: 'Security Team'
        },
        {
            id: 2,
            title: 'Unauthorized Access Attempt',
            description: 'Brute force attack detected on admin account',
            status: 'contained',
            priority: 'high',
            threats: 3,
            endpoints: 1,
            time: '5 hours ago',
            assignee: 'John Doe'
        },
        {
            id: 3,
            title: 'Data Exfiltration Detected',
            description: 'Suspicious data transfer to external server',
            status: 'open',
            priority: 'high',
            threats: 8,
            endpoints: 2,
            time: '1 day ago',
            assignee: 'Jane Smith'
        },
        {
            id: 4,
            title: 'Privilege Escalation',
            description: 'User attempted to escalate privileges',
            status: 'resolved',
            priority: 'medium',
            threats: 1,
            endpoints: 1,
            time: '3 days ago',
            assignee: 'Security Team'
        }
    ];

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

        this.incidents.unshift({
            id: this.incidents.length + 1,
            title: this.newIncident.title,
            description: this.newIncident.description,
            status: this.newIncident.status.toLowerCase(),
            priority: this.newIncident.severity.toLowerCase(),
            threats: 0,
            endpoints: this.newIncident.endpoints.length,
            time: 'Just now',
            assignee: this.newIncident.assignee
        });

        this.closeModal();
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
