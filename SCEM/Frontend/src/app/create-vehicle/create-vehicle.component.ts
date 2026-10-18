import {
  Component,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  Vehicle,
  VehicleService
} from '../../services/vehicle.service';


@Component({
  selector: 'app-create-vehicle',
  standalone: true,

  imports: [
    FormsModule,
    RouterLink
  ],

  templateUrl:
    './create-vehicle.component.html',

  styleUrls: [
    './create-vehicle.component.css'
  ]
})
export class CreateVehicleComponent {

  private readonly router =
    inject(Router);

  private readonly vehicleService =
    inject(VehicleService);


  brand = '';

  model = '';

  licensePlate = '';

  fuelLevel = 50;

  status = 'Available';

  errorMessage = '';

  isSaving = false;


  // =========================================
  // Neues Fahrzeug erstellen
  // =========================================

  async addVehicle(): Promise<void> {

    this.errorMessage = '';

    if (this.isSaving) {
      return;
    }


    const cleanBrand =
      this.brand.trim();

    const cleanModel =
      this.model.trim();

    const cleanLicensePlate =
      this.licensePlate.trim();


    // =========================================
    // Eingaben überprüfen
    // =========================================

    if (
      !cleanBrand ||
      !cleanModel ||
      !cleanLicensePlate
    ) {

      this.errorMessage =
        'Brand, model and license plate are required.';

      return;
    }


    if (
      !Number.isFinite(this.fuelLevel) ||
      this.fuelLevel < 0 ||
      this.fuelLevel > 100
    ) {

      this.errorMessage =
        'Fuel level must be between 0 and 100.';

      return;
    }


    if (
      this.vehicleService.licensePlateExists(
        cleanLicensePlate
      )
    ) {

      this.errorMessage =
        'This license plate already exists.';

      return;
    }


    // =========================================
    // Fahrzeugdaten vorbereiten
    // =========================================

    const vehicle: Vehicle = {

      brand:
        cleanBrand,

      model:
        cleanModel,

      name:
        `${cleanBrand} ${cleanModel}`,

      licensePlate:
        cleanLicensePlate,

      fuelLevel:
        this.fuelLevel,

      status:
        this.status,

      statusClass:
        this.getStatusClass(this.status),

      image:
        this.getVehicleImage()
    };


    // =========================================
    // Fahrzeug im Backend speichern
    // =========================================

    this.isSaving = true;

    try {

      const createdVehicle =
        await this.vehicleService.addVehicle(
          vehicle
        );


      console.log(
        'Vehicle saved successfully:',
        createdVehicle
      );


      // =========================================
      // Nach erfolgreicher Speicherung
      // Fahrzeugdetailseite öffnen
      // =========================================

      await this.router.navigate([
        '/vehicles',
        createdVehicle.licensePlate
      ]);

    } catch (error) {

      console.error(
        'Error creating vehicle:',
        error
      );

      this.errorMessage =
        'Could not save vehicle. Please try again.';

    } finally {

      this.isSaving = false;

    }
  }


  // =========================================
  // Fahrzeugstatus
  // =========================================

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'Available':
        return 'available';

      case 'In Use':
        return 'in-use';

      case 'Reserved':
        return 'reserved';

      case 'Unavailable':
        return 'unavailable';

      default:
        return 'available';
    }
  }


  // =========================================
  // Fahrzeugbilder automatisch auswählen
  // =========================================

  getVehicleImage(): string {

    const value =
      this.brand
        .trim()
        .toLowerCase();


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
  // Prüfen, ob ein Fahrzeugbild existiert
  // =========================================

  hasVehicleImage(): boolean {

    return !!this.getVehicleImage();

  }
}