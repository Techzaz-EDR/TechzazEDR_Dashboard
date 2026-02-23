import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App implements OnInit {
  private apiService = inject(ApiService);
  protected readonly title = signal('Techzaz EDR');
  protected readonly backendStatus = signal('Checking...');

  ngOnInit() {
    this.apiService.getHealth().subscribe({
      next: (res) => {
        console.log('Backend connection successful:', res);
        this.backendStatus.set('Connected');
      },
      error: (err) => {
        console.error('Backend connection failed:', err);
        this.backendStatus.set('Failed to connect');
      }
    });
  }
}
