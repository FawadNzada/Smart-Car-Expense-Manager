import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VehicleService } from '../../services/vehicle.service';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './create-reservation.component.html',
  styleUrls: ['./create-reservation.component.css']
})
export class CreateReservationComponent {
  private readonly vehicleService = inject(VehicleService);
  private readonly reservationService = inject(ReservationService);
  private readonly router = inject(Router);

  selectedLicensePlate = '';
  driver = '';
  reservationDate = new Date().toISOString().slice(0, 10);
  startTime = '09:00';
  endTime = '10:00';
  notes = '';
  errorMessage = '';

  get vehicles() { return this.vehicleService.vehicles; }
  get selectedVehicle() { return this.vehicleService.findVehicle(this.selectedLicensePlate); }

  saveReservation(): void {
    this.errorMessage = '';
    const vehicle = this.selectedVehicle;
    if (!vehicle) return void (this.errorMessage = 'Please select a vehicle.');
    if (!this.driver.trim()) return void (this.errorMessage = 'Please enter a driver.');
    if (this.reservationDate < new Date().toISOString().slice(0, 10)) return void (this.errorMessage = 'Reservation date cannot be in the past.');
    if (this.endTime <= this.startTime) return void (this.errorMessage = 'End time must be after start time.');
    if (this.reservationService.hasConflict(vehicle.licensePlate, this.reservationDate, this.startTime, this.endTime)) {
      return void (this.errorMessage = 'This vehicle is already reserved during this time.');
    }

    this.reservationService.addReservation({
      vehicleName: vehicle.name,
      licensePlate: vehicle.licensePlate,
      vehicleImage: vehicle.image,
      driver: this.driver.trim(),
      date: this.reservationDate,
      startTime: this.startTime,
      endTime: this.endTime,
      status: 'Planned',
      notes: this.notes.trim()
    });
    this.router.navigate(['/reservations']);
  }

  durationText(): string {
    if (this.endTime <= this.startTime) return '-';
    const mins = this.toMinutes(this.endTime) - this.toMinutes(this.startTime);
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  private toMinutes(time: string): number { const [h, m] = time.split(':').map(Number); return h * 60 + m; }
}
