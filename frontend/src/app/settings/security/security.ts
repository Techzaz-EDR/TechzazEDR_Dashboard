import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-security',
  imports: [FormsModule],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class Security {

  settings = {
    twofa:          true,
    ipwhitelist:    false,
    sessionTimeout: true,
    auditLog:       true,
    bruteForce:     false,
  };

  saveSettings() {
    alert('Security settings updated!');
  }
}
