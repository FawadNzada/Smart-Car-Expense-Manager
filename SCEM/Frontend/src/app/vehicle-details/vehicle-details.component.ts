import {
  Component,
  inject
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  Vehicle,
  VehicleService
} from '../../services/vehicle.service';


@Component({
  selector: 'app-vehicle-details',
  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl:
    './vehicle-details.component.html',

  styleUrls: [
    './vehicle-details.component.css'
  ]
})
export class VehicleDetailsComponent {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly vehicleService =
    inject(VehicleService);


  showDeleteConfirmation = false;

  isDeleting = false;

  errorMessage = '';


  // =========================================
  // Kennzeichen aus der URL lesen
  // =========================================

  get licensePlate(): string {

    return (
      this.route.snapshot.paramMap.get(
        'licensePlate'
      ) ?? ''
    );
  }


  // =========================================
  // Fahrzeug suchen
  // =========================================

  get vehicle(): Vehicle | undefined {

    return this.vehicleService.findVehicle(
      this.licensePlate
    );
  }


  // =========================================
  // Löschbestätigung öffnen
  // =========================================

  showDelete(): void {

    this.errorMessage = '';

    this.showDeleteConfirmation = true;
  }


  // =========================================
  // Löschbestätigung abbrechen
  // =========================================

  cancelDelete(): void {

    if (this.isDeleting) {
      return;
    }

    this.showDeleteConfirmation = false;
  }


  // =========================================
  // DELETE - Fahrzeug dauerhaft löschen
  // =========================================

  async deleteVehicle(): Promise<void> {

    if (this.isDeleting) {
      return;
    }

    const vehicle = this.vehicle;

    if (!vehicle) {

      this.errorMessage =
        'Vehicle not found.';

      return;
    }

    this.errorMessage = '';

    this.isDeleting = true;

    try {

      // Fahrzeug aus SQLite löschen
      await this.vehicleService.deleteVehicle(
        vehicle
      );

      console.log(
        'Vehicle deleted successfully:',
        vehicle
      );

      // Bestätigungsfenster schließen
      this.showDeleteConfirmation = false;

      // Zur Fahrzeugübersicht wechseln
      await this.router.navigate([
        '/vehicles'
      ]);

    } catch (error) {

      console.error(
        'Error deleting vehicle:',
        error
      );

      this.errorMessage =
        'Could not delete vehicle. Please try again.';

      // Fehlermeldung anzeigen
      window.alert(this.errorMessage);

    } finally {

      this.isDeleting = false;

    }
  }
}