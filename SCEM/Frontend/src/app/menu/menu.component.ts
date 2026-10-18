import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';

import {
  KEYCLOAK_EVENT_SIGNAL,
  KeycloakEventType,
  typeEventArgs,
  ReadyArgs
} from 'keycloak-angular';

@Component({
  selector: 'app-menu',
  imports: [RouterModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {

  authenticated = false;

  keycloakStatus: string | undefined;

  readonly keycloak = inject(Keycloak);

  readonly keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);

  constructor() {

    effect(() => {

      const keycloakEvent = this.keycloakSignal();

      this.keycloakStatus = keycloakEvent.type;

      if (keycloakEvent.type === KeycloakEventType.Ready) {
        this.authenticated =
          typeEventArgs<ReadyArgs>(keycloakEvent.args);
      }

      if (keycloakEvent.type === KeycloakEventType.AuthLogout) {
        this.authenticated = false;
      }

    });

  }

  // Authentication

  get isAuthenticated(): boolean {
    return this.authenticated || Boolean(this.keycloak.authenticated);
  }

  // Username

  get userName(): string {

    const token = this.keycloak.tokenParsed;

    const name = token?.['name'];
    const username = token?.['preferred_username'];

    if (typeof name === 'string' && name.trim()) {
      return name;
    }

    if (typeof username === 'string' && username.trim()) {
      return username;
    }

    return 'User';
  }

  // Login

  login(): void {
    this.keycloak.login();
  }

  // Register

  register(): void {
    this.keycloak.register();
  }

  // Logout

  logout(): void {
    this.keycloak.logout();
  }

}