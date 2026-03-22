import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { FirestoreService } from '../core/services/firestore.service';
import {
    LucideAngularModule,
    Shield, Activity, Zap, BarChart2, FileText, ShieldAlert, Wrench, Users, Clipboard, Settings,
    Search, Clock, Bell, MessageSquare, Home, LogOut, ChevronDown, CheckCircle, AlertTriangle, Check
} from 'lucide-angular';

export interface NavItem {
    label: string;
    icon: any;
    route?: string;
    children?: NavItem[];
    expanded?: boolean;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, FormsModule, LucideAngularModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    isDropdownOpen = false;
    userEmail: string | null = null;
    userProfile: any = null;
    private profileSub?: Subscription;

    // Search Functionality
    searchQuery = '';
    isSearchFocused = false;

    // Mock Searchable Data
    searchableItems = [
        { title: 'Win10-Desktop-01', type: 'Endpoint', route: '/dashboard/endpoints', description: 'Windows 10 Pro Workstation' },
        { title: 'MacBook-Pro-Dev', type: 'Endpoint', route: '/dashboard/endpoints', description: 'macOS Monterey 12.4' },
        { title: 'Ubuntu-Server-DB', type: 'Endpoint', route: '/dashboard/endpoints', description: 'Linux Ubuntu 22.04 LTS' },
        { title: 'Ransomware Detected on Win10-Desktop-01', type: 'Threat', route: '/dashboard/threats', description: 'Critical Severity Incident' },
        { title: 'Suspicious Login Attempt', type: 'Incident', route: '/dashboard/incidents', description: 'Multiple failed logins' },
        { title: '9a4dce5...', type: 'Hash', route: '/dashboard/threats', description: 'Associated with known malware' },
        { title: 'Admin User', type: 'User', route: '/dashboard/users', description: 'Security Operations' }
    ];

    get filteredSearchResults() {
        if (!this.searchQuery.trim()) return [];
        const query = this.searchQuery.toLowerCase();
        return this.searchableItems.filter(item =>
            item.title.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
    }

    onSearchFocus() {
        this.isSearchFocused = true;
    }

    onSearchBlur() {
        setTimeout(() => {
            this.isSearchFocused = false;
        }, 150);
    }

    // Icons
    readonly Shield = Shield;
    readonly Activity = Activity;
    readonly Zap = Zap;
    readonly BarChart2 = BarChart2;
    readonly FileText = FileText;
    readonly ShieldAlert = ShieldAlert;
    readonly Wrench = Wrench;
    readonly Users = Users;
    readonly Clipboard = Clipboard;
    readonly Settings = Settings;
    readonly Search = Search;
    readonly Clock = Clock;
    readonly Bell = Bell;
    readonly MessageSquare = MessageSquare;
    readonly Home = Home;
    readonly LogOut = LogOut;
    readonly ChevronDown = ChevronDown;
    readonly Check = Check;

    navItems: NavItem[] = [
        { label: 'Security Overview', icon: Activity, route: '/dashboard/overview' },
        { label: 'Endpoints', icon: Shield, route: '/dashboard/endpoints' },
        { label: 'Incidents', icon: Zap, route: '/dashboard/incidents' },
        { label: 'Reports', icon: FileText, route: '/dashboard/reports' },
        { label: 'Threats', icon: ShieldAlert, route: '/dashboard/threats' },
        { label: 'Users', icon: Users, route: '/dashboard/users' },
        { label: 'Settings', icon: Settings, route: '/dashboard/settings' }
    ];

    isNotificationOpen = false;


    notifications: any[] = [];

    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
        if (this.isDropdownOpen) this.isNotificationOpen = false;
    }

    toggleNotifications() {
        this.isNotificationOpen = !this.isNotificationOpen;
        if (this.isNotificationOpen) this.isDropdownOpen = false;
    }


    toggleGroup(item: NavItem) {
        if (item.children) {
            item.expanded = !item.expanded;
        }
    }

    constructor(private router: Router, private authService: AuthService, private firestoreService: FirestoreService, private cdr: ChangeDetectorRef) {
        this.authService.user$.subscribe(user => {
            this.userEmail = user?.email || 'Guest';
            this.cdr.detectChanges();
            
            if (this.userEmail !== 'Guest') {
                this.listenToAssignedIncidents();
            }
        });

        this.profileSub = this.authService.userProfile$.subscribe(profile => {
            if (profile) {
                this.userProfile = profile;
                this.cdr.detectChanges();
            }
        });
    }

    private subscriptions = new Subscription();

    ngOnInit() { }

    private incidentsSub: Subscription | null = null;

    listenToAssignedIncidents() {
        if (this.incidentsSub) return;
        
        console.log('[DEBUG] listenToAssignedIncidents called for email:', this.userEmail);
        this.subscriptions.add(this.authService.tenantId$.subscribe(tid => console.log('[DEBUG] Current Tenant ID from AuthService:', tid)));
        
        this.incidentsSub = this.firestoreService.getIncidents().subscribe({
            next: (incidents) => {
                const dismissed = JSON.parse(localStorage.getItem('dismissedIncidentNotifications') || '[]');
                const userEmailLower = (this.userEmail || '').toLowerCase();
                
                console.log('[DEBUG] Firestore emitted incidents. Total count:', incidents.length);
                console.log('[DEBUG] Current userEmailLower for filter:', userEmailLower);
                
                const assignedIncidents = incidents.filter(i => {
                    const assignee = (i.assignee || '').toLowerCase();
                    const isMatch = assignee === userEmailLower;
                    const isNotDismissed = !dismissed.includes(i.id);
                    
                    if (isMatch) {
                        console.log(`[DEBUG] Found Incident Match: ${i.id} | Assignee: ${assignee} | Dismissed: ${!isNotDismissed}`);
                    }
                    
                    return isMatch && isNotDismissed;
                });
                
                console.log('[DEBUG] Final assigned notification count:', assignedIncidents.length);
                
                this.notifications = assignedIncidents.map(i => ({
                    id: i.id,
                    user: 'System',
                    avatar: 'SYS',
                    action: `You've been assigned to incident: ${i.title}`,
                    time: i.time || 'New',
                    read: false,
                    color: '#60a5fa' // blueish
                }));
                
                this.cdr.detectChanges();
            },
            error: (err) => console.error('[DEBUG] Error in getIncidents subscription:', err)
        });
        
        this.subscriptions.add(this.incidentsSub);
    }

    handleNotificationClick(note: any) {
        // Register as dismissed locally
        const dismissed = JSON.parse(localStorage.getItem('dismissedIncidentNotifications') || '[]');
        if (!dismissed.includes(note.id)) {
            dismissed.push(note.id);
            localStorage.setItem('dismissedIncidentNotifications', JSON.stringify(dismissed));
        }
        
        // Remove locally and update UI immediately
        this.notifications = this.notifications.filter(n => n.id !== note.id);
        this.isNotificationOpen = false;
        
        // Navigate
        this.router.navigate(['/dashboard/incidents']);
    }

    ngOnDestroy() {
        this.profileSub?.unsubscribe();
        this.subscriptions.unsubscribe();
    }

    getInitials(name: string): string {
        if (!name) return 'AD';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    async logout() {
        console.log('Logging out...');
        await this.authService.logout();
    }
}
