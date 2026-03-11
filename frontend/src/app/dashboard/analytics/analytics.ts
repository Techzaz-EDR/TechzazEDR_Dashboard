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
        // Convert to SVG points string "x,y x,y..."
        // Width 100% -> viewbox 0 0 600 200
        // x step = 100
        return this.mediumData.map((val, i) => `${i * 100},${200 - (val * 4)} `).join(' ');
    }

    // Critical Trend
    get criticalPoints() {
        return this.criticalData.map((val, i) => `${i * 100},${200 - (val * 4)} `).join(' ');
    }

    // Incident Status (Donut)
    // Segments: Contained (Orange), Investigating (Red), Resolved (Green)
    donutSegments = [
        { color: '#eab308', percent: 20, label: 'Contained' },
        { color: '#ef4444', percent: 15, label: 'Investigating' },
        { color: '#3b82f6', percent: 65, label: 'Resolved' }
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
        { label: 'Signature', count: 160, height: '80%', color: '#3b82f6' },
        { label: 'Behavioral', count: 90, height: '45%', color: '#3b82f6' },
        { label: 'Heuristic', count: 70, height: '35%', color: '#3b82f6' },
        { label: 'ML-Based', count: 45, height: '22%', color: '#3b82f6' }
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

    // Chart Interaction State
    hoveringChart = false;
    hoverX = 0;
    hoverYMedium = 0;
    hoverYCritical = 0;
    tooltipX = 0;
    tooltipY = 0;
    hoverDay = '';
    hoverValMedium = 0;
    hoverValCritical = 0;

    private readonly days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    private readonly mediumData = [28, 26, 32, 30, 36, 39, 29];
    private readonly criticalData = [5, 4, 8, 6, 9, 8, 5];

    onChartMouseMove(event: MouseEvent) {
        const svg = (event.currentTarget as HTMLElement).querySelector('.main-chart-svg') as SVGSVGElement;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert pixel X to SVG viewbox X (0-600)
        const svgX = (x / rect.width) * 600;

        this.hoveringChart = true;
        this.hoverX = svgX;

        // Find nearest data index (x-axis steps are 100)
        const index = Math.max(0, Math.min(6, Math.round(svgX / 100)));

        this.hoverDay = this.days[index];
        this.hoverValMedium = this.mediumData[index];
        this.hoverValCritical = this.criticalData[index];

        // Highlight dots follow the exact points
        this.hoverYMedium = 200 - (this.hoverValMedium * 4);
        this.hoverYCritical = 200 - (this.hoverValCritical * 4);

        // Tooltip position
        this.tooltipX = x + 20;
        this.tooltipY = y - 40;

        // Keep tooltip inside chart bounds
        if (this.tooltipX > rect.width - 150) this.tooltipX = x - 170;
    }

    onChartMouseLeave() {
        this.hoveringChart = false;
    }
}
