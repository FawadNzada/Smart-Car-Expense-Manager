import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

interface TripApiDto extends Omit<Trip, 'endMileage'> {
  endMileage: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5123/Trip';

  readonly trips: Trip[] = [];

  private nextLocalId = -1;

  constructor() {
    this.loadTrips();
  }

  // =========================================
  // GET - FAHRTEN AUS SQLITE LADEN
  // =========================================

  loadTrips(): void {

    this.http.get<TripApiDto[]>(this.apiUrl)
      .subscribe({

        next: (data) => {

          const trips = data.map(
            trip => this.mapTrip(trip)
          );

          this.trips.splice(
            0,
            this.trips.length,
            ...trips
          );

          console.log(
            'Trips loaded from SQLite:',
            trips
          );
        },

        error: (error) => {

          console.error(
            'Error loading trips:',
            error
          );
        }

      });
  }

  // =========================================
  // POST - FAHRT ERSTELLEN
  // =========================================

  async createTripInBackend(
    trip: Omit<Trip, 'id'>
  ): Promise<Trip> {

    const payload = {
      licensePlate: trip.licensePlate,
      startLocation: trip.startLocation,
      destination: trip.destination,
      date: trip.date,
      startTime: trip.startTime,
      endTime: trip.endTime,
      startMileage: trip.startMileage,
      endMileage: trip.endMileage,
      status: trip.status,
      notes: trip.notes
    };

    const response = await firstValueFrom(
      this.http.post<TripApiDto>(
        this.apiUrl,
        payload
      )
    );

    const created = this.mapTrip(response);

    this.trips.push(created);

    return created;
  }

  // =========================================
  // PUT - FAHRT BEARBEITEN
  // =========================================

  async updateTripInBackend(
    trip: Trip
  ): Promise<void> {

    const payload = {
      licensePlate: trip.licensePlate,
      startLocation: trip.startLocation,
      destination: trip.destination,
      date: trip.date,
      startTime: trip.startTime,
      endTime: trip.endTime,
      startMileage: trip.startMileage,
      endMileage: trip.endMileage,
      status: trip.status,
      notes: trip.notes
    };

    await firstValueFrom(
      this.http.put<void>(
        `${this.apiUrl}/${trip.id}`,
        payload
      )
    );

    const existing = this.findTrip(trip.id);

    if (existing) {
      Object.assign(existing, trip);
    }
  }

  // =========================================
  // DELETE - FAHRT STORNIEREN
  // =========================================

  async cancelTripInBackend(
    trip: Trip
  ): Promise<void> {

    await firstValueFrom(
      this.http.delete<void>(
        `${this.apiUrl}/${trip.id}`
      )
    );

    trip.status = 'Cancelled';
  }

  // =========================================
  // FAHRT SUCHEN
  // =========================================

  findTrip(id: number): Trip | undefined {

    return this.trips.find(
      trip => trip.id === id
    );
  }

  // =========================================
  // API-DATEN ANGLEICHEN
  // =========================================

  private mapTrip(data: TripApiDto): Trip {

    return {
      ...data,
      endMileage:
        data.endMileage ?? data.startMileage
    };
  }

  // =========================================
  // ALTE LOKALE FUNKTIONEN
  // VORERST FÜR BESTEHENDE KOMPONENTEN
  // =========================================

  addTrip(
    trip: Omit<Trip, 'id'>
  ): Trip {

    const created: Trip = {
      ...trip,
      id: this.nextLocalId--
    };

    this.trips.push(created);

    return created;
  }

  deleteTrip(trip: Trip): void {

    const index = this.trips.indexOf(trip);

    if (index >= 0) {
      this.trips.splice(index, 1);
    }
  }
}