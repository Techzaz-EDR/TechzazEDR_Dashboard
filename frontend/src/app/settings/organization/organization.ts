import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

@Component({
    selector: 'app-organization',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './organization.html',
    styleUrl: './organization.scss'
})
export class Organization implements OnInit, OnDestroy {
    private db = getFirestore(getAuth().app);
    private tenantSub?: Subscription;

    saving = false;
    saveSuccess = false;
    saveError = '';
    loading = true;

    org = {
        name: '',
        email: '',
        phone: '',
        website: '',
        address: ''
    };

    constructor(
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        // When tenantId is available, fetch org data from Firestore
        this.tenantSub = this.authService.tenantId$.subscribe(tenantId => {
            if (tenantId) {
                this.loadOrganization(tenantId);
            }
        });
    }

    ngOnDestroy() {
        this.tenantSub?.unsubscribe();
    }

    private loadOrganization(tenantId: string) {
        this.loading = true;
        this.cdr.detectChanges();

        const orgRef = doc(this.db, 'organizations', tenantId);
        getDoc(orgRef)
            .then(snap => {
                if (snap.exists()) {
                    const data = snap.data();
                    this.org = {
                        name:    data['name']    || data['organizationName'] || tenantId,
                        email:   data['email']   || data['organizationEmail'] || '',
                        phone:   data['phone']   || data['phoneNumber'] || '',
                        website: data['website'] || '',
                        address: data['address'] || ''
                    };
                } else {
                    // Doc doesn't exist yet — pre-fill with tenantId as name
                    this.org.name = tenantId;
                }
                this.loading = false;
                this.cdr.detectChanges();
            })
            .catch(err => {
                console.error('Error loading organization:', err);
                this.loading = false;
                this.cdr.detectChanges();
            });
    }

    saveChanges(event: Event) {
        event.preventDefault();
        this.saveSuccess = false;
        this.saveError = '';

        const tenantId = this.authService.tenantId;
        if (!tenantId) {
            this.saveError = 'No organization context found. Please log in again.';
            return;
        }

        // Optimistic: show success immediately
        this.saving = true;
        this.cdr.detectChanges();

        const orgRef = doc(this.db, 'organizations', tenantId);
        setDoc(orgRef, {
            name:    this.org.name,
            email:   this.org.email,
            phone:   this.org.phone,
            website: this.org.website,
            address: this.org.address,
            updatedAt: serverTimestamp()
        }, { merge: true })
            .then(() => console.log('Organization saved to Firestore'))
            .catch(err => console.error('Organization save error:', err));

        // Immediately unstick the button and show success
        this.saving = false;
        this.saveSuccess = true;
        this.cdr.detectChanges();
        setTimeout(() => { this.saveSuccess = false; this.cdr.detectChanges(); }, 4000);
    }
}
