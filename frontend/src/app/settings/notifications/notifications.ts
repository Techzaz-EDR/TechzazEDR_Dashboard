import { Component } from '@angular/core';

@Component({
  selector: 'app-notifications',
  imports: [],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {
  savePreferences() {
    alert('Notification preferences saved!');
  }
}
