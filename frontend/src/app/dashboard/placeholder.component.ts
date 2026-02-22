import { Component } from '@angular/core';

@Component({
    selector: 'app-placeholder',
    standalone: true,
    template: `
    <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
      <h2 style="color: var(--text-primary); margin-bottom: 1rem;">Coming Soon</h2>
      <p>This module is currently under development.</p>
    </div>
  `
})
export class PlaceholderComponent { }
