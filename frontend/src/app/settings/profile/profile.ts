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

    uploading = false;
    uploadError = '';

    user = {
        fullName: 'Loading...',
        email: '...',
        role: '...',
        phone: '',
        bio: '',
        companyName: '...',
        companyEmail: '',
        companyAddress: '',
        photoUrl: ''
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
                    companyAddress: profile.companyAddress || '',
                    photoUrl:       profile.photoUrl      || ''
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

    private resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event: any) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        resolve(dataUrl);
                    } else {
                        reject(new Error('Canvas context could not be created'));
                    }
                };
                img.onerror = (error) => reject(error);
                img.src = event.target.result;
            };
            reader.onerror = (error) => reject(error);
        });
    }

    async onFileSelected(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.uploadError = 'Please select an image file (JPG, PNG or GIF).';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.uploadError = 'Image size should be less than 5MB.';
            return;
        }

        this.uploading = true;
        this.uploadError = '';
        this.cdr.detectChanges();
        
        try {
            // Compress and resize the image before uploading directly to Firestore as Base64 to bypass failing Storage bucket
            const dataUrl = await this.resizeImage(file, 400, 400);
            await this.authService.updateProfilePictureData(dataUrl);
            
            this.user.photoUrl = dataUrl;
            this.saveSuccess = true;
            setTimeout(() => { this.saveSuccess = false; this.cdr.detectChanges(); }, 4000);
        } catch (err: any) {
            console.error('Error saving picture:', err);
            this.uploadError = err?.message || 'Failed to process picture. Please try again.';
        } finally {
            this.uploading = false;
            // Clear input so same file can be selected again
            event.target.value = '';
            this.cdr.detectChanges();
        }
    }
}
