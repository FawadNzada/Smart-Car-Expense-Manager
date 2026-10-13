import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  private readonly keycloak = inject(Keycloak);

  name = 'Sebastian Junior';
  email = 'sebastian@email.com';
  phone = '+43 660 1234567';
  role = 'Group Member';
  memberSince = '12 Jan 2026';

  editMode = false;
  errorMessage = '';
  notificationsEnabled = true;
  darkModeEnabled = true;

  async ngOnInit(): Promise<void> {
    try {
      if (this.keycloak?.authenticated) {
        const profile = await this.keycloak.loadUserProfile();
        const loadedName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        if (loadedName) this.name = loadedName;
        if (profile.email) this.email = profile.email;
      }
    } catch {
      // Keep the demo profile values if Keycloak profile data is unavailable.
    }
  }

  initials(): string {
    const parts = this.name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  startEditing(): void {
    this.errorMessage = '';
    this.editMode = true;
  }

  cancelEditing(): void {
    this.errorMessage = '';
    this.editMode = false;
  }

  saveProfile(): void {
    if (!this.name.trim()) {
      this.errorMessage = 'Name cannot be empty.';
      return;
    }

    this.name = this.name.trim();
    this.phone = this.phone.trim();
    this.errorMessage = '';
    this.editMode = false;
  }

  toggleNotifications(): void {
    this.notificationsEnabled = !this.notificationsEnabled;
  }

  toggleDarkMode(): void {
    this.darkModeEnabled = !this.darkModeEnabled;
  }
}
