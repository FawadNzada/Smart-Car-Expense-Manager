import {
  Component,
  inject
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  Vehicle,
  VehicleService
} from '../../services/vehicle.service';

import {
  Reservation,
  ReservationService
} from '../../services/reservation.service';

import {
  TripService
} from '../../services/trip.service';

import {
  ExpenseService
} from '../../services/expense.service';

import {
  DebtService
} from '../../services/debt.service';


@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl:
    './dashboard.component.html',

  styleUrls: [
    './dashboard.component.css'
  ]
})
export class DashboardComponent {

  private readonly vehicleService =
    inject(VehicleService);

  private readonly reservationService =
    inject(ReservationService);

  private readonly tripService =
    inject(TripService);

  private readonly expenseService =
    inject(ExpenseService);

  private readonly debtService =
    inject(DebtService);


  /* =========================
     VEHICLES
     ========================= */

  get vehicles(): Vehicle[] {
    return this.vehicleService.vehicles;
  }


  get availableVehicles(): number {

    return this.vehicles.filter(
      vehicle =>
        vehicle.status === 'Available'
    ).length;

  }


  countVehicles(
    status: string
  ): number {

    return this.vehicles.filter(
      vehicle =>
        vehicle.status.toLowerCase()
        ===
        status.toLowerCase()
    ).length;

  }


  /* =========================
     RESERVATIONS
     ========================= */

  get upcomingReservations(): Reservation[] {

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    return [
      ...this.reservationService.reservations
    ]
      .filter(
        reservation =>

          reservation.status !== 'Cancelled'

          &&

          reservation.status !== 'Completed'

          &&

          reservation.date >= today
      )
      .sort(
        (a, b) =>
          (
            a.date
            +
            a.startTime
          )
            .localeCompare(
              b.date
              +
              b.startTime
            )
      );

  }


  /* =========================
     TRIPS
     ========================= */

  get activeTrips(): number {

    return this.tripService.trips.filter(
      trip =>
        trip.status === 'Active'
    ).length;

  }


  get completedTrips(): number {

    return this.tripService.trips.filter(
      trip =>
        trip.status === 'Completed'
    ).length;

  }


  /* =========================
     EXPENSES
     ========================= */

  get totalExpenses(): number {

    return this.expenseService.expenses.reduce(
      (
        total,
        expense
      ) =>
        total + expense.amount,
      0
    );

  }


  get recentExpenses() {

    return [
      ...this.expenseService.expenses
    ]
      .sort(
        (a, b) =>
          (
            b.date
            +
            b.id
          )
            .localeCompare(
              a.date
              +
              a.id
            )
      )
      .slice(
        0,
        4
      );

  }


  /* =========================
     DEBTS
     ========================= */

  get openDebts() {

    return [
      ...this.debtService.debts
    ]
      .filter(
        debt =>
          debt.status === 'Open'
      )
      .sort(
        (a, b) =>
          (
            b.date
            +
            b.id
          )
            .localeCompare(
              a.date
              +
              a.id
            )
      );

  }


  get openDebtAmount(): number {

    return this.openDebts.reduce(
      (
        total,
        debt
      ) =>
        total + debt.amount,
      0
    );

  }


  /* =========================
     FORMAT
     ========================= */

  formatMoney(
    amount: number
  ): string {

    return new Intl.NumberFormat(
      'de-AT',
      {
        style: 'currency',
        currency: 'EUR'
      }
    ).format(amount);

  }


  formatDate(
    date: string
  ): string {

    return new Intl.DateTimeFormat(
      'en-GB',
      {
        day: '2-digit',
        month: 'short'
      }
    ).format(
      new Date(
        `${date}T12:00:00`
      )
    );

  }


  /* =========================
     EXISTING HELPERS
     ========================= */

  money(
    amount: number
  ): string {

    return this.formatMoney(
      amount
    );

  }


  dateShort(
    date: string
  ): string {

    return this.formatDate(
      date
    );

  }


  expenseIcon(
    category: string
  ): string {

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


  reservationStatusClass(
    status: string
  ): string {

    return status === 'Upcoming'
      ? 'upcoming'
      : 'planned';

  }

}