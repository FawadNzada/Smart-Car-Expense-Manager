import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-reservation-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reservation-details.component.html',
  styleUrls: ['./reservation-details.component.css']
})
export class ReservationDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly reservationService = inject(ReservationService);
  showCancelConfirmation = false;

  get id(): number { return Number(this.route.snapshot.paramMap.get('id')); }
  get reservation() { return this.reservationService.findReservation(this.id); }

  cancelReservation(): void {
    if (this.reservation) this.reservation.status = 'Cancelled';
    this.showCancelConfirmation = false;
  }

  displayStatus(): string {
    const r = this.reservation;
    if (!r) return '';
    if (r.status === 'Cancelled' || r.status === 'Completed') return r.status;
    if (r.date < new Date().toISOString().slice(0, 10)) return 'Past';
    return r.status;
  }

  statusClass(): string { return this.displayStatus().toLowerCase(); }

  durationText(): string {
    const r = this.reservation;
    if (!r) return '-';
    const toM = (v: string) => { const [h,m] = v.split(':').map(Number); return h*60+m; };
    const mins = toM(r.endTime)-toM(r.startTime), h=Math.floor(mins/60), m=mins%60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  dateLong(date: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(new Date(date + 'T12:00:00'));
  }

}
