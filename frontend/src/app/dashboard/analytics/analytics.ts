import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule,
    Shield, Target, Zap, CheckCircle, TrendingUp, TrendingDown,
    AlertTriangle, Octagon, Search, Eye, Download,
    FileText, Settings, ChevronDown, Fingerprint
} from 'lucide-angular';

@Component({
    selector: 'app-analytics',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './analytics.html',
    styleUrl: './analytics.scss'
})
export class Analytics {
    // Icons
    readonly ShieldIcon = Shield;
    readonly TargetIcon = Target;
    readonly ZapIcon = Zap;
    readonly CheckCircleIcon = CheckCircle;
    readonly TrendingUpIcon = TrendingUp;
    readonly TrendingDownIcon = TrendingDown;
    readonly AlertTriangleIcon = AlertTriangle;
    readonly OctagonIcon = Octagon;
    readonly SearchIcon = Search;
    readonly EyeIcon = Eye;
    readonly DownloadIcon = Download;
    readonly FileTextIcon = FileText;
    readonly SettingsIcon = Settings;
    readonly ChevronDownIcon = ChevronDown;
    readonly FingerprintIcon = Fingerprint;

    // Stats
    totalThreats = 1240;
    threatsGrowth = 12;
    detectionRate = 99.2;
    detectionGrowth = 0.5;
    avgResponseTime = 14;
    responseImprovement = 8;
    incidentsResolved = 245;
    resolvedGrowth = 15;

    // Report Generation
    reportType = 'Executive Summary';
    reportFormat = 'PDF';

    toggleReportType() {
        this.reportType = this.reportType === 'Executive Summary' ? 'Technical Detail' : 'Executive Summary';
    }

    generateReport() {
        console.log('Generating report:', this.reportType, this.reportFormat);
    }

    // Chart Data Helpers (Simplified for CSS Charts)

    // Threat Trend (Line Chart Points - SVG Polyline)
    // Mapping numbers 0-40 to SVG coordinate space 0-100 height
    get trendPoints() {
        // Mock data points
        const data = [28, 26, 32, 30, 36, 39, 29];
        // Convert to SVG points string "x,y x,y..."
        // Width 100% -> viewbox 0 0 600 200
        // x step = 100
        return data.map((val, i) => `${i * 100},${200 - (val * 4)} `).join(' ');
    }

    // Critical Trend
    get criticalPoints() {
        const data = [5, 4, 8, 6, 9, 8, 5];
        return data.map((val, i) => `${i * 100},${200 - (val * 4)} `).join(' ');
    }

    // Incident Status (Donut)
    // Segments: Contained (Orange), Investigating (Red), Resolved (Green)
    donutSegments = [
        { color: '#d97706', percent: 20, label: 'Contained' },
        { color: '#dc2626', percent: 15, label: 'Investigating' },
        { color: '#16a34a', percent: 65, label: 'Resolved' }
    ];

    // Detection Methods (Top Threat Types - Horizontal Bar)
    topThreats = [
        { label: 'Ransomware', count: 45, width: '90%', color: '#ef4444' },
        { label: 'Trojan', count: 35, width: '70%', color: '#ef4444' },
        { label: 'Spyware', count: 30, width: '60%', color: '#ef4444' },
        { label: 'Worm', count: 25, width: '50%', color: '#ef4444' },
        { label: 'Rootkit', count: 12, width: '25%', color: '#ef4444' }
    ];

    // Detection Methods Vertical
    detectionMethods = [
        { label: 'Signature', count: 160, width: '100%', color: '#3b82f6' },
        { label: 'Behavioral', count: 90, width: '56%', color: '#3b82f6' },
        { label: 'Heuristic', count: 70, width: '44%', color: '#3b82f6' },
        { label: 'ML-Based', count: 45, width: '28%', color: '#3b82f6' }
    ];
    // Detailed Threat Logs
    detailedThreatLogs = [
        {
            time: '2 minutes ago',
            device: 'DESKTOP-001',
            category: 'Malware',
            title: 'Suspicious Process Execution',
            description: 'Detected execution of unsigned binary from temp directory',
            status: 'ACTIVE',
            severity: 'CRITICAL'
        },
        {
            time: '15 minutes ago',
            device: 'LAPTOP-042',
            category: 'Network',
            title: 'Unauthorized Network Connection',
            description: 'Outbound connection to known C2 server detected',
            status: 'INVESTIGATING',
            severity: 'HIGH'
        },
        {
            time: '1 hour ago',
            device: 'SERVER-005',
            category: 'Malware',
            title: 'Malware Signature Detected',
            description: 'File matched known malware signature in threat database',
            status: 'QUARANTINED',
            severity: 'HIGH'
        },
        {
            time: '3 hours ago',
            device: 'WORKSTATION-023',
            category: 'Privilege Esc',
            title: 'Privilege Escalation Attempt',
            description: 'Detected attempt to escalate privileges using UAC bypass',
            status: 'BLOCKED',
            severity: 'HIGH'
        },
        {
            time: '5 hours ago',
            device: 'DESKTOP-002',
            category: 'Network',
            title: 'DNS Tunneling Detected',
            description: 'Suspicious DNS queries detected indicating data exfiltration',
            status: 'INVESTIGATING',
            severity: 'MEDIUM'
        },
        {
            time: '2 days ago',
            device: 'FILE-SRV-01',
            category: 'Policy',
            title: 'Legacy Protocol Usage',
            description: 'SMBv1 traffic detected on internal segment',
            status: 'RESOLVED',
            severity: 'MEDIUM'
        },
        {
            time: '2 weeks ago',
            device: 'DC-01',
            category: 'Account',
            title: 'Suspicious Admin Login',
            description: 'Login from unusual IP address detected',
            status: 'INVESTIGATING',
            severity: 'HIGH'
        }
    ];
}
