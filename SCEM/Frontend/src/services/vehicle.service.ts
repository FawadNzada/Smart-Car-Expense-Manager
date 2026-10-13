import { Injectable } from '@angular/core';

export interface Vehicle {
  brand: string;
  model: string;
  name: string;
  licensePlate: string;
  fuelLevel: number;
  status: string;
  statusClass: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  private readonly vehicleList: Vehicle[] = [
    {
      brand: 'Volkswagen',
      model: 'Golf',
      name: 'Volkswagen Golf',
      licensePlate: 'L-123AB',
      fuelLevel: 75,
      status: 'Available',
      statusClass: 'available',
      image: 'images/vehicles/vw.png'
    },
    {
      brand: 'BMW',
      model: '3 Series',
      name: 'BMW 3 Series',
      licensePlate: 'L-456CD',
      fuelLevel: 40,
      status: 'In Use',
      statusClass: 'in-use',
      image: 'images/vehicles/bmw.png'
    },
    {
      brand: 'Audi',
      model: 'A4',
      name: 'Audi A4',
      licensePlate: 'L-789EF',
      fuelLevel: 30,
      status: 'Reserved',
      statusClass: 'reserved',
      image: 'images/vehicles/audi.png'
    },
    {
      brand: 'Mercedes',
      model: 'C-Class',
      name: 'Mercedes C-Class',
      licensePlate: 'L-321GH',
      fuelLevel: 20,
      status: 'Unavailable',
      statusClass: 'unavailable',
      image: 'images/vehicles/mercedes.png'
    }
  ];


  get vehicles(): Vehicle[] {
    return this.vehicleList;
  }


  addVehicle(vehicle: Vehicle): void {
    this.vehicleList.push(vehicle);
  }


  findVehicle(
    licensePlate: string
  ): Vehicle | undefined {

    return this.vehicleList.find(
      vehicle =>
        vehicle.licensePlate.toLowerCase()
        ===
        licensePlate.toLowerCase()
    );
  }


  licensePlateExists(
    licensePlate: string,
    ignoreVehicle?: Vehicle
  ): boolean {

    return this.vehicleList.some(
      vehicle =>
        vehicle !== ignoreVehicle
        &&
        vehicle.licensePlate.toLowerCase()
        ===
        licensePlate.toLowerCase()
    );
  }


  updateVehicle(
    vehicle: Vehicle,
    updatedVehicle: Vehicle
  ): void {

    vehicle.brand =
      updatedVehicle.brand;

    vehicle.model =
      updatedVehicle.model;

    vehicle.name =
      updatedVehicle.name;

    vehicle.licensePlate =
      updatedVehicle.licensePlate;

    vehicle.fuelLevel =
      updatedVehicle.fuelLevel;

    vehicle.status =
      updatedVehicle.status;

    vehicle.statusClass =
      updatedVehicle.statusClass;

    vehicle.image =
      updatedVehicle.image;
  }


  deleteVehicle(
    vehicle: Vehicle
  ): void {

    const index =
      this.vehicleList.indexOf(vehicle);

    if (index >= 0) {
      this.vehicleList.splice(index, 1);
    }
  }
}