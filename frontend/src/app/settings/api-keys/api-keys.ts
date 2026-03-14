import { Component } from '@angular/core';

@Component({
  selector: 'app-api-keys',
  standalone: true,
  imports: [],
  templateUrl: './api-keys.html',
  styleUrl: './api-keys.scss',
})
export class ApiKeys {

  revokeKey(type: string) {
    if (confirm(`Revoke the ${type} key? This cannot be undone.`)) {
      alert(`${type} API key revoked.`);
    }
  }

  generateKey() {
    alert('New API key generated!');
  }
}
