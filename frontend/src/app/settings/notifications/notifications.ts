import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notifications',
  imports: [FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {

  prefs = {
    criticalThreats: true,
    incidentUpdates: true,
    dailySummary:    false,
    systemAlerts:    true,
    emailDigest:     false,
  };

  savePreferences() {
    alert('Notification preferences saved!');
  }
}
