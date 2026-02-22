import { Component } from '@angular/core';

@Component({
  selector: 'app-api-keys',
  standalone: true,
  imports: [],
  templateUrl: './api-keys.html',
  styleUrl: './api-keys.scss',
})
export class ApiKeys {
  revokeKey() {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      alert('API Key revoked.');
    }
  }

  generateKey() {
    alert('New API Key generated!');
  }
}
