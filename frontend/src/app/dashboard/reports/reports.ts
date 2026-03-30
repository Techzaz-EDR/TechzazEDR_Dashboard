import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
    LucideAngularModule,
    BarChart2, Shield, Clipboard, Search, TrendingDown,
    Download
} from 'lucide-angular';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './reports.html',
    styleUrl: './reports.scss',
})
export class Reports {
    private http = inject(HttpClient);

    // Icons
    readonly BarChart2 = BarChart2;
    readonly Download = Download;

    reports = [
        {
            id: 1,
            title: 'Security Posture Report',
            type: 'Executive Summary',
            format: 'PDF',
            size: 'In-Memory',
            date: new Date().toISOString().split('T')[0],
            status: 'ready',
            icon: BarChart2
        }
    ];

    downloadReport() {
        const url = `${environment.apiUrl}/reports/security-posture?t=${new Date().getTime()}`;
        console.log('Initiating download from:', url);
        this.http.get(url, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `Security_Posture_Report_${new Date().getTime()}.pdf`;
                link.click();
                window.URL.revokeObjectURL(downloadUrl);
            },
            error: (err) => {
                console.error('Download failed:', err);
            }
        });
    }
}
