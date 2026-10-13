import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Trip, TripService } from '../../services/trip.service';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css']
})
export class TripsComponent {
  private readonly service = inject(TripService);

  searchTerm = '';
  selectedVehicle = 'All';

  get vehicleOptions(): string[] {
    return [...new Set(this.service.trips.map(t => t.vehicleName))];
  }

  get filteredTrips(): Trip[] {
    const search = this.searchTerm.trim().toLowerCase();

    return [...this.service.trips]
      .filter(t => this.selectedVehicle === 'All' || t.vehicleName === this.selectedVehicle)
      .filter(t => {
        if (!search) return true;
        return [t.vehicleName, t.licensePlate, t.driver, t.startLocation, t.destination]
          .some(value => value.toLowerCase().includes(search));
      })
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  }

  distance(t: Trip): string {
    return t.endMileage > 0 && t.endMileage >= t.startMileage
      ? `${t.endMileage - t.startMileage} km`
      : '-';
  }

  duration(t: Trip): string {
    const start = this.toMinutes(t.startTime);
    const end = this.toMinutes(t.endTime);
    if (end <= start) return '-';
    const minutes = end - start;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} min`;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }

  displayDate(date: string): string {
    const target = new Date(`${date}T12:00:00`);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diff = Math.round((today.getTime() - target.getTime()) / 86400000);

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff > 1 && diff <= 6) return `${diff} Days Ago`;

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(target);
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
