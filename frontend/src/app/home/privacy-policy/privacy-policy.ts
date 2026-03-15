import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Info, Lock, Eye, FileText, CheckCircle, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss'
})
export class PrivacyPolicyComponent implements OnInit {
  readonly Shield = Shield;
  readonly Info = Info;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly ArrowLeft = ArrowLeft;

  lastUpdated = 'October 24, 2026';

  sections = [
    { id: 'introduction', label: 'Introduction', icon: Info },
    { id: 'data-collection', label: 'Data Collection', icon: FileText },
    { id: 'data-usage', label: 'How We Use Data', icon: Eye },
    { id: 'security', label: 'Data Security', icon: Lock },
    { id: 'your-rights', label: 'Your Rights', icon: CheckCircle }
  ];

  constructor() {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
