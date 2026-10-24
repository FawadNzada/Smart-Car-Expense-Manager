import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { VehicleService } from '../../services/vehicle.service';
import { TripService } from '../../services/trip.service';
import { ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-create-expense',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './create-expense.component.html',
  styleUrls: ['./create-expense.component.css']
})
export class CreateExpenseComponent {

  private readonly vehicleService = inject(VehicleService);
  private readonly tripService = inject(TripService);
  private readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);

  // =========================================
  // FORMULAR
  // =========================================

  selectedLicensePlate = '';
  selectedTripId = 0;

  category = 'Fuel';
  amount = 0;

  expenseDate = this.localDate(new Date());

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
  // FAHRTEN
  // =========================================

  get availableTrips() {

    return this.tripService.trips.filter(
      trip =>
        trip.licensePlate.toLowerCase() ===
        this.selectedLicensePlate.toLowerCase()
    );
  }

  get selectedTrip() {

    if (!this.selectedTripId) {
      return undefined;
    }

    return this.tripService.findTrip(
      Number(this.selectedTripId)
    );
  }

  // =========================================
  // FAHRZEUG GEÄNDERT
  // =========================================

  vehicleChanged(): void {

    this.selectedTripId = 0;
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
  // AUSGABE ERSTELLEN
  // =========================================

  async saveExpense(): Promise<void> {

    if (this.isSaving) {
      return;
    }

    this.errorMessage = '';

    const vehicle = this.selectedVehicle;
    const trip = this.selectedTrip;

    // =====================================
    // VALIDIERUNG
    // =====================================

    if (!vehicle) {

      this.errorMessage =
        'Please select a vehicle.';

      return;
    }

    if (!this.category.trim()) {

      this.errorMessage =
        'Please select a category.';

      return;
    }

    if (
      !Number.isFinite(this.amount) ||
      this.amount <= 0
    ) {

      this.errorMessage =
        'Amount must be greater than 0.';

      return;
    }

    if (
      Math.abs(this.amount * 100 -
        Math.round(this.amount * 100)) > 0.000001
    ) {

      this.errorMessage =
        'Amount can have a maximum of two decimal places.';

      return;
    }

    if (!this.expenseDate) {

      this.errorMessage =
        'Please select a date.';

      return;
    }

    if (
      this.expenseDate >
      this.localDate(new Date())
    ) {

      this.errorMessage =
        'Expense date cannot be in the future.';

      return;
    }

    if (this.selectedTripId && !trip) {

      this.errorMessage =
        'The selected trip was not found.';

      return;
    }

    if (
      trip &&
      trip.licensePlate.toLowerCase() !==
      vehicle.licensePlate.toLowerCase()
    ) {

      this.errorMessage =
        'The selected trip does not belong to this vehicle.';

      return;
    }

    if (this.notes.trim().length > 1024) {

      this.errorMessage =
        'Notes cannot exceed 1024 characters.';

      return;
    }

    // =====================================
    // POST /Expense
    // =====================================

    this.isSaving = true;

    try {

      const created =
        await this.expenseService.createExpenseInBackend({

          vehicleName: vehicle.name,

          licensePlate: vehicle.licensePlate,

          category: this.category,

          amount: this.amount,

          date: this.expenseDate,

          // Wird vom Backend anhand
          // des Keycloak-Logins bestimmt.
          paidBy: '',

          tripId: trip?.id ?? null,

          tripRoute: trip
            ? `${trip.startLocation} → ${trip.destination}`
            : '',

          notes: this.notes.trim()

        });

      console.log(
        'Expense created in SQLite:',
        created
      );

      await this.router.navigate([
        '/expenses'
      ]);

    } catch (error) {

      console.error(
        'Error creating expense:',
        error
      );

      if (error instanceof HttpErrorResponse) {

        switch (error.status) {

          case 400:

            this.errorMessage =
              'Invalid expense data. Please check your entries.';

            break;

          case 401:

            this.errorMessage =
              'Your session has expired. Please log in again.';

            break;

          case 403:

            this.errorMessage =
              'You do not have permission to create expenses.';

            break;

          case 404:

            this.errorMessage =
              'The selected vehicle was not found.';

            break;

          case 409:

            this.errorMessage =
              'The expense could not be created due to a conflict.';

            break;

          case 0:

            this.errorMessage =
              'Cannot connect to the backend.';

            break;

          default:

            this.errorMessage =
              'Could not create expense. Please try again.';
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
  // GELDBETRAG FORMATIEREN
  // =========================================

  money(value: number): string {

    return new Intl.NumberFormat(
      'de-AT',
      {
        style: 'currency',
        currency: 'EUR'
      }
    ).format(value);
  }
}