import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { VehicleService } from '../../services/vehicle.service';
import {
  Reservation,
  ReservationService
} from '../../services/reservation.service';

@Component({
  selector: 'app-edit-reservation',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './edit-reservation.component.html',
  styleUrls: ['./edit-reservation.component.css']
})
export class EditReservationComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  private readonly vehicleService = inject(VehicleService);
  private readonly reservationService = inject(ReservationService);

  private readonly apiUrl = 'http://localhost:5123/Reservation';

  reservation?: Reservation;

  selectedLicensePlate = '';
  driver = '';
  reservationDate = '';
  startTime = '09:00';
  endTime = '10:00';
  status = 'Planned';
  notes = '';

  errorMessage = '';

  isLoading = true;
  isSaving = false;

  today = this.localDate(new Date());

  // =========================================
  // VEHICLES
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
  // INIT
  // =========================================

  ngOnInit(): void {
    void this.loadReservation();
  }

  // =========================================
  // LOAD RESERVATION FROM BACKEND
  // =========================================

  private async loadReservation(): Promise<void> {

    this.isLoading = true;
    this.errorMessage = '';

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {

      this.errorMessage = 'Invalid reservation ID.';
      this.isLoading = false;

      return;
    }

    try {

      const reservation = await firstValueFrom(
        this.http.get<Reservation>(
          `${this.apiUrl}/${id}`
        )
      );

      this.reservation = reservation;

      this.selectedLicensePlate =
        reservation.licensePlate;

      this.driver =
        reservation.driver;

      this.reservationDate =
        reservation.date;

      this.startTime =
        reservation.startTime;

      this.endTime =
        reservation.endTime;

      this.status =
        reservation.status;

      this.notes =
        reservation.notes ?? '';

    } catch (error) {

      console.error(
        'Error loading reservation:',
        error
      );

      this.errorMessage = this.getErrorMessage(
        error,
        'load'
      );

    } finally {

      this.isLoading = false;

    }
  }

  // =========================================
  // SAVE CHANGES
  // =========================================

  async saveChanges(): Promise<void> {

    if (this.isSaving) {
      return;
    }

    this.errorMessage = '';

    const reservation = this.reservation;
    const vehicle = this.selectedVehicle;

    if (!reservation) {

      this.errorMessage =
        'Reservation not found.';

      return;
    }

    if (reservation.status === 'Cancelled') {

      this.errorMessage =
        'Cancelled reservations cannot be edited.';

      return;
    }

    // =====================================
    // VALIDATION
    // =====================================

    if (!vehicle) {

      this.errorMessage =
        'Please select a vehicle.';

      return;
    }

    if (!this.reservationDate) {

      this.errorMessage =
        'Please select a date.';

      return;
    }

    if (
      this.reservationDate < this.localDate(new Date()) &&
      this.reservationDate !== reservation.date
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

    // =====================================
    // PREPARE UPDATED RESERVATION
    // =====================================

    const updatedReservation: Reservation = {

      ...reservation,

      vehicleName: vehicle.name,

      licensePlate: vehicle.licensePlate,

      vehicleImage: vehicle.image,

      // Driver is assigned by Keycloak.
      driver: reservation.driver,

      date: this.reservationDate,

      startTime: this.startTime,

      endTime: this.endTime,

      status: this.status,

      notes: this.notes.trim()

    };

    this.isSaving = true;

    try {

      // =====================================
      // SAVE TO SQLITE VIA BACKEND
      // =====================================

      await this.reservationService
        .updateReservationInBackend(
          updatedReservation
        );

      // =====================================
      // UPDATE LOCAL DATA AFTER SUCCESS
      // =====================================

      Object.assign(
        reservation,
        updatedReservation
      );

      const cachedReservation =
        this.reservationService.findReservation(
          reservation.id
        );

      if (cachedReservation) {

        Object.assign(
          cachedReservation,
          updatedReservation
        );

      } else {

        this.reservationService.reservations.push(
          { ...updatedReservation }
        );

      }

      console.log(
        'Reservation updated in SQLite:',
        updatedReservation
      );

      // =====================================
      // BACK TO RESERVATION DETAILS
      // =====================================

      await this.router.navigate([
        '/reservations',
        reservation.id
      ]);

    } catch (error) {

      console.error(
        'Error updating reservation:',
        error
      );

      this.errorMessage = this.getErrorMessage(
        error,
        'save'
      );

    } finally {

      this.isSaving = false;

    }
  }

  // =========================================
  // ERROR MESSAGES
  // =========================================

  private getErrorMessage(
    error: unknown,
    action: 'load' | 'save'
  ): string {

    if (error instanceof HttpErrorResponse) {

      switch (error.status) {

        case 409:

          return (
            'This vehicle is already reserved ' +
            'during the selected time.'
          );

        case 401:

          return (
            'Your session has expired. ' +
            'Please log in again.'
          );

        case 403:

          return (
            'You do not have permission ' +
            'to access this reservation.'
          );

        case 404:

          return 'Reservation not found.';

        case 400:

          return (
            'Invalid reservation data. ' +
            'Please check your entries.'
          );

        case 0:

          return (
            'Cannot connect to the backend. ' +
            'Please check if it is running.'
          );

        default:

          return action === 'load'
            ? 'Could not load reservation.'
            : 'Could not save reservation.';

      }
    }

    return 'An unexpected error occurred.';
  }

  // =========================================
  // STATUS CLASS
  // =========================================

  statusClass(): string {

    return this.status.toLowerCase();

  }

  // =========================================
  // LOCAL DATE
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
  // DISPLAY DATE
  // =========================================

  dateLong(date: string): string {

    if (!date) {
      return '-';
    }

    return new Intl.DateTimeFormat(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    ).format(
      new Date(date + 'T12:00:00')
    );
  }

  // =========================================
  // DURATION
  // =========================================

  durationText(): string {

    if (
      !this.startTime ||
      !this.endTime ||
      this.endTime <= this.startTime
    ) {

      return '-';

    }

    const minutes =
      this.toMinutes(this.endTime) -
      this.toMinutes(this.startTime);

    const hours =
      Math.floor(minutes / 60);

    const remainingMinutes =
      minutes % 60;

    return remainingMinutes
      ? `${hours} h ${remainingMinutes} min`
      : `${hours} h`;
  }

  private toMinutes(time: string): number {

    const [hours, minutes] =
      time.split(':').map(Number);

    return hours * 60 + minutes;
  }
}