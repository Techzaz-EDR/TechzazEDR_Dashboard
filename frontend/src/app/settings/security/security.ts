import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-security',
  imports: [CommonModule, FormsModule],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class Security {

  saving = false;

  settings = {
    twofa:          true,
    ipwhitelist:    false,
    sessionTimeout: true,
    auditLog:       true,
    bruteForce:     false,
  };

  get activeCount(): number {
    return Object.values(this.settings).filter(Boolean).length;
  }

  saveSettings() {
    this.saving = true;
    setTimeout(() => {
      this.saving = false;
    }, 1600);
  }
}
