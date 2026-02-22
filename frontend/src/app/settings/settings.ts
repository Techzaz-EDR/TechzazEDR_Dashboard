import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule, Building, Lock, Bell, Key, User } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  readonly Building = Building;
  readonly Lock = Lock;
  readonly Bell = Bell;
  readonly Key = Key;
  readonly User = User;
}
