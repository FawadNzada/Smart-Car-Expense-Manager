import { Injectable } from '@angular/core';

export interface Trip {
  id: number;
  vehicleName: string;
  licensePlate: string;
  vehicleImage: string;
  driver: string;
  startLocation: string;
  destination: string;
  date: string;
  startTime: string;
  endTime: string;
  startMileage: number;
  endMileage: number;
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
export class TripService {
  private nextId = 5;

  readonly trips: Trip[] = [
    { id: 1, vehicleName: 'Volkswagen Golf', licensePlate: 'L-123AB', vehicleImage: 'images/vehicles/vw.png', driver: 'Sebastian', startLocation: 'Linz', destination: 'Wels', date: dateOffset(0), startTime: '14:20', endTime: '15:30', startMileage: 48216, endMileage: 48250, status: 'Completed', notes: '' },
    { id: 2, vehicleName: 'BMW 3 Series', licensePlate: 'L-456CD', vehicleImage: 'images/vehicles/bmw.png', driver: 'Lisa', startLocation: 'Linz', destination: 'Traun', date: dateOffset(-1), startTime: '09:00', endTime: '09:35', startMileage: 38120, endMileage: 38132, status: 'Completed', notes: '' },
    { id: 3, vehicleName: 'Audi A4', licensePlate: 'L-789EF', vehicleImage: 'images/vehicles/audi.png', driver: 'Max', startLocation: 'Linz', destination: 'Steyr', date: dateOffset(-2), startTime: '10:00', endTime: '10:52', startMileage: 62450, endMileage: 62478, status: 'Completed', notes: '' },
    { id: 4, vehicleName: 'Mercedes C-Class', licensePlate: 'L-321GH', vehicleImage: 'images/vehicles/mercedes.png', driver: 'Emily', startLocation: 'Linz', destination: 'Salzburg', date: '2026-09-20', startTime: '12:00', endTime: '13:42', startMileage: 71000, endMileage: 71078, status: 'Completed', notes: '' }
  ];

  addTrip(trip: Omit<Trip, 'id'>): Trip {
    const created = { ...trip, id: this.nextId++ };
    this.trips.push(created);
    return created;
  }

  findTrip(id: number): Trip | undefined {
    return this.trips.find(t => t.id === id);
  }

  deleteTrip(trip: Trip): void {
    const index = this.trips.indexOf(trip);
    if (index >= 0) this.trips.splice(index, 1);
  }
}
