import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { VehicleService } from '../../services/vehicle.service';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './create-reservation.component.html',
  styleUrls: ['./create-reservation.component.css']
})
export class CreateReservationComponent {

  private readonly vehicleService =
    inject(VehicleService);

  private readonly reservationService =
    inject(ReservationService);

  private readonly router =
    inject(Router);

  // =========================================
  // FORMULAR
  // =========================================

  selectedLicensePlate = '';

  today = this.localDate(new Date());

  reservationDate = this.today;

  startTime = '09:00';

  endTime = '10:00';

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
  // RESERVIERUNG SPEICHERN
  // =========================================

  async saveReservation(): Promise<void> {

    if (this.isSaving) {
      return;
    }

    this.errorMessage = '';

    const vehicle = this.selectedVehicle;

    // =========================================
    // EINGABEN PRÜFEN
    // =========================================

    if (!vehicle) {

      this.errorMessage =
        'Please select a vehicle.';

      return;
    }

    if (!this.reservationDate) {

      this.errorMessage =
        'Please select a reservation date.';

      return;
    }

    if (
      this.reservationDate <
      this.localDate(new Date())
    ) {

      this.errorMessage =
        'Reservation date cannot be in the past.';

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

    if (this.notes.length > 1024) {

      this.errorMessage =
        'Notes cannot exceed 1024 characters.';

      return;
    }

    // =========================================
    // SPEICHERVORGANG STARTEN
    // =========================================

    this.isSaving = true;

    try {

      // =====================================
      // RESERVIERUNG IN SQLITE ERSTELLEN
      // =====================================

      const created =
        await this.reservationService
          .createReservationInBackend({

            licensePlate: vehicle.licensePlate,

            date: this.reservationDate,

            startTime: this.startTime,

            endTime: this.endTime,

            notes: this.notes.trim()

          });

      console.log(
        'Reservation successfully created:',
        created
      );

      // =====================================
      // ZUR RESERVIERUNGSÜBERSICHT
      // =====================================

      await this.router.navigate([
        '/reservations'
      ]);

    } catch (error) {

      console.error(
        'Error creating reservation:',
        error
      );

      // =====================================
      // BACKEND-FEHLER AUSWERTEN
      // =====================================

      if (error instanceof HttpErrorResponse) {

        switch (error.status) {

          case 409:

            this.errorMessage =
              'This vehicle is already reserved ' +
              'during the selected time.';

            break;

          case 401:

            this.errorMessage =
              'Your session has expired. ' +
              'Please log in again.';

            break;

          case 403:

            this.errorMessage =
              'You do not have permission ' +
              'to create this reservation.';

            break;

          case 404:

            this.errorMessage =
              'The selected vehicle was not found.';

            break;

          case 400:

            this.errorMessage =
              'Invalid reservation data. ' +
              'Please check your entries.';

            break;

          case 0:

            this.errorMessage =
              'Cannot connect to the backend. ' +
              'Please check if it is running.';

            break;

          default:

            this.errorMessage =
              'Could not create reservation. ' +
              'Please try again.';

            break;
        }

      } else {

        this.errorMessage =
          'An unexpected error occurred.';

      }

    } finally {

      this.isSaving = false;
    }
  }

  // =========================================
  // DAUER BERECHNEN
  // =========================================

  durationText(): string {

    if (this.endTime <= this.startTime) {
      return '-';
    }

    const minutes =
      this.toMinutes(this.endTime) -
      this.toMinutes(this.startTime);

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (remainingMinutes > 0) {
      return `${hours} h ${remainingMinutes} min`;
    }

    return `${hours} h`;
  }

  private toMinutes(time: string): number {

    const [hours, minutes] =
      time.split(':').map(Number);

    return hours * 60 + minutes;
  }
}