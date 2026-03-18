import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirestoreService } from '../../core/services/firestore.service';
import {
    LucideAngularModule,
    Shield, Plus, Search, AlertTriangle
} from 'lucide-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-endpoints',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  templateUrl: './endpoints.html',
  styleUrl: './endpoints.scss'
})
export class Endpoints implements OnInit, OnDestroy {
    // Icons
    readonly ShieldIcon = Shield;
    readonly PlusIcon = Plus;
    readonly SearchIcon = Search;
    readonly AlertTriangleIcon = AlertTriangle;

    filteredEndpoints: any[] = [];
    searchQuery: string = '';
    endpoints: any[] = [];
    private subscriptions: Subscription = new Subscription();

    constructor(
        private firestoreService: FirestoreService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        console.log('Endpoints Component Initialized');
        this.subscriptions.add(
            this.firestoreService.getAgents().subscribe(agents => {
                console.log('Agents received in component:', agents.length);
                this.endpoints = agents.map(a => ({
                    ...a,
                    name: a.hostname || a.id,
                    os: a.os || 'Unknown OS',
                    ip: a.ip || '0.0.0.0',
                    status: a.status || 'offline',
                    threats: a.threats_count || 0,
                    lastSeen: a.last_seen ? this.formatLastSeen(a.last_seen) : 'Never'
                }));
                this.onSearch();
                this.cdr.detectChanges(); // Force refresh
            })
        );
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    private formatLastSeen(timestamp: any): string {
        if (!timestamp) return 'Never';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        return date.toLocaleDateString();
    }

    navigateToAgent(id: string) {
        this.firestoreService.setSelectedAgent(id);
        this.router.navigate(['/dashboard/agent']);
    }

    onSearch() {
        if (!this.searchQuery) {
            this.filteredEndpoints = this.endpoints;
            return;
        }
        const query = this.searchQuery.toLowerCase();
        this.filteredEndpoints = this.endpoints.filter(ep => 
            ep.name.toLowerCase().includes(query) || 
            ep.ip.toLowerCase().includes(query) ||
            ep.os.toLowerCase().includes(query)
        );
    }

    // Modal Logic
    showAddModal = false;
    newEndpoint = {
        name: '',
        ip: '',
        os: 'Windows 11',
        type: 'Workstation',
        status: 'protected'
    };

    openModal() {
        this.showAddModal = true;
    }

    closeModal() {
        this.showAddModal = false;
        // Reset form
        this.newEndpoint = {
            name: '',
            ip: '',
            os: 'Windows 11',
            type: 'Workstation',
            status: 'protected'
        };
    }

    addEndpoint() {
        if (!this.newEndpoint.name || !this.newEndpoint.ip) return;
        // In a real app, this would write to Firestore
        // For now, we'll just log or implement the write if we want it to be "real"
        console.log('Adding endpoint:', this.newEndpoint);
        this.closeModal();
    }
}
