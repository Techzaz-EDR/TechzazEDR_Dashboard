import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule,
    Search, Shield, Edit2, Trash2, MoreVertical, Plus
} from 'lucide-angular';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './users.html',
    styleUrl: './users.scss',
})
export class Users {
    // Icons
    readonly SearchIcon = Search;
    readonly ShieldIcon = Shield;
    readonly EditIcon = Edit2;
    readonly TrashIcon = Trash2;
    readonly MoreVerticalIcon = MoreVertical;
    readonly PlusIcon = Plus;

    searchTerm = '';

    users = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@company.com',
            role: 'Administrator',
            status: 'active',
            lastLogin: '2 minutes ago',
            avatarColor: '#ef4444' // Red
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@company.com',
            role: 'Security Analyst',
            status: 'active',
            lastLogin: '1 hour ago',
            avatarColor: '#eab308' // Yellow
        },
        {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike@company.com',
            role: 'Incident Responder',
            status: 'active',
            lastLogin: '3 hours ago',
            avatarColor: '#3b82f6' // Blue
        },
        {
            id: 4,
            name: 'Sarah Williams',
            email: 'sarah@company.com',
            role: 'Viewer',
            status: 'inactive',
            lastLogin: '5 days ago',
            avatarColor: '#eab308' // Yellow
        }
    ];

    get filteredUsers() {
        return this.users.filter(user =>
            user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(this.searchTerm.toLowerCase())
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
}
