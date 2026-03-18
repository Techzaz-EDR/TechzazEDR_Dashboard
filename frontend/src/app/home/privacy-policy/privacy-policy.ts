import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Info, Lock, Eye, FileText, CheckCircle, ArrowLeft, Clock, Mail, ChevronDown } from 'lucide-angular';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';

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
  readonly Clock = Clock;
  readonly Mail = Mail;
  readonly ChevronDown = ChevronDown;

  lastUpdated = 'October 24, 2026';
  activeSectionId = 'introduction';
  isMobileNavOpen = false;

  sections = [
    { id: 'introduction', label: 'Introduction', icon: Info },
    { id: 'data-collection', label: 'Data Collection', icon: FileText },
    { id: 'data-usage', label: 'How We Use Data', icon: Eye },
    { id: 'security', label: 'Data Security', icon: Lock },
    { id: 'data-retention', label: 'Data Retention', icon: Clock },
    { id: 'your-rights', label: 'Your Rights', icon: CheckCircle },
    { id: 'contact-us', label: 'Contact Us', icon: Mail }
  ];

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.setupIntersectionObserver();
  }

  toggleMobileNav(): void {
    this.isMobileNavOpen = !this.isMobileNavOpen;
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.activeSectionId = entry.target.id;
        }
      });
    }, options);

    this.sections.forEach(section => {
      const element = this.document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });
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
