import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import {
    LucideAngularModule,
    Shield, Activity, Zap, BarChart2, FileText, ShieldAlert, Wrench, Users, Clipboard, Settings,
    Search, Clock, Bell, MessageSquare, Home, LogOut, ChevronDown, CheckCircle, AlertTriangle, Check,
    Phone, Send
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
    imports: [CommonModule, RouterLink, RouterOutlet, FormsModule, LucideAngularModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    isDropdownOpen = false;
    userEmail: string | null = null;

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
    readonly Phone = Phone;
    readonly Send = Send;

    navItems: NavItem[] = [
        { label: 'Security Overview', icon: Activity, route: '/dashboard/overview' },
        { label: 'Endpoints', icon: Shield, route: '/dashboard/endpoints' },
        { label: 'Incidents', icon: Zap, route: '/dashboard/incidents' },
        {
            label: 'Analytics & Reports',
            icon: BarChart2,
            expanded: false,
            children: [
                { label: 'Analytics', icon: BarChart2, route: '/dashboard/analytics' },
                { label: 'Reports', icon: FileText, route: '/dashboard/reports' }
            ]
        },
        { label: 'Threats', icon: ShieldAlert, route: '/dashboard/threats' },
        { label: 'Users', icon: Users, route: '/dashboard/users' },
        { label: 'Settings', icon: Settings, route: '/dashboard/settings' }
    ];

    isNotificationOpen = false;
    showMessagesModal = false;

    // Mock Messages Data
    currentConversationId = 2; // Default to Florencio
    newMessageText = '';

    conversations = [
        { id: 1, user: 'Elmer Laverty', avatar: 'EL', message: 'Haha oh man', time: '12m', unread: true },
        { id: 2, user: 'Florencio Dorrance', avatar: 'FD', message: 'woohoooo', time: '24m', unread: false },
        { id: 3, user: 'Lavern Laboy', avatar: 'LL', message: 'Haha that\'s terrifying', time: '1h', unread: false },
        { id: 4, user: 'Titus Kitamura', avatar: 'TK', message: 'omg, this is amazing', time: '5h', unread: false }
    ];

    allMessages: any = {
        1: [
            { id: 1, sender: 'them', text: 'Haha oh man', time: '12m ago' },
            { id: 2, sender: 'me', text: 'I know right? crazy stuff.', time: '10m ago' }
        ],
        2: [
            { id: 1, sender: 'them', text: 'omg, this is amazing', time: '2:00 PM' },
            { id: 2, sender: 'me', text: 'perfect!', time: '2:01 PM' },
            { id: 3, sender: 'me', text: 'Wow, this is really epic', time: '2:02 PM' },
            { id: 4, sender: 'them', text: 'just ideas for next time', time: '2:05 PM' },
            { id: 5, sender: 'them', text: 'I\'ll be there in 2 mins', time: '2:06 PM' }
        ],
        3: [
            { id: 1, sender: 'them', text: 'Haha that\'s terrifying', time: '1h ago' }
        ],
        4: [
            { id: 1, sender: 'them', text: 'omg, this is amazing', time: '5h ago' }
        ]
    };

    get activeChat() {
        return this.allMessages[this.currentConversationId] || [];
    }

    get activeUser() {
        return this.conversations.find(c => c.id === this.currentConversationId);
    }

    selectConversation(id: number) {
        this.currentConversationId = id;
        // Mark as read logic could go here
        const conv = this.conversations.find(c => c.id === id);
        if (conv) conv.unread = false;
    }

    sendMessage() {
        if (!this.newMessageText.trim()) return;

        if (!this.allMessages[this.currentConversationId]) {
            this.allMessages[this.currentConversationId] = [];
        }

        this.allMessages[this.currentConversationId].push({
            id: Date.now(),
            sender: 'me',
            text: this.newMessageText,
            time: 'Just now'
        });

        this.newMessageText = '';

        // Optional: auto-scroll to bottom logic would go here
    }

    notifications = [
        {
            user: 'Kate Youn',
            avatar: 'KY',
            action: 'Contrary to popular belief, Lorem Ipsum is not simply random text.',
            time: '5 mins ago',
            read: false,
            color: '#f472b6' // pinkish
        },
        {
            user: 'Brandon Newman',
            avatar: 'BN',
            action: 'Lorem Ipsum.',
            time: '12 mins ago',
            read: false,
            color: '#60a5fa' // blueish
        },
        {
            user: 'Dave Wood',
            avatar: 'DW',
            action: 'Lorem Ipsum.',
            time: '1 hr ago',
            read: true,
            color: '#fbbf24' // yellowish
        }
    ];

    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
        if (this.isDropdownOpen) this.isNotificationOpen = false;
    }

    toggleNotifications() {
        this.isNotificationOpen = !this.isNotificationOpen;
        if (this.isNotificationOpen) this.isDropdownOpen = false;
    }

    openMessages(notification?: any) {
        this.showMessagesModal = true;
        this.isNotificationOpen = false; // Close dropdown
        // In real app, load chat based on notification
    }

    closeMessages() {
        this.showMessagesModal = false;
    }

    toggleGroup(item: NavItem) {
        if (item.children) {
            item.expanded = !item.expanded;
        }
    }

    constructor(private router: Router, private authService: AuthService, private cdr: ChangeDetectorRef) {
        this.authService.user$.subscribe(user => {
            this.userEmail = user?.email || 'Guest';
            this.cdr.detectChanges();
        });
    }

    ngOnInit() { }

    logout() {
        console.log('Logging out...');
        this.authService.logout();
    }
}
