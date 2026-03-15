import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Info, Lock, Eye, FileText, CheckCircle, ArrowLeft, Scale, Award, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './terms-conditions.html',
  styleUrl: './terms-conditions.scss'
})
export class TermsConditionsComponent implements OnInit {
  readonly Shield = Shield;
  readonly Info = Info;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly ArrowLeft = ArrowLeft;
  readonly Scale = Scale;
  readonly Award = Award;
  readonly AlertCircle = AlertCircle;

  lastUpdated = 'October 24, 2026';

  sections = [
    { id: 'agreement', label: 'User Agreement', icon: Scale },
    { id: 'usage', label: 'Acceptable Use', icon: CheckCircle },
    { id: 'proprietary', label: 'Proprietary Rights', icon: Award },
    { id: 'liability', label: 'Limitation of Liability', icon: AlertCircle },
    { id: 'termination', label: 'Termination', icon: Lock }
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
