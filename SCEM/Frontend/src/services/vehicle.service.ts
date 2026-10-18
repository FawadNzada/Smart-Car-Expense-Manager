import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Vehicle {
  id?: number;
  brand: string;
  model: string;
  name: string;
  licensePlate: string;
  fuelLevel: number;
  status: string;
  statusClass: string;
  image: string;
}

interface BackendVehicle {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  fuelLevel: number;
  status: string;
  image: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5123/Vehicle';

  private readonly vehicleList: Vehicle[] = [];

  constructor() {
    this.loadVehicles();
  }


  // =========================================
  // GET - Alle Fahrzeuge aus SQLite laden
  // =========================================

  loadVehicles(): void {

    this.http.get<BackendVehicle[]>(this.apiUrl)
      .subscribe({

        next: (vehicles) => {

          const mappedVehicles = vehicles.map(
            vehicle => this.mapVehicle(vehicle)
          );

          this.vehicleList.splice(
            0,
            this.vehicleList.length,
            ...mappedVehicles
          );

          console.log(
            'Vehicles loaded from backend:',
            mappedVehicles
          );
        },

        error: (error) => {

          console.error(
            'Error loading vehicles from backend:',
            error
          );
        }
      });
  }


  get vehicles(): Vehicle[] {
    return this.vehicleList;
  }


  // =========================================
  // Backend-Fahrzeug in Frontend umwandeln
  // =========================================

  private mapVehicle(
    vehicle: BackendVehicle
  ): Vehicle {

    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      name: `${vehicle.brand} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
      fuelLevel: vehicle.fuelLevel,
      status: vehicle.status,
      statusClass: this.getStatusClass(vehicle.status),
      image: vehicle.image ||
        this.getVehicleImage(vehicle.brand)
    };
  }


  // =========================================
  // Fahrzeugstatus
  // =========================================

  private getStatusClass(status: string): string {

    switch (status.toLowerCase()) {

      case 'available':
        return 'available';

      case 'in use':
        return 'in-use';

      case 'reserved':
        return 'reserved';

      case 'unavailable':
        return 'unavailable';

      default:
        return 'available';
    }
  }


  // =========================================
  // Fahrzeugbilder
  // =========================================

  private getVehicleImage(brand: string): string {

    const value = brand.trim().toLowerCase();

    if (value.includes('bmw')) {
      return 'images/vehicles/bmw.png';
    }

    if (value.includes('audi')) {
      return 'images/vehicles/audi.png';
    }

    if (
      value.includes('mercedes') ||
      value.includes('benz')
    ) {
      return 'images/vehicles/mercedes.png';
    }

    if (
      value.includes('volkswagen') ||
      value.includes('vw')
    ) {
      return 'images/vehicles/vw.png';
    }

    return '';
  }


  // =========================================
  // POST - Neues Fahrzeug in SQLite speichern
  // =========================================

  async addVehicle(vehicle: Vehicle): Promise<Vehicle> {

    const payload = {
      brand: vehicle.brand,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      fuelLevel: vehicle.fuelLevel,
      status: vehicle.status,
      image: vehicle.image || null
    };

    // Neues Fahrzeug an das Backend senden

    const createdVehicle = await firstValueFrom(
      this.http.post<BackendVehicle>(
        this.apiUrl,
        payload
      )
    );

    // Antwort des Backends umwandeln

    const mappedVehicle =
      this.mapVehicle(createdVehicle);

    // Erst nach erfolgreicher Speicherung
    // zur lokalen Liste hinzufügen

    this.vehicleList.push(mappedVehicle);

    console.log(
      'Vehicle created successfully:',
      mappedVehicle
    );

    return mappedVehicle;
  }


  // =========================================
  // Fahrzeug anhand Kennzeichen finden
  // =========================================

  findVehicle(
    licensePlate: string
  ): Vehicle | undefined {

    return this.vehicleList.find(
      vehicle =>
        vehicle.licensePlate.toLowerCase() ===
        licensePlate.toLowerCase()
    );
  }


  // =========================================
  // Doppelte Kennzeichen verhindern
  // =========================================

  licensePlateExists(
    licensePlate: string,
    ignoreVehicle?: Vehicle
  ): boolean {

    return this.vehicleList.some(
      vehicle =>
        vehicle !== ignoreVehicle &&
        vehicle.licensePlate.toLowerCase() ===
        licensePlate.toLowerCase()
    );
  }


  // =========================================
  // PUT - Fahrzeug dauerhaft bearbeiten
  // =========================================

  async updateVehicle(
    vehicle: Vehicle,
    updatedVehicle: Vehicle
  ): Promise<void> {

    if (vehicle.id === undefined) {

      throw new Error(
        'Vehicle has no database ID.'
      );
    }

    const id = vehicle.id;

    const payload = {
      brand: updatedVehicle.brand,
      model: updatedVehicle.model,
      licensePlate: updatedVehicle.licensePlate,
      fuelLevel: updatedVehicle.fuelLevel,
      status: updatedVehicle.status,
      image: updatedVehicle.image || null
    };

    // Änderungen an das Backend senden

    await firstValueFrom(
      this.http.put<void>(
        `${this.apiUrl}/${id}`,
        payload
      )
    );

    // Nach erfolgreicher Speicherung
    // lokale Daten aktualisieren

    Object.assign(
      vehicle,
      updatedVehicle,
      { id }
    );

    console.log(
      'Vehicle updated successfully:',
      vehicle
    );
  }


  // =========================================
  // DELETE - Vorübergehend nur lokal
  // =========================================

  deleteVehicle(vehicle: Vehicle): void {

    const index =
      this.vehicleList.indexOf(vehicle);

    if (index >= 0) {

      this.vehicleList.splice(index, 1);
    }
  }
}