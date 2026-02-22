import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    LucideAngularModule,
    BarChart2, Shield, Clipboard, Search, TrendingDown,
    Eye, Download, Trash2
} from 'lucide-angular';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './reports.html',
    styleUrl: './reports.scss',
})
export class Reports {
    // Icons
    readonly BarChart2 = BarChart2;
    readonly Shield = Shield;
    readonly Clipboard = Clipboard;
    readonly Search = Search;
    readonly TrendingDown = TrendingDown;
    readonly Eye = Eye;
    readonly Download = Download;
    readonly Trash2 = Trash2;

    reports = [
        {
            id: 1,
            title: 'Executive Summary - October 2024',
            type: 'Executive Summary',
            format: 'PDF',
            size: '2.4 MB',
            date: '2024-10-20',
            status: 'ready',
            icon: BarChart2
        },
        {
            id: 2,
            title: 'Threat Intelligence Report',
            type: 'Threat Intelligence',
            format: 'PDF',
            size: '5.1 MB',
            date: '2024-10-19',
            status: 'ready',
            icon: Shield
        },
        {
            id: 3,
            title: 'Compliance Report - ISO 27001',
            type: 'Compliance Report',
            format: 'PDF',
            size: '3.8 MB',
            date: '2024-10-18',
            status: 'ready',
            icon: Clipboard
        },
        {
            id: 4,
            title: 'Incident Analysis - Q3 2024',
            type: 'Detailed Analysis',
            format: 'PDF',
            size: '4.2 MB',
            date: '2024-10-15',
            status: 'ready',
            icon: Search
        },
        {
            id: 5,
            title: 'Network Traffic Analysis',
            type: 'Technical Report',
            format: 'CSV',
            size: '12.5 MB',
            date: '2024-10-10',
            status: 'ready',
            icon: TrendingDown
        }
    ];
}
