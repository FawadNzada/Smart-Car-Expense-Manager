import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  private readonly keycloak = inject(Keycloak);

  login(): void {
    this.keycloak.login();
  }

  register(): void {
    this.keycloak.register();
  }
}