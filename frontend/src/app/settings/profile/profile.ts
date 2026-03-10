import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule, User, Camera, Upload } from 'lucide-angular';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './profile.html',
    styleUrls: ['./profile.scss']
})
export class Profile implements OnInit, OnDestroy {
    readonly User = User;
    readonly Camera = Camera;
    readonly Upload = Upload;

    private profileSub?: Subscription;

    user = {
        fullName: 'Loading...',
        email: '...',
        role: '...',
        phone: '',
        bio: '',
        companyName: '...',
        companyEmail: '',
        companyAddress: ''
    };

    constructor(private authService: AuthService) {}

    ngOnInit() {
        this.profileSub = this.authService.userProfile$.subscribe(profile => {
            if (profile) {
                this.user = {
                    ...this.user,
                    fullName: profile.name || profile.email || 'User',
                    email: profile.email || '',
                    role: profile.role || 'Analyst',
                    companyName: profile.organization_id || 'Unknown Organization',
                };
            }
        });
    }

    ngOnDestroy() {
        if (this.profileSub) {
            this.profileSub.unsubscribe();
        }
    }

    saveProfile() {
        console.log('Profile saved', this.user);
    }
}
