import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import Keycloak from 'keycloak-js';


interface FleetVehicle {
  name: string;
  brand: string;
  image: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  private readonly keycloak = inject(Keycloak);

  // ============================
  // AUTHENTICATION
  // ============================

  isAuthenticated = false;

  firstName = 'User';


  // ============================
  // VEHICLES
  // ============================

  readonly vehicles: FleetVehicle[] = [

  {
    name: 'Audi A4',
    brand: 'Audi',
    image: '/assets/images/vehicles/audi1.png'
   },
   {
    name: 'BMW 3 Series',
    brand: 'BMW',
    image: '/assets/images/vehicles/bmw1.png'
   },
   {
    name: 'Mercedes C-Class',
    brand: 'Mercedes',
    image: '/assets/images/vehicles/mercedes1.png'
   },
   {
    name: 'Volkswagen Golf',
    brand: 'Volkswagen',
    image: '/assets/images/vehicles/vw1.png'
   }

  ];


  // First vehicle is duplicated at the end
  // to create a seamless loop.

  readonly carouselVehicles: FleetVehicle[] = [
    ...this.vehicles,
    this.vehicles[0]
  ];


  // ============================
  // CAROUSEL SETTINGS
  // ============================

  readonly slideIndex = signal(0);

  readonly transitionEnabled = signal(true);

  private carouselTimer?: ReturnType<typeof setInterval>;

  private animationFrameId?: number;

  private resetFrameId?: number;


  // Current vehicle

  get activeVehicle(): FleetVehicle {

    return this.vehicles[
      this.slideIndex() % this.vehicles.length
    ];

  }


  // ============================
  // INITIALIZATION
  // ============================

  async ngOnInit(): Promise<void> {

    this.startCarousel();

    this.isAuthenticated =
      Boolean(this.keycloak.authenticated);

    if (!this.isAuthenticated) {
      return;
    }

    const token = this.keycloak.tokenParsed;

    const givenName = token?.['given_name'];
    const fullName = token?.['name'];
    const username = token?.['preferred_username'];

    if (
      typeof givenName === 'string' &&
      givenName.trim()
    ) {

      this.firstName =
        this.extractFirstName(givenName);

    } else if (
      typeof fullName === 'string' &&
      fullName.trim()
    ) {

      this.firstName =
        this.extractFirstName(fullName);

    } else if (
      typeof username === 'string' &&
      username.trim()
    ) {

      this.firstName =
        this.extractFirstName(username);

    }


    // Load Keycloak profile

    try {

      const profile =
        await this.keycloak.loadUserProfile();

      if (profile.firstName?.trim()) {

        this.firstName =
          this.extractFirstName(profile.firstName);

      }

    } catch (error) {

      console.warn(
        'User profile could not be loaded:',
        error
      );

    }

  }


  // ============================
  // CAROUSEL
  // ============================

  private startCarousel(): void {

    this.carouselTimer = setInterval(() => {

      this.nextSlide();

    }, 3000);

  }


  private nextSlide(): void {

    this.slideIndex.update(index => index + 1);

  }


  // Called when slide animation finishes

  onSlideTransitionEnd(event: TransitionEvent): void {

    if (event.propertyName !== 'transform') {
      return;
    }

    if (
      this.slideIndex() ===
      this.vehicles.length
    ) {

      // Disable animation temporarily

      this.transitionEnabled.set(false);

      // Jump to first vehicle

      this.slideIndex.set(0);

      // Enable animation again
      // after the browser has rendered the reset

      this.animationFrameId = requestAnimationFrame(() => {

        this.resetFrameId = requestAnimationFrame(() => {

          this.transitionEnabled.set(true);

        });

      });

    }

  }


  // ============================
  // USERNAME
  // ============================

  private extractFirstName(value: string): string {

    return (
      value.trim().split(/[\s_]+/)[0] ||
      'User'
    );

  }


  // ============================
  // KEYCLOAK
  // ============================

  login(): void {

    void this.keycloak.login();

  }


  register(): void {

    void this.keycloak.register();

  }


  logout(): void {

    void this.keycloak.logout();

  }


  // ============================
  // CLEANUP
  // ============================

  ngOnDestroy(): void {

    if (this.carouselTimer) {

      clearInterval(this.carouselTimer);

    }

    if (this.animationFrameId !== undefined) {

      cancelAnimationFrame(this.animationFrameId);

    }

    if (this.resetFrameId !== undefined) {

      cancelAnimationFrame(this.resetFrameId);

    }

  }

}