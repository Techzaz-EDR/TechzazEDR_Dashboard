import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, User, Camera, Upload } from 'lucide-angular';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
    templateUrl: './profile.html',
    styleUrls: ['./profile.scss']
})
export class Profile {
    readonly User = User;
    readonly Camera = Camera;
    readonly Upload = Upload;

    user = {
        fullName: 'Admin User',
        email: 'admin@company.com',
        role: 'Administrator',
        phone: '+1 (555) 123-4567',
        bio: 'Security administrator with 5+ years of experience in cybersecurity operations.',
        companyName: 'Acme Corporation',
        companyEmail: 'contact@acme.com',
        companyAddress: '123 Security Street, Cyber City, CC 12345'
    };

    saveProfile() {
        console.log('Profile saved', this.user);
    }
}
