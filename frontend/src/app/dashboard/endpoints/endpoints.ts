import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirestoreService } from '../../core/services/firestore.service';
import {
    LucideAngularModule,
    Shield, Plus, Download, Search, AlertTriangle, Eye, MoreVertical
} from 'lucide-angular';

@Component({
    selector: 'app-endpoints',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
    templateUrl: './endpoints.html',
    styleUrl: './endpoints.scss'
})
export class Endpoints implements OnInit {
    // Icons
    readonly ShieldIcon = Shield;
    readonly PlusIcon = Plus;
    readonly DownloadIcon = Download;
    readonly SearchIcon = Search;
    readonly AlertTriangleIcon = AlertTriangle;
    readonly EyeIcon = Eye;
    readonly MoreVerticalIcon = MoreVertical;

    filteredEndpoints: any[] = [];
    searchQuery: string = '';

    endpoints = [
        {
            id: 1,
            name: 'DESKTOP-001',
            os: 'Windows 10',
            ip: '192.168.1.101',
            status: 'protected',
            threats: 0,
            lastSeen: '2 minutes ago'
        },
        {
            id: 2,
            name: 'LAPTOP-042',
            os: 'macOS 13.5',
            ip: '192.168.1.102',
            status: 'at-risk',
            threats: 2,
            lastSeen: '5 minutes ago'
        },
        {
            id: 3,
            name: 'SERVER-005',
            os: 'Ubuntu 22.04',
            ip: '192.168.1.50',
            status: 'protected',
            threats: 0,
            lastSeen: '1 minute ago'
        },
        {
            id: 4,
            name: 'WORKSTATION-023',
            os: 'Windows 11',
            ip: '192.168.1.103',
            status: 'compromised',
            threats: 5,
            lastSeen: '30 minutes ago'
        },
        {
            id: 5,
            name: 'MOBILE-001',
            os: 'iOS 17',
            ip: '192.168.1.200',
            status: 'protected',
            threats: 0,
            lastSeen: '10 minutes ago'
        }
    ];

    constructor(
        private firestoreService: FirestoreService,
        private router: Router
    ) {}

    ngOnInit() {
        this.filteredEndpoints = this.endpoints;
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

        this.endpoints.push({
            id: this.endpoints.length + 1,
            name: this.newEndpoint.name,
            os: this.newEndpoint.os,
            ip: this.newEndpoint.ip,
            status: this.newEndpoint.status,
            threats: 0,
            lastSeen: 'Just now'
        });

        this.closeModal();
    }
}
