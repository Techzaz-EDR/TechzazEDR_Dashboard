import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule,
    Search, Shield, Edit2, Trash2, MoreVertical, Plus
} from 'lucide-angular';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { getAuth } from 'firebase/auth';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './users.html',
    styleUrl: './users.scss',
})
export class Users implements OnInit, OnDestroy {
    // Icons
    readonly SearchIcon = Search;
    readonly ShieldIcon = Shield;
    readonly EditIcon = Edit2;
    readonly TrashIcon = Trash2;
    readonly MoreVerticalIcon = MoreVertical;
    readonly PlusIcon = Plus;

    searchTerm = '';
    isLoading = true;

    private authService = inject(AuthService);
    private db = getFirestore(getAuth().app);
    private cdr = inject(ChangeDetectorRef);
    private profileSub?: Subscription;

    users: any[] = [];

    ngOnInit() {
        this.profileSub = this.authService.userProfile$.subscribe(async profile => {
            if (profile && profile.organization_id) {
                this.isLoading = true;
                this.cdr.detectChanges();
                try {
                    const usersRef = collection(this.db, 'users');
                    const q = query(usersRef, where('organization_id', '==', profile.organization_id));
                    const querySnapshot = await getDocs(q);
                    
                    this.users = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            name: data['name'] || data['email'] || 'Unknown User',
                            email: data['email'] || 'No Email',
                            role: data['role'] || 'Unknown',
                            status: data['status'] || 'active',
                            lastLogin: this.formatLastLogin(data['last_login_at']),
                            avatarColor: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color for now
                        };
                    });
                } catch (error) {
                    console.error('Error fetching organization users:', error);
                } finally {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            } else if (profile === null) {
                this.users = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        if (this.profileSub) {
            this.profileSub.unsubscribe();
        }
    }

    get filteredUsers() {
        const term = this.searchTerm.toLowerCase();
        return this.users.filter(user =>
            (user.name?.toLowerCase() || '').includes(term) ||
            (user.email?.toLowerCase() || '').includes(term) ||
            (user.role?.toLowerCase() || '').includes(term)
        );
    }

    // Modal Logic
    showAddUserModal = false;
    newUser = {
        name: '',
        email: '',
        role: 'Analyst',
        password: '',
        department: 'IT'
    };

    openModal() {
        this.showAddUserModal = true;
    }

    closeModal() {
        this.showAddUserModal = false;
        // Reset form
        this.newUser = {
            name: '',
            email: '',
            role: 'Analyst',
            password: '',
            department: 'IT'
        };
    }

    saveUser() {
        // Validation valid for demo?
        if (!this.newUser.name || !this.newUser.email) return;

        const newId = this.users.length + 1;
        this.users.unshift({
            id: newId,
            name: this.newUser.name,
            email: this.newUser.email,
            role: this.newUser.role === 'Admin' ? 'Administrator' :
                this.newUser.role === 'Analyst' ? 'Security Analyst' : 'Viewer',
            status: 'active',
            lastLogin: 'Just now',
            avatarColor: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color
        });

        this.closeModal();
    }

    private formatLastLogin(timestamp: any): string {
        if (!timestamp) return 'Never';
        try {
            // Check if it's a Firestore Timestamp with toDate method
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffSeconds = Math.floor(diffMs / 1000);
            
            if (diffSeconds < 60) return 'Just now';
            
            const diffMinutes = Math.floor(diffSeconds / 60);
            if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
            
            const diffHours = Math.floor(diffMinutes / 60);
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            
            return new Intl.DateTimeFormat('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }).format(date);
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Unknown';
        }
    }
}
