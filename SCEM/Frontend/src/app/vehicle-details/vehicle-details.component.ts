import { Component, inject } from '@angular/core';
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
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './vehicle-details.component.html',
  styleUrls: ['./vehicle-details.component.css']
})
export class VehicleDetailsComponent {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly vehicleService =
    inject(VehicleService);


  showDeleteConfirmation = false;


  get licensePlate(): string {
    return (
      this.route.snapshot.paramMap.get('licensePlate')
      ?? ''
    );
  }


  get vehicle(): Vehicle | undefined {
    return this.vehicleService.findVehicle(
      this.licensePlate
    );
  }


  showDelete(): void {
    this.showDeleteConfirmation = true;
  }


  cancelDelete(): void {
    this.showDeleteConfirmation = false;
  }


  deleteVehicle(): void {

    if (!this.vehicle) {
      return;
    }


    this.vehicleService.deleteVehicle(
      this.vehicle
    );


    this.router.navigate(
      ['/vehicles']
    );
  }
}