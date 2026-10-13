import { Injectable } from '@angular/core';

export interface Reservation {
  id: number;
  vehicleName: string;
  licensePlate: string;
  vehicleImage: string;
  driver: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
}

function dateOffset(days = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private nextId = 4;

  readonly reservations: Reservation[] = [
    { id: 1, vehicleName: 'Volkswagen Golf', licensePlate: 'L-123AB', vehicleImage: 'images/vehicles/vw.png', driver: 'Sebastian', date: dateOffset(0), startTime: '15:00', endTime: '18:00', status: 'Upcoming', notes: 'Afternoon reservation.' },
    { id: 2, vehicleName: 'BMW 3 Series', licensePlate: 'L-456CD', vehicleImage: 'images/vehicles/bmw.png', driver: 'Lisa', date: dateOffset(1), startTime: '09:00', endTime: '12:00', status: 'Planned', notes: '' },
    { id: 3, vehicleName: 'Audi A4', licensePlate: 'L-789EF', vehicleImage: 'images/vehicles/audi.png', driver: 'Max', date: dateOffset(3), startTime: '10:00', endTime: '14:00', status: 'Planned', notes: '' }
  ];

  addReservation(reservation: Omit<Reservation, 'id'>): Reservation {
    const created = { ...reservation, id: this.nextId++ };
    this.reservations.push(created);
    return created;
  }

  findReservation(id: number): Reservation | undefined {
    return this.reservations.find(r => r.id === id);
  }

  deleteReservation(reservation: Reservation): void {
    const index = this.reservations.indexOf(reservation);
    if (index >= 0) this.reservations.splice(index, 1);
  }

  hasConflict(licensePlate: string, date: string, startTime: string, endTime: string, ignoreReservationId?: number): boolean {
    return this.reservations.some(r =>
      r.id !== ignoreReservationId &&
      r.status !== 'Cancelled' &&
      r.status !== 'Completed' &&
      r.licensePlate.toLowerCase() === licensePlate.toLowerCase() &&
      r.date === date &&
      startTime < r.endTime &&
      endTime > r.startTime
    );
  }
}
