import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule, User, Camera, Upload, CheckCircle, AlertCircle } from 'lucide-angular';

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
    readonly CheckCircle = CheckCircle;
    readonly AlertCircle = AlertCircle;

    private profileSub?: Subscription;

    saving = false;
    saveSuccess = false;
    saveError = '';

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

    constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

    ngOnInit() {
        this.profileSub = this.authService.userProfile$.subscribe(profile => {
            if (profile) {
                this.user = {
                    fullName:       profile.name         || profile.email || 'User',
                    email:          profile.email        || '',
                    role:           profile.role         || 'Analyst',
                    phone:          profile.phone        || '',
                    bio:            profile.bio          || '',
                    companyName:    profile.organization_id || profile.tenantId || 'Unknown Organization',
                    companyEmail:   profile.companyEmail  || '',
                    companyAddress: profile.companyAddress || ''
                };
                // Force Angular to re-render regardless of which zone this fires in
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        this.profileSub?.unsubscribe();
    }

    saveProfile() {
        this.saving = true;
        this.saveSuccess = false;
        this.saveError = '';

        try {
            this.authService.updateProfile({
                name:           this.user.fullName,
                phone:          this.user.phone,
                bio:            this.user.bio,
                companyEmail:   this.user.companyEmail,
                companyAddress: this.user.companyAddress
            });
            this.saving = false;
            this.saveSuccess = true;
            setTimeout(() => { this.saveSuccess = false; }, 4000);
        } catch (err: any) {
            this.saving = false;
            this.saveError = err?.message || 'Failed to save profile. Please try again.';
        }
    }
}
