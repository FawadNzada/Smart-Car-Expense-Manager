import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  Vehicle,
  VehicleService
} from '../../services/vehicle.service';


@Component({
  selector: 'app-edit-vehicle',
  standalone: true,

  imports: [
    FormsModule,
    RouterLink
  ],

  templateUrl:
    './edit-vehicle.component.html',

  styleUrls: [
    './edit-vehicle.component.css'
  ]
})
export class EditVehicleComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly vehicleService =
    inject(VehicleService);


  vehicle?: Vehicle;


  originalLicensePlate = '';

  brand = '';

  model = '';

  licensePlate = '';

  fuelLevel = 0;

  status = 'Available';

  errorMessage = '';


  ngOnInit(): void {

    this.originalLicensePlate =
      this.route.snapshot.paramMap.get(
        'licensePlate'
      ) ?? '';


    this.vehicle =
      this.vehicleService.findVehicle(
        this.originalLicensePlate
      );


    if (!this.vehicle) {
      return;
    }


    this.brand =
      this.vehicle.brand;

    this.model =
      this.vehicle.model;

    this.licensePlate =
      this.vehicle.licensePlate;

    this.fuelLevel =
      this.vehicle.fuelLevel;

    this.status =
      this.vehicle.status;
  }


  saveChanges(): void {

    this.errorMessage = '';


    if (!this.vehicle) {
      return;
    }


    if (
      !this.brand.trim()
      ||
      !this.model.trim()
      ||
      !this.licensePlate.trim()
    ) {

      this.errorMessage =
        'Brand, model and license plate are required.';

      return;
    }


    if (
      this.fuelLevel < 0
      ||
      this.fuelLevel > 100
    ) {

      this.errorMessage =
        'Fuel level must be between 0 and 100.';

      return;
    }


    if (
      this.vehicleService
        .licensePlateExists(
          this.licensePlate.trim(),
          this.vehicle
        )
    ) {

      this.errorMessage =
        'This license plate already exists.';

      return;
    }


    const updatedVehicle: Vehicle = {

      brand:
        this.brand.trim(),

      model:
        this.model.trim(),

      name:
        `${this.brand.trim()} ${this.model.trim()}`,

      licensePlate:
        this.licensePlate.trim(),

      fuelLevel:
        this.fuelLevel,

      status:
        this.status,

      statusClass:
        this.getStatusClass(
          this.status
        ),

      image:
        this.getVehicleImage()

    };


    this.vehicleService.updateVehicle(
      this.vehicle,
      updatedVehicle
    );


    this.router.navigate([
      '/vehicles',
      updatedVehicle.licensePlate
    ]);
  }


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
      value.includes('mercedes')
      ||
      value.includes('benz')
    ) {

      return 'images/vehicles/mercedes.png';
    }


    if (
      value.includes('volkswagen')
      ||
      value.includes('vw')
    ) {

      return 'images/vehicles/vw.png';
    }


    return '';
  }
}