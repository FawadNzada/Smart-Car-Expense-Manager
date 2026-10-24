import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';

import { Vehicle, VehicleService } from '../../services/vehicle.service';
import { Reservation, ReservationService } from '../../services/reservation.service';
import { TripService } from '../../services/trip.service';
import { ExpenseService } from '../../services/expense.service';

interface DashboardActivity {
  key: string;
  title: string;
  description: string;
  date: string;
  route: string;
  type: 'reservation' | 'trip' | 'expense';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly reservationService = inject(ReservationService);
  private readonly tripService = inject(TripService);
  private readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);
  private readonly keycloak = inject(Keycloak);

  readonly categories = ['Fuel', 'Parking', 'Maintenance', 'Other'];

  searchTerm = '';
  showAllExpenses = false;
  private profileFirstName = '';

  ngOnInit(): void {
    // Vorname gehört zum tatsächlich eingeloggten Keycloak-Konto.
    if (this.keycloak.authenticated) {
      void this.keycloak.loadUserProfile()
        .then(profile => {
          this.profileFirstName = profile.firstName?.trim() ?? '';
        })
        .catch(() => {
          // Token-Vorname bleibt als Fallback verfügbar.
        });
    }
  }

  get firstName(): string {
    const claims = this.keycloak.tokenParsed;
    const fromToken = String(
      claims?.['given_name'] ?? claims?.['preferred_username'] ?? ''
    ).trim();

    return this.profileFirstName || fromToken.split(/[\s@]/)[0] || 'there';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    return hour < 11 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  }

  get todayLabel(): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(new Date());
  }

  private todayIso(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get vehicles(): Vehicle[] {
    return this.vehicleService.vehicles;
  }

  get availableVehicles(): number {
    return this.vehicles.filter(v => v.status === 'Available').length;
  }

  get upcomingReservations(): Reservation[] {
    const now = new Date();
    const today = this.todayIso();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return [...this.reservationService.reservations]
      .filter(r =>
        r.status !== 'Cancelled' &&
        r.status !== 'Completed' &&
        (r.date > today || (r.date === today && r.endTime >= currentTime))
      )
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }

  get completedTrips(): number {
    return this.tripService.trips.filter(t => t.status === 'Completed').length;
  }

  get activeTrips(): number {
    return this.tripService.trips.filter(t => t.status === 'Active').length;
  }

  get plannedTrips(): number {
    return this.tripService.trips.filter(t => t.status === 'Planned').length;
  }

  get cancelledTrips(): number {
    return this.tripService.trips.filter(t => t.status === 'Cancelled').length;
  }

  get totalTrips(): number {
    return this.tripService.trips.length;
  }

  get totalDistance(): number {
    return this.tripService.trips
      .filter(t => t.status === 'Completed' && t.endMileage >= t.startMileage)
      .reduce((sum, t) => sum + t.endMileage - t.startMileage, 0);
  }

  get averageDistance(): number {
    return this.completedTrips ? this.totalDistance / this.completedTrips : 0;
  }

  // Statusfarben passen zur vorhandenen dunklen/goldenen Dashboard-Optik.
  get tripDonutBackground(): string {
    if (this.totalTrips === 0) return 'conic-gradient(#2c3034 0% 100%)';

    const total = this.totalTrips;
    const completed = this.completedTrips / total * 100;
    const active = this.activeTrips / total * 100;
    const planned = this.plannedTrips / total * 100;
    const endCompleted = completed;
    const endActive = endCompleted + active;
    const endPlanned = endActive + planned;

    return `conic-gradient(
      #48aa82 0% ${endCompleted}%,
      #d5a442 ${endCompleted}% ${endActive}%,
      #ddc79a ${endActive}% ${endPlanned}%,
      #777c83 ${endPlanned}% 100%
    )`;
  }

  get totalExpenses(): number {
    return this.expenseService.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  get chartExpenses() {
    if (this.showAllExpenses) return this.expenseService.expenses;
    const month = this.todayIso().slice(0, 7);
    return this.expenseService.expenses.filter(e => e.date.startsWith(month));
  }

  get chartTotal(): number {
    return this.chartExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  categoryTotal(category: string): number {
    return this.chartExpenses
      .filter(e => e.category.toLowerCase() === category.toLowerCase())
      .reduce((sum, e) => sum + e.amount, 0);
  }

  get chartMaximum(): number {
    return Math.max(1, ...this.categories.map(c => this.categoryTotal(c)));
  }

  categoryHeight(category: string): number {
    return this.categoryTotal(category) / this.chartMaximum * 100;
  }

  toggleExpensePeriod(): void {
    this.showAllExpenses = !this.showAllExpenses;
  }

  get recentActivity(): DashboardActivity[] {
    const expenses: DashboardActivity[] = this.expenseService.expenses.map(e => ({
      key: `expense-${e.id}`,
      title: `${e.category} expense`,
      description: `${e.vehicleName} · ${this.formatMoney(e.amount)}`,
      date: e.date,
      route: `/expenses/${e.id}`,
      type: 'expense'
    }));

    const trips: DashboardActivity[] = this.tripService.trips.map(t => ({
      key: `trip-${t.id}`,
      title: `Trip ${t.status.toLowerCase()}`,
      description: `${t.startLocation} → ${t.destination}`,
      date: t.date,
      route: `/trips/${t.id}`,
      type: 'trip'
    }));

    const reservations: DashboardActivity[] = this.reservationService.reservations.map(r => ({
      key: `reservation-${r.id}`,
      title: `Reservation · ${r.status}`,
      description: `${r.vehicleName} · ${r.startTime}`,
      date: r.date,
      route: `/reservations/${r.id}`,
      type: 'reservation'
    }));

    // Sortierung nach geplantem/erfasstem Datum, nicht nach Erstellungszeit.
    return [...expenses, ...trips, ...reservations]
      .sort((a, b) => b.date.localeCompare(a.date) || b.key.localeCompare(a.key))
      .slice(0, 4);
  }

  searchDashboard(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return;

    const vehicle = this.vehicles.find(v =>
      `${v.name} ${v.licensePlate}`.toLowerCase().includes(term)
    );
    if (vehicle) {
      void this.router.navigate(['/vehicles', vehicle.licensePlate]);
      return;
    }

    const trip = this.tripService.trips.find(t =>
      `${t.startLocation} ${t.destination} ${t.licensePlate}`.toLowerCase().includes(term)
    );
    if (trip) {
      void this.router.navigate(['/trips', trip.id]);
      return;
    }

    const reservation = this.reservationService.reservations.find(r =>
      `${r.vehicleName} ${r.driver} ${r.licensePlate}`.toLowerCase().includes(term)
    );
    if (reservation) {
      void this.router.navigate(['/reservations', reservation.id]);
      return;
    }

    const expense = this.expenseService.expenses.find(e =>
      `${e.category} ${e.vehicleName} ${e.licensePlate}`.toLowerCase().includes(term)
    );
    if (expense) {
      void this.router.navigate(['/expenses', expense.id]);
      return;
    }

    window.alert('No matching vehicle, trip, reservation or expense found.');
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency', currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short'
    }).format(new Date(`${date}T12:00:00`));
  }
}
