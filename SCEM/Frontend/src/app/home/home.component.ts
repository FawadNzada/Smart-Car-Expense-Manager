import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  private readonly keycloak = inject(Keycloak);

  isAuthenticated = false;

  firstName = 'User';

  async ngOnInit(): Promise<void> {

    this.isAuthenticated = Boolean(this.keycloak.authenticated);

    if (!this.isAuthenticated) {
      return;
    }

    // Benutzerinformationen aus Keycloak
    const token = this.keycloak.tokenParsed;

    const givenName = token?.['given_name'];
    const fullName = token?.['name'];
    const username = token?.['preferred_username'];

    if (typeof givenName === 'string' && givenName.trim()) {

      this.firstName = this.extractFirstName(givenName);

    } else if (typeof fullName === 'string' && fullName.trim()) {

      this.firstName = this.extractFirstName(fullName);

    } else if (typeof username === 'string' && username.trim()) {

      this.firstName = this.extractFirstName(username);

    }

    // Benutzerprofil laden
    try {

      const profile = await this.keycloak.loadUserProfile();

      if (profile.firstName?.trim()) {

        this.firstName = this.extractFirstName(profile.firstName);

      }

    } catch (error) {

      console.warn('User profile could not be loaded:', error);

    }

  }

  // Vornamen ermitteln
  private extractFirstName(value: string): string {

    return value.trim().split(/[\s_]+/)[0] || 'User';

  }

  // Login
  login(): void {
    void this.keycloak.login();
  }

  // Register
  register(): void {
    void this.keycloak.register();
  }

  // Logout
  logout(): void {
    void this.keycloak.logout();
  }

}