import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Reservation,
  ReservationService
} from '../../services/reservation.service';

type ReservationFilter =
  | 'All'
  | 'Upcoming'
  | 'Past'
  | 'Completed'
  | 'Cancelled';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.css']
})
export class ReservationsComponent {
  private readonly reservationService = inject(ReservationService);

  readonly filters: ReservationFilter[] = [
    'All',
    'Upcoming',
    'Past',
    'Completed',
    'Cancelled'
  ];

  activeFilter: ReservationFilter = 'All';
  searchTerm = '';
  sortNewestFirst = false;

  get totalReservations(): number {
    return this.reservationService.reservations.length;
  }

  get filteredReservations(): Reservation[] {
    const search = this.searchTerm.trim().toLocaleLowerCase();
    const list = this.reservationService.reservations.filter(reservation => {
      if (!this.matchesFilter(reservation)) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [
        reservation.vehicleName,
        reservation.licensePlate,
        reservation.driver,
        reservation.notes
      ]
        .filter(value => !!value)
        .join(' ')
        .toLocaleLowerCase();

      return searchableText.includes(search);
    });

    list.sort((first, second) => {
      const firstDateTime = `${first.date}T${first.startTime}`;
      const secondDateTime = `${second.date}T${second.startTime}`;
      const comparison = firstDateTime.localeCompare(secondDateTime);
      return this.sortNewestFirst ? -comparison : comparison;
    });

    return list;
  }

  setFilter(filter: ReservationFilter): void {
    this.activeFilter = filter;
  }

  tabClass(filter: ReservationFilter): string {
    return this.activeFilter === filter ? 'tab-btn active' : 'tab-btn';
  }

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  toggleSort(): void {
    this.sortNewestFirst = !this.sortNewestFirst;
  }

  displayStatus(reservation: Reservation): string {
    if (
      reservation.status === 'Cancelled' ||
      reservation.status === 'Completed'
    ) {
      return reservation.status;
    }

    if (this.isPast(reservation)) {
      return 'Past';
    }

    return reservation.status;
  }

  statusClass(reservation: Reservation): string {
    return this.displayStatus(reservation).toLowerCase().replace(/\s+/g, '-');
  }

  duration(reservation: Reservation): string {
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const minutes = toMinutes(reservation.endTime) - toMinutes(reservation.startTime);
    if (minutes <= 0 || !Number.isFinite(minutes)) {
      return '-';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes
      ? `${hours} h ${remainingMinutes} min`
      : `${hours} h`;
  }

  dateLong(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(`${date}T12:00:00`));
  }

  private matchesFilter(reservation: Reservation): boolean {
    switch (this.activeFilter) {
      case 'Upcoming':
        return !this.isFinal(reservation) && !this.isPast(reservation);
      case 'Past':
        return !this.isFinal(reservation) && this.isPast(reservation);
      case 'Completed':
        return reservation.status === 'Completed';
      case 'Cancelled':
        return reservation.status === 'Cancelled';
      default:
        return true;
    }
  }

  private isFinal(reservation: Reservation): boolean {
    return reservation.status === 'Completed' || reservation.status === 'Cancelled';
  }

  // Vergleicht in lokaler Zeit statt in UTC: wichtig kurz nach Mitternacht.
  private isPast(reservation: Reservation): boolean {
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
    const currentTime = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0')
    ].join(':');

    return `${reservation.date}T${reservation.endTime}` < `${today}T${currentTime}`;
  }
}
