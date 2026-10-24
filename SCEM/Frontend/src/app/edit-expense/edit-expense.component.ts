import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { VehicleService } from '../../services/vehicle.service';
import { TripService } from '../../services/trip.service';
import { Expense, ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-edit-expense',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './edit-expense.component.html',
  styleUrls: ['./edit-expense.component.css']
})
export class EditExpenseComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  private readonly vehicleService = inject(VehicleService);
  private readonly tripService = inject(TripService);
  private readonly expenseService = inject(ExpenseService);

  private readonly apiUrl = 'http://localhost:5123/Expense';

  expense?: Expense;

  selectedLicensePlate = '';
  selectedTripId = 0;

  category = 'Fuel';
  amount = 0;
  expenseDate = '';

  paidBy = '';
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
  // TRIPS
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

  vehicleChanged(): void {
    this.selectedTripId = 0;
  }

  // =========================================
  // INITIALIZATION
  // =========================================

  ngOnInit(): void {
    void this.loadExpense();
  }

  // =========================================
  // GET /Expense/{id}
  // =========================================

  private async loadExpense(): Promise<void> {

    this.isLoading = true;
    this.loadError = '';

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.loadError = 'Invalid expense ID.';
      this.isLoading = false;
      return;
    }

    try {

      const data = await firstValueFrom(
        this.http.get<Expense>(
          `${this.apiUrl}/${id}`
        )
      );

      this.expense = data;

      this.selectedLicensePlate = data.licensePlate;
      this.selectedTripId = data.tripId ?? 0;

      this.category = data.category;
      this.amount = data.amount;
      this.expenseDate = data.date;

      this.paidBy = data.paidBy;
      this.notes = data.notes ?? '';

    } catch (error) {

      console.error('Error loading expense:', error);

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

    const expense = this.expense;
    const vehicle = this.selectedVehicle;
    const trip = this.selectedTrip;

    // =====================================
    // VALIDATION
    // =====================================

    if (!expense) {
      this.errorMessage = 'Expense not found.';
      return;
    }

    if (!vehicle) {
      this.errorMessage = 'Please select a vehicle.';
      return;
    }

    if (!this.category.trim()) {
      this.errorMessage = 'Please select a category.';
      return;
    }

    if (
      !Number.isFinite(this.amount) ||
      this.amount <= 0
    ) {
      this.errorMessage = 'Amount must be greater than 0.';
      return;
    }

    if (
      Math.abs(
        this.amount * 100 -
        Math.round(this.amount * 100)
      ) > 0.000001
    ) {
      this.errorMessage =
        'Amount can have a maximum of two decimal places.';
      return;
    }

    if (!this.expenseDate) {
      this.errorMessage = 'Please select a date.';
      return;
    }

    if (this.expenseDate > this.localDate(new Date())) {
      this.errorMessage =
        'Expense date cannot be in the future.';
      return;
    }

    if (this.selectedTripId && !trip) {
      this.errorMessage = 'Selected trip not found.';
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
    // UPDATED EXPENSE
    // =====================================

    const updatedExpense: Expense = {

      ...expense,

      vehicleName: vehicle.name,

      licensePlate: vehicle.licensePlate,

      tripId: trip?.id ?? null,

      tripRoute: trip
        ? `${trip.startLocation} → ${trip.destination}`
        : '',

      category: this.category,

      amount: this.amount,

      date: this.expenseDate,

      // Benutzer wird nicht geändert.
      paidBy: expense.paidBy,

      notes: this.notes.trim()

    };

    // =====================================
    // PUT /Expense/{id}
    // =====================================

    this.isSaving = true;

    try {

      await this.expenseService
        .updateExpenseInBackend(updatedExpense);

      this.expense = updatedExpense;

      console.log(
        'Expense updated in SQLite:',
        updatedExpense
      );

      await this.router.navigate([
        '/expenses',
        updatedExpense.id
      ]);

    } catch (error) {

      console.error(
        'Error updating expense:',
        error
      );

      this.errorMessage = this.getErrorMessage(error);

    } finally {

      this.isSaving = false;
    }
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
  // ERROR HANDLING
  // =========================================

  private getErrorMessage(error: unknown): string {

    if (error instanceof HttpErrorResponse) {

      switch (error.status) {

        case 400:
          return 'Invalid expense data.';

        case 401:
          return 'Your session has expired. Please log in again.';

        case 403:
          return 'You do not have permission to edit this expense.';

        case 404:
          return 'Expense not found.';

        case 409:
          return 'This expense cannot be modified.';

        case 0:
          return 'Cannot connect to the backend.';

        default:
          return 'Could not save expense. Please try again.';
      }
    }

    return 'An unexpected error occurred.';
  }

  // =========================================
  // CURRENCY
  // =========================================

  money(value: number): string {

    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }
}