import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

export interface CreateReservationInput {
  licensePlate: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5123/Reservation';

  readonly reservations: Reservation[] = [];

  private nextLocalId = -1;

  constructor() {
    this.loadReservations();
  }

  // =========================================
  // GET - RESERVIERUNGEN AUS SQLITE LADEN
  // =========================================

  loadReservations(): void {

    this.http.get<Reservation[]>(this.apiUrl)
      .subscribe({

        next: (reservations) => {

          this.reservations.splice(
            0,
            this.reservations.length,
            ...reservations
          );

          console.log(
            'Reservations loaded from SQLite:',
            reservations
          );
        },

        error: (error) => {

          console.error(
            'Error loading reservations:',
            error
          );
        }

      });
  }

  // =========================================
  // POST - RESERVIERUNG ERSTELLEN
  // =========================================

  async createReservationInBackend(
    input: CreateReservationInput
  ): Promise<Reservation> {

    const payload = {
      licensePlate: input.licensePlate.trim(),
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes.trim()
    };

    const created = await firstValueFrom(
      this.http.post<Reservation>(
        this.apiUrl,
        payload
      )
    );

    // Erst nach erfolgreicher API-Antwort
    // zur Reservierungsliste hinzufügen.

    this.reservations.push(created);

    console.log(
      'Reservation created in SQLite:',
      created
    );

    return created;
  }

  // =========================================
  // PUT - RESERVIERUNG BEARBEITEN
  // =========================================

  async updateReservationInBackend(
    reservation: Reservation
  ): Promise<void> {

    const payload = {
      licensePlate: reservation.licensePlate,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status,
      notes: reservation.notes
    };

    await firstValueFrom(
      this.http.put<void>(
        `${this.apiUrl}/${reservation.id}`,
        payload
      )
    );

    console.log(
      'Reservation updated:',
      reservation.id
    );
  }

  // =========================================
  // DELETE - RESERVIERUNG STORNIEREN
  // =========================================

  async cancelReservationInBackend(
    reservation: Reservation
  ): Promise<void> {

    await firstValueFrom(
      this.http.delete<void>(
        `${this.apiUrl}/${reservation.id}`
      )
    );

    reservation.status = 'Cancelled';

    console.log(
      'Reservation cancelled:',
      reservation.id
    );
  }

  // =========================================
  // RESERVIERUNG SUCHEN
  // =========================================

  findReservation(
    id: number
  ): Reservation | undefined {

    return this.reservations.find(
      reservation => reservation.id === id
    );
  }

  // =========================================
  // LOKALE KONFLIKTPRÜFUNG
  // =========================================

  hasConflict(
    licensePlate: string,
    date: string,
    startTime: string,
    endTime: string,
    ignoreReservationId?: number
  ): boolean {

    return this.reservations.some(
      reservation =>

        reservation.id !== ignoreReservationId &&

        reservation.status !== 'Cancelled' &&

        reservation.status !== 'Completed' &&

        reservation.licensePlate.toLowerCase() ===
          licensePlate.toLowerCase() &&

        reservation.date === date &&

        startTime < reservation.endTime &&

        endTime > reservation.startTime
    );
  }

  // =========================================
  // ALTE LOKALE FUNKTIONEN
  // BLEIBEN VORERST FÜR ANDERE SEITEN
  // =========================================

  addReservation(
    reservation: Omit<Reservation, 'id'>
  ): Reservation {

    const created: Reservation = {
      ...reservation,
      id: this.nextLocalId--
    };

    this.reservations.push(created);

    return created;
  }

  deleteReservation(
    reservation: Reservation
  ): void {

    const index = this.reservations.indexOf(
      reservation
    );

    if (index >= 0) {
      this.reservations.splice(index, 1);
    }
  }
}