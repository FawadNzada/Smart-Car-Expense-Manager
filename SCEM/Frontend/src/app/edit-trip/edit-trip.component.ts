import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { VehicleService } from '../../services/vehicle.service';
import { Trip, TripService } from '../../services/trip.service';

type TripApiResponse = Omit<Trip, 'endMileage'> & {
  endMileage: number | null;
};

@Component({
  selector: 'app-edit-trip',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './edit-trip.component.html',
  styleUrls: ['./edit-trip.component.css']
})
export class EditTripComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  private readonly vehicleService = inject(VehicleService);
  private readonly tripService = inject(TripService);

  private readonly apiUrl = 'http://localhost:5123/Trip';

  // =========================================
  // TRIP DATA
  // =========================================

  trip?: Trip;

  selectedLicensePlate = '';
  driver = '';

  startLocation = '';
  destination = '';

  tripDate = '';

  startTime = '09:00';
  endTime = '10:00';

  startMileage = 0;
  endMileage = 0;

  status = 'Planned';
  notes = '';

  errorMessage = '';
  loadError = '';

  isLoading = true;
  isSaving = false;

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
  // INITIALIZATION
  // =========================================

  ngOnInit(): void {
    void this.loadTrip();
  }

  // =========================================
  // LOAD TRIP FROM SQLITE
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

      // Backend kann beim Endkilometerstand
      // null zurückgeben.

      const loadedTrip: Trip = {
        ...data,
        endMileage:
          data.endMileage ?? data.startMileage
      };

      this.trip = loadedTrip;

      this.selectedLicensePlate =
        loadedTrip.licensePlate;

      this.driver =
        loadedTrip.driver;

      this.startLocation =
        loadedTrip.startLocation;

      this.destination =
        loadedTrip.destination;

      this.tripDate =
        loadedTrip.date;

      this.startTime =
        loadedTrip.startTime;

      this.endTime =
        loadedTrip.endTime;

      this.startMileage =
        loadedTrip.startMileage;

      this.endMileage =
        loadedTrip.endMileage;

      this.status =
        loadedTrip.status;

      this.notes =
        loadedTrip.notes ?? '';

    } catch (error) {

      console.error(
        'Error loading trip:',
        error
      );

      this.loadError = this.getErrorMessage(error);

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

    const trip = this.trip;
    const vehicle = this.selectedVehicle;

    if (!trip) {

      this.errorMessage = 'Trip not found.';
      return;
    }

    if (trip.status === 'Cancelled') {

      this.errorMessage =
        'Cancelled trips cannot be edited.';

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

    if (!this.startLocation.trim()) {

      this.errorMessage =
        'Please enter a start location.';

      return;
    }

    if (!this.destination.trim()) {

      this.errorMessage =
        'Please enter a destination.';

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

      this.errorMessage =
        'Please select a date.';

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
        'Start mileage must be a positive whole number.';

      return;
    }

    if (
      !Number.isInteger(this.endMileage) ||
      this.endMileage < this.startMileage
    ) {

      this.errorMessage =
        'End mileage cannot be less than start mileage.';

      return;
    }

    if (this.notes.trim().length > 1024) {

      this.errorMessage =
        'Notes cannot exceed 1024 characters.';

      return;
    }

    // =====================================
    // PREPARE UPDATED TRIP
    // =====================================

    const updatedTrip: Trip = {

      ...trip,

      vehicleName: vehicle.name,

      licensePlate: vehicle.licensePlate,

      vehicleImage: vehicle.image,

      // Fahrer bleibt der angemeldete
      // Keycloak-Benutzer.
      driver: trip.driver,

      startLocation:
        this.startLocation.trim(),

      destination:
        this.destination.trim(),

      date: this.tripDate,

      startTime: this.startTime,

      endTime: this.endTime,

      startMileage: this.startMileage,

      endMileage: this.endMileage,

      status: this.status,

      notes: this.notes.trim()

    };

    // =====================================
    // SAVE TO SQLITE
    // =====================================

    this.isSaving = true;

    try {

      await this.tripService
        .updateTripInBackend(updatedTrip);

      // Erst nach erfolgreichem PUT
      // werden die lokalen Daten aktualisiert.

      this.trip = updatedTrip;

      console.log(
        'Trip updated in SQLite:',
        updatedTrip
      );

      await this.router.navigate([
        '/trips',
        updatedTrip.id
      ]);

    } catch (error) {

      console.error(
        'Error updating trip:',
        error
      );

      this.errorMessage =
        this.getErrorMessage(error);

    } finally {

      this.isSaving = false;
    }
  }

  // =========================================
  // ERROR HANDLING
  // =========================================

  private getErrorMessage(error: unknown): string {

    if (error instanceof HttpErrorResponse) {

      switch (error.status) {

        case 400:
          return (
            'Invalid trip data. ' +
            'Please check your entries.'
          );

        case 401:
          return (
            'Your session has expired. ' +
            'Please log in again.'
          );

        case 403:
          return (
            'You do not have permission ' +
            'to edit this trip.'
          );

        case 404:
          return 'Trip not found.';

        case 0:
          return (
            'Cannot connect to the backend. ' +
            'Please check if it is running.'
          );

        default:
          return (
            'Could not save the trip. ' +
            'Please try again.'
          );
      }
    }

    return 'An unexpected error occurred.';
  }

  // =========================================
  // DISTANCE PREVIEW
  // =========================================

  get distance(): number {

    if (
      this.endMileage < this.startMileage
    ) {
      return 0;
    }

    return this.endMileage - this.startMileage;
  }
}