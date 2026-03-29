import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirestoreService } from '../../core/services/firestore.service';
import {
    LucideAngularModule,
    Shield, Plus, Search, Download
} from 'lucide-angular';
import { Subscription } from 'rxjs';
import { BootstrapService, BootstrapResponse } from '../../core/services/bootstrap.service';

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
    readonly DownloadIcon = Download;

    filteredEndpoints: any[] = [];
    searchQuery: string = '';
    endpoints: any[] = [];
    private subscriptions: Subscription = new Subscription();
    private statusRefreshInterval: any;

    constructor(
        private firestoreService: FirestoreService,
        private bootstrapService: BootstrapService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        console.log('Endpoints Component Initialized');
        this.subscriptions.add(
            this.firestoreService.getAgents().subscribe(agents => {
                console.log('Agents received in component:', agents.length);
                // Debug: log last_seen value and type for first agent
                if (agents.length > 0) {
                    const sample = agents[0];
                    console.log('[Status Debug] last_seen value:', sample.last_seen, 'type:', typeof sample.last_seen, 'hasToDate:', !!(sample.last_seen?.toDate));
                }
                this.endpoints = agents.map(a => ({
                    ...a,
                    name: a.agent_name || a.hostname || a.id,
                    os: a.os || 'Unknown OS',
                    ip: a.ip || '0.0.0.0',
                    status: this.computeStatus(a.last_seen),
                    lastSeen: a.last_seen ? this.formatLastSeen(a.last_seen) : 'Never'
                }));
                this.onSearch();
                this.cdr.detectChanges();
            })
        );

        // Recompute online/offline status every 30s without waiting for a Firestore change
        this.statusRefreshInterval = setInterval(() => {
            if (this.endpoints.length === 0) return;
            this.endpoints = this.endpoints.map(ep => ({
                ...ep,
                status: this.computeStatus(ep.last_seen),
                lastSeen: ep.last_seen ? this.formatLastSeen(ep.last_seen) : 'Never'
            }));
            this.onSearch();
            this.cdr.detectChanges();
        }, 30_000);
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.statusRefreshInterval) clearInterval(this.statusRefreshInterval);
    }

    /** An agent is online only if it checked in within the last 90 seconds. */
    private computeStatus(lastSeen: any): string {
        if (!lastSeen) return 'offline';
        const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
        const diffSeconds = (Date.now() - date.getTime()) / 1000;
        return diffSeconds < 90 ? 'online' : 'offline';
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
        os: 'Windows 11',
        type: 'Workstation'
    };
    
    // Bootstrap Script State
    isGenerating = false;
    isGeneratingGlobal = false;
    generatedScript: BootstrapResponse | null = null;
    errorMessage: string | null = null;

    openModal() {
        this.showAddModal = true;
    }

    closeModal() {
        this.showAddModal = false;
        // Reset form and state
        this.newEndpoint = {
            name: '',
            os: 'Windows 11',
            type: 'Workstation'
        };
        this.isGenerating = false;
        this.generatedScript = null;
        this.errorMessage = null;
    }

    addEndpoint() {
        if (!this.newEndpoint.name) return;
        
        this.isGenerating = true;
        this.errorMessage = null;
        
        this.bootstrapService.generateBootstrapScript(
            this.newEndpoint.name,
            this.newEndpoint.os,
            this.newEndpoint.type
        ).subscribe({
            next: (response) => {
                this.isGenerating = false;
                this.generatedScript = response;
                console.log('Bootstrap script generated:', response.filename);
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isGenerating = false;
                const errMsg = err?.error?.detail || err?.message || 'Unknown error';
                const status = err?.status || 'No status';
                this.errorMessage = `Failed: [${status}] ${errMsg}`;
                console.error('Error generating script:', err);
                this.cdr.detectChanges();
            }
        });
    }

    downloadScript() {
        if (!this.generatedScript) return;
        this.saveToFile(this.generatedScript.script_content, this.generatedScript.filename);
    }
 
    downloadGlobalBootstrapScript() {
        this.isGeneratingGlobal = true;
        this.errorMessage = null;
 
        this.bootstrapService.generateBootstrapScript("GENERIC").subscribe({
            next: (response) => {
                this.isGeneratingGlobal = false;
                this.saveToFile(response.script_content, response.filename);
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isGeneratingGlobal = false;
                const errMsg = err?.error?.detail || err?.message || 'Unknown error';
                this.errorMessage = `Failed to generate bootstrap script: ${errMsg}`;
                console.error('Error generating global script:', err);
                this.cdr.detectChanges();
            }
        });
    }
 
    private saveToFile(content: string, filename: string) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}
