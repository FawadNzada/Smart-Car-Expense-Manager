import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { VehicleService } from '../../services/vehicle.service';
import { ReservationService } from '../../services/reservation.service';
import { TripService } from '../../services/trip.service';
import { ExpenseService } from '../../services/expense.service';

interface DebtApiItem {
  id: number;
  expenseId: number;
  category: string;
  debtorId: number;
  debtor: string;
  creditorId: number;
  creditor: string;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {

  readonly vehicleService = inject(VehicleService);
  readonly reservationService = inject(ReservationService);
  readonly tripService = inject(TripService);
  readonly expenseService = inject(ExpenseService);

  private readonly http = inject(HttpClient);

  readonly expenseCategories = [
    'Fuel',
    'Parking',
    'Maintenance',
    'Other'
  ];

  readonly tripStatuses = [
    'Planned',
    'Active',
    'Completed',
    'Cancelled'
  ];

  readonly vehicleStatuses = [
    'Available',
    'In Use',
    'Reserved',
    'Unavailable'
  ];

  // =========================================
  // DEBTS AUS SQLITE
  // =========================================

  readonly debts: DebtApiItem[] = [];

  debtLoadState: 'loading' | 'ready' | 'error' = 'loading';

  ngOnInit(): void {
    this.loadDebts();
  }

  private loadDebts(): void {

    this.debtLoadState = 'loading';

    this.http.get<DebtApiItem[]>(
      'http://localhost:5123/Debt'
    ).subscribe({

      next: (data) => {

        this.debts.splice(
          0,
          this.debts.length,
          ...data
        );

        this.debtLoadState = 'ready';

        console.log(
          'Statistics: debts loaded from SQLite',
          data
        );
      },

      error: (error) => {

        console.error(
          'Statistics: error loading debts',
          error
        );

        this.debtLoadState = 'error';
      }

    });
  }

  // =========================================
  // EXPENSE STATISTICS
  // =========================================

  get totalExpenses(): number {

    return this.expenseService.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
  }

  categoryTotal(category: string): number {

    return this.expenseService.expenses
      .filter(
        expense =>
          expense.category.toLowerCase() ===
          category.toLowerCase()
      )
      .reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
  }

  categoryPercentage(category: string): number {

    if (this.totalExpenses <= 0) {
      return 0;
    }

    return Math.round(
      this.categoryTotal(category) /
      this.totalExpenses * 100
    );
  }

  // =========================================
  // TRIP STATISTICS
  // =========================================

  get completedTrips(): number {

    return this.tripService.trips.filter(
      trip => trip.status === 'Completed'
    ).length;
  }

  get totalDistance(): number {

    return this.tripService.trips
      .filter(
        trip =>
          trip.status === 'Completed' &&
          trip.endMileage >= trip.startMileage
      )
      .reduce(
        (sum, trip) =>
          sum + trip.endMileage - trip.startMileage,
        0
      );
  }

  get averageTripDistance(): number {

    if (this.completedTrips === 0) {
      return 0;
    }

    return this.totalDistance / this.completedTrips;
  }

  countTrips(status: string): number {

    return this.tripService.trips.filter(
      trip =>
        trip.status.toLowerCase() ===
        status.toLowerCase()
    ).length;
  }

  tripPercentage(status: string): number {

    const total = this.tripService.trips.length;

    if (total === 0) {
      return 0;
    }

    return Math.round(
      this.countTrips(status) / total * 100
    );
  }

  // =========================================
  // VEHICLE STATISTICS
  // =========================================

  vehicleExpense(licensePlate: string): number {

    return this.expenseService.expenses
      .filter(
        expense =>
          expense.licensePlate.toLowerCase() ===
          licensePlate.toLowerCase()
      )
      .reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
  }

  get maximumVehicleExpense(): number {

    return Math.max(
      0,
      ...this.vehicleService.vehicles.map(
        vehicle => this.vehicleExpense(vehicle.licensePlate)
      )
    );
  }

  vehicleExpensePercentage(licensePlate: string): number {

    if (this.maximumVehicleExpense <= 0) {
      return 0;
    }

    return Math.round(
      this.vehicleExpense(licensePlate) /
      this.maximumVehicleExpense * 100
    );
  }

  vehicleDistance(licensePlate: string): number {

    return this.tripService.trips
      .filter(
        trip =>
          trip.licensePlate.toLowerCase() ===
          licensePlate.toLowerCase() &&
          trip.status === 'Completed' &&
          trip.endMileage >= trip.startMileage
      )
      .reduce(
        (sum, trip) =>
          sum + trip.endMileage - trip.startMileage,
        0
      );
  }

  countVehicles(status: string): number {

    return this.vehicleService.vehicles.filter(
      vehicle =>
        vehicle.status.toLowerCase() ===
        status.toLowerCase()
    ).length;
  }

  // =========================================
  // RESERVATION STATISTICS
  // =========================================

  get upcomingReservations(): number {

    const today = this.localDate(new Date());

    return this.reservationService.reservations.filter(
      reservation =>
        reservation.status !== 'Cancelled' &&
        reservation.status !== 'Completed' &&
        reservation.date >= today
    ).length;
  }

  get completedReservations(): number {

    return this.reservationService.reservations.filter(
      reservation => reservation.status === 'Completed'
    ).length;
  }

  get cancelledReservations(): number {

    return this.reservationService.reservations.filter(
      reservation => reservation.status === 'Cancelled'
    ).length;
  }

  // =========================================
  // DEBT STATISTICS
  // =========================================

  get openDebtAmount(): number {

    return this.debts
      .filter(debt => !debt.isPaid)
      .reduce(
        (sum, debt) => sum + debt.amount,
        0
      );
  }

  get paidDebtAmount(): number {

    return this.debts
      .filter(debt => debt.isPaid)
      .reduce(
        (sum, debt) => sum + debt.amount,
        0
      );
  }

  get openDebtCount(): number {

    return this.debts.filter(
      debt => !debt.isPaid
    ).length;
  }

  get paidDebtCount(): number {

    return this.debts.filter(
      debt => debt.isPaid
    ).length;
  }

  // =========================================
  // HELPERS
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

  money(value: number): string {

    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  expenseIcon(category: string): string {

    switch (category) {

      case 'Fuel':
        return '⛽';

      case 'Parking':
        return '🅿️';

      case 'Maintenance':
        return '🔧';

      default:
        return '💳';
    }
  }
}