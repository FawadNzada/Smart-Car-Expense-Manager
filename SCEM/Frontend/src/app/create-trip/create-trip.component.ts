import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { VehicleService } from '../../services/vehicle.service';
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-create-trip',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './create-trip.component.html',
  styleUrls: ['./create-trip.component.css']
})
export class CreateTripComponent {

  private readonly vehicleService = inject(VehicleService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);

  // =========================================
  // FORMULAR
  // =========================================

  selectedLicensePlate = '';

  startLocation = '';
  destination = '';

  tripDate = this.localDate(new Date());

  startTime = '09:00';
  endTime = '10:00';

  startMileage = 0;

  notes = '';

  errorMessage = '';

  isSaving = false;

  // =========================================
  // FAHRZEUGE
  // =========================================

  get vehicles() {
    return this.vehicleService.vehicles;
  }

  get selectedVehicle() {
    return this.vehicleService.findVehicle(
      this.selectedLicensePlate
    );
  }

  // =========================================
  // LOKALES DATUM
  // =========================================

  private localDate(date: Date): string {

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // =========================================
  // FAHRT ERSTELLEN
  // =========================================

  async saveTrip(): Promise<void> {

    if (this.isSaving) {
      return;
    }

    this.errorMessage = '';

    const vehicle = this.selectedVehicle;

    // =====================================
    // EINGABEN PRÜFEN
    // =====================================

    if (!vehicle) {
      this.errorMessage = 'Please select a vehicle.';
      return;
    }

    if (!this.startLocation.trim()) {
      this.errorMessage = 'Please enter a start location.';
      return;
    }

    if (!this.destination.trim()) {
      this.errorMessage = 'Please enter a destination.';
      return;
    }

    if (
      this.startLocation.trim().length > 256 ||
      this.destination.trim().length > 256
    ) {
      this.errorMessage =
        'Locations cannot exceed 256 characters.';
      return;
    }

    if (!this.tripDate) {
      this.errorMessage = 'Please select a date.';
      return;
    }

    if (this.tripDate < this.localDate(new Date())) {
      this.errorMessage = 'Trip date cannot be in the past.';
      return;
    }

    if (!this.startTime || !this.endTime) {
      this.errorMessage =
        'Please select start and end time.';
      return;
    }

    if (this.endTime <= this.startTime) {
      this.errorMessage =
        'End time must be after start time.';
      return;
    }

    if (
      !Number.isInteger(this.startMileage) ||
      this.startMileage < 0
    ) {
      this.errorMessage =
        'Please enter a valid start mileage.';
      return;
    }

    if (this.notes.trim().length > 1024) {
      this.errorMessage =
        'Notes cannot exceed 1024 characters.';
      return;
    }

    // =====================================
    // SPEICHERN STARTEN
    // =====================================

    this.isSaving = true;

    try {

      // =====================================
      // POST /Trip
      // =====================================

      const created =
        await this.tripService.createTripInBackend({

          vehicleName: vehicle.name,

          licensePlate: vehicle.licensePlate,

          vehicleImage: vehicle.image,

          // Fahrer wird im Backend durch
          // den Keycloak-Benutzer bestimmt.
          driver: '',

          startLocation: this.startLocation.trim(),

          destination: this.destination.trim(),

          date: this.tripDate,

          startTime: this.startTime,

          endTime: this.endTime,

          startMileage: this.startMileage,

          // Vorläufiger Kilometerstand
          // bis die Fahrt abgeschlossen wird.
          endMileage: this.startMileage,

          status: 'Planned',

          notes: this.notes.trim()

        });

      console.log(
        'Trip successfully created in SQLite:',
        created
      );

      // =====================================
      // ZUR TRIPS-SEITE
      // =====================================

      await this.router.navigate(['/trips']);

    } catch (error) {

      console.error(
        'Error creating trip:',
        error
      );

      if (error instanceof HttpErrorResponse) {

        switch (error.status) {

          case 400:
            this.errorMessage =
              'Invalid trip data. Please check your entries.';
            break;

          case 401:
            this.errorMessage =
              'Your session has expired. Please log in again.';
            break;

          case 403:
            this.errorMessage =
              'You do not have permission to create this trip.';
            break;

          case 404:
            this.errorMessage =
              'The selected vehicle was not found.';
            break;

          case 409:
            this.errorMessage =
              'This trip conflicts with existing data.';
            break;

          case 0:
            this.errorMessage =
              'Cannot connect to the backend. Please check if it is running.';
            break;

          default:
            this.errorMessage =
              'Could not create trip. Please try again.';
        }

      } else {

        this.errorMessage =
          'An unexpected error occurred.';
      }

    } finally {

      this.isSaving = false;
    }
  }
}