import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  Reservation,
  ReservationService
} from '../../services/reservation.service';

@Component({
  selector: 'app-reservation-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reservation-details.component.html',
  styleUrls: ['./reservation-details.component.css']
})
export class ReservationDetailsComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);

  private readonly http = inject(HttpClient);

  private readonly reservationService =
    inject(ReservationService);

  private readonly apiUrl =
    'http://localhost:5123/Reservation';

  reservation?: Reservation;

  showCancelConfirmation = false;

  isLoading = true;

  isCancelling = false;

  loadError = '';

  cancelError = '';

  // =========================================
  // INITIALIZATION
  // =========================================

  ngOnInit(): void {
    void this.loadReservation();
  }

  // =========================================
  // LOAD RESERVATION FROM SQLITE
  // =========================================

  private async loadReservation(): Promise<void> {

    this.isLoading = true;
    this.loadError = '';

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {

      this.loadError = 'Invalid reservation ID.';

      this.isLoading = false;

      return;
    }

    try {

      this.reservation = await firstValueFrom(
        this.http.get<Reservation>(
          `${this.apiUrl}/${id}`
        )
      );

    } catch (error) {

      console.error(
        'Error loading reservation:',
        error
      );

      this.loadError = this.getErrorMessage(
        error
      );

    } finally {

      this.isLoading = false;

    }
  }

  // =========================================
  // OPEN CONFIRMATION
  // =========================================

  openCancelConfirmation(): void {

    if (!this.reservation || this.isCancelling) {
      return;
    }

    if (
      this.reservation.status === 'Cancelled' ||
      this.reservation.status === 'Completed'
    ) {
      return;
    }

    this.cancelError = '';

    this.showCancelConfirmation = true;
  }

  // =========================================
  // CLOSE CONFIRMATION
  // =========================================

  closeCancelConfirmation(): void {

    if (this.isCancelling) {
      return;
    }

    this.showCancelConfirmation = false;

    this.cancelError = '';
  }

  // =========================================
  // CANCEL RESERVATION IN SQLITE
  // =========================================

  async cancelReservation(): Promise<void> {

    if (this.isCancelling) {
      return;
    }

    const reservation = this.reservation;

    if (!reservation) {
      return;
    }

    if (
      reservation.status === 'Cancelled' ||
      reservation.status === 'Completed'
    ) {
      return;
    }

    this.cancelError = '';

    this.isCancelling = true;

    try {

      // =====================================
      // DELETE REQUEST TO BACKEND
      // Backend sets Status = Cancelled
      // =====================================

      await this.reservationService
        .cancelReservationInBackend(
          reservation
        );

      // =====================================
      // UPDATE LOCAL RESERVATION LIST
      // =====================================

      const cachedReservation =
        this.reservationService.findReservation(
          reservation.id
        );

      if (cachedReservation) {

        cachedReservation.status = 'Cancelled';

      }

      // =====================================
      // CLOSE CONFIRMATION
      // =====================================

      this.showCancelConfirmation = false;

      console.log(
        'Reservation cancelled in SQLite:',
        reservation.id
      );

    } catch (error) {

      console.error(
        'Error cancelling reservation:',
        error
      );

      this.cancelError = this.getErrorMessage(
        error
      );

    } finally {

      this.isCancelling = false;

    }
  }

  // =========================================
  // ERROR HANDLING
  // =========================================

  private getErrorMessage(
    error: unknown
  ): string {

    if (error instanceof HttpErrorResponse) {

      switch (error.status) {

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

        case 409:

          return (
            'The reservation status has changed. ' +
            'Please reload the page.'
          );

        case 0:

          return (
            'Cannot connect to the backend. ' +
            'Please check if it is running.'
          );

        default:

          return (
            'The operation could not be completed. ' +
            'Please try again.'
          );
      }
    }

    return 'An unexpected error occurred.';
  }

  // =========================================
  // DISPLAY STATUS
  // =========================================

  displayStatus(): string {

    const reservation = this.reservation;

    if (!reservation) {
      return '';
    }

    if (
      reservation.status === 'Cancelled' ||
      reservation.status === 'Completed'
    ) {

      return reservation.status;
    }

    if (reservation.date < this.localDate(new Date())) {
      return 'Past';
    }

    return reservation.status;
  }

  // =========================================
  // STATUS CSS CLASS
  // =========================================

  statusClass(): string {

    return this.displayStatus().toLowerCase();

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
  // DURATION
  // =========================================

  durationText(): string {

    const reservation = this.reservation;

    if (!reservation) {
      return '-';
    }

    const toMinutes = (value: string): number => {

      const [hours, minutes] =
        value.split(':').map(Number);

      return hours * 60 + minutes;
    };

    const minutes =
      toMinutes(reservation.endTime) -
      toMinutes(reservation.startTime);

    if (minutes <= 0) {
      return '-';
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    return remainingMinutes
      ? `${hours} h ${remainingMinutes} min`
      : `${hours} h`;
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
}