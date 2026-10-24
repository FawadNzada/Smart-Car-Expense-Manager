import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Trip, TripService } from '../../services/trip.service';

type TripApiResponse = Omit<Trip, 'endMileage' | 'notes'> & {
  endMileage: number | null;
  notes: string | null;
};

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './trip-details.component.html',
  styleUrls: ['./trip-details.component.css']
})
export class TripDetailsComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly tripService = inject(TripService);

  private readonly apiUrl = 'http://localhost:5123/Trip';

  trip?: Trip;

  isLoading = true;
  isSaving = false;

  showCompleteModal = false;
  showCancelModal = false;

  endMileage = 0;

  errorMessage = '';
  loadError = '';

  // =========================================
  // INITIALIZATION
  // =========================================

  ngOnInit(): void {
    void this.loadTrip();
  }

  // =========================================
  // GET - TRIP FROM SQLITE
  // =========================================

  private async loadTrip(): Promise<void> {

    this.isLoading = true;
    this.loadError = '';

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.loadError = 'Invalid trip ID.';
      this.isLoading = false;
      return;
    }

    try {

      const data = await firstValueFrom(
        this.http.get<TripApiResponse>(
          `${this.apiUrl}/${id}`
        )
      );

      this.trip = {
        ...data,
        endMileage: data.endMileage ?? data.startMileage,
        notes: data.notes ?? ''
      };

      this.endMileage = this.trip.endMileage;

    } catch (error) {

      console.error('Error loading trip:', error);

      this.loadError = this.getErrorMessage(error);

    } finally {

      this.isLoading = false;
    }
  }

  // =========================================
  // STATUS
  // =========================================

  statusClass(status: string): string {

    if (status === 'In Progress') {
      return 'active';
    }

    return status.toLowerCase();
  }

  // =========================================
  // DISTANCE
  // =========================================

  distance(): string {

    const trip = this.trip;

    if (!trip) {
      return '-';
    }

    if (trip.endMileage < trip.startMileage) {
      return '-';
    }

    if (
      trip.status !== 'Completed' &&
      trip.endMileage === trip.startMileage
    ) {
      return '-';
    }

    return `${trip.endMileage - trip.startMileage} km`;
  }

  // =========================================
  // OPEN COMPLETE MODAL
  // =========================================

  openCompleteModal(): void {

    if (!this.trip || this.isSaving) {
      return;
    }

    this.errorMessage = '';

    this.endMileage = this.trip.endMileage;

    this.showCompleteModal = true;
  }

  // =========================================
  // COMPLETE TRIP - PUT
  // =========================================

  async completeTrip(): Promise<void> {

    if (this.isSaving) {
      return;
    }

    const trip = this.trip;

    if (!trip) {
      return;
    }

    this.errorMessage = '';

    if (
      trip.status === 'Completed' ||
      trip.status === 'Cancelled'
    ) {
      this.errorMessage =
        'This trip cannot be completed.';
      return;
    }

    if (
      !Number.isInteger(this.endMileage) ||
      this.endMileage < trip.startMileage
    ) {
      this.errorMessage =
        'End mileage cannot be lower than start mileage.';
      return;
    }

    this.isSaving = true;

    try {

      const updatedTrip: Trip = {
        ...trip,
        endMileage: this.endMileage,
        status: 'Completed'
      };

      // PUT /Trip/{id}
      await this.tripService.updateTripInBackend(
        updatedTrip
      );

      // Erst nach erfolgreicher Speicherung
      // wird der Status in Angular aktualisiert.
      this.trip = updatedTrip;

      this.showCompleteModal = false;
      this.errorMessage = '';

      console.log(
        'Trip completed in SQLite:',
        updatedTrip
      );

    } catch (error) {

      console.error(
        'Error completing trip:',
        error
      );

      this.errorMessage = this.getErrorMessage(error);

    } finally {

      this.isSaving = false;
    }
  }

  // =========================================
  // OPEN CANCEL MODAL
  // =========================================

  openCancelModal(): void {

    if (!this.trip || this.isSaving) {
      return;
    }

    this.errorMessage = '';

    this.showCancelModal = true;
  }

  // =========================================
  // CANCEL TRIP - DELETE
  // =========================================

  async cancelTrip(): Promise<void> {

    if (this.isSaving) {
      return;
    }

    const trip = this.trip;

    if (!trip) {
      return;
    }

    this.errorMessage = '';

    if (
      trip.status === 'Completed' ||
      trip.status === 'Cancelled'
    ) {
      this.errorMessage =
        'This trip cannot be cancelled.';
      return;
    }

    this.isSaving = true;

    try {

      // DELETE /Trip/{id}
      // Das Backend setzt Status = Cancelled.
      await this.tripService.cancelTripInBackend(
        trip
      );

      this.trip = {
        ...trip,
        status: 'Cancelled'
      };

      this.showCancelModal = false;
      this.errorMessage = '';

      console.log(
        'Trip cancelled in SQLite:',
        this.trip
      );

    } catch (error) {

      console.error(
        'Error cancelling trip:',
        error
      );

      this.errorMessage = this.getErrorMessage(error);

    } finally {

      this.isSaving = false;
    }
  }

  // =========================================
  // CLOSE MODALS
  // =========================================

  closeCompleteModal(): void {

    if (this.isSaving) {
      return;
    }

    this.showCompleteModal = false;
    this.errorMessage = '';
  }

  closeCancelModal(): void {

    if (this.isSaving) {
      return;
    }

    this.showCancelModal = false;
    this.errorMessage = '';
  }

  // =========================================
  // ERROR HANDLING
  // =========================================

  private getErrorMessage(error: unknown): string {

    if (error instanceof HttpErrorResponse) {

      switch (error.status) {

        case 400:
          return 'Invalid trip data.';

        case 401:
          return 'Your session has expired. Please log in again.';

        case 403:
          return 'You do not have permission to modify this trip.';

        case 404:
          return 'Trip not found.';

        case 409:
          return 'This action conflicts with the current trip status.';

        case 0:
          return 'Cannot connect to the backend.';

        default:
          return 'The operation failed. Please try again.';
      }
    }

    return 'An unexpected error occurred.';
  }
}