import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  Vehicle,
  VehicleService
} from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent {

  private readonly vehicleService =
    inject(VehicleService);

  searchTerm = '';

  selectedStatus = 'All';


  get vehicles(): Vehicle[] {
    return this.vehicleService.vehicles;
  }


  get filteredVehicles(): Vehicle[] {

    let result =
      [...this.vehicles];


    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    if (search) {

      result =
        result.filter(vehicle =>

          vehicle.name
            .toLowerCase()
            .includes(search)

          ||

          vehicle.licensePlate
            .toLowerCase()
            .includes(search)

          ||

          vehicle.brand
            .toLowerCase()
            .includes(search)

          ||

          vehicle.model
            .toLowerCase()
            .includes(search)

        );

    }


    if (this.selectedStatus !== 'All') {

      result =
        result.filter(vehicle =>
          vehicle.status.toLowerCase()
          ===
          this.selectedStatus.toLowerCase()
        );

    }


    return result;
  }


  resetFilters(): void {

    this.searchTerm = '';

    this.selectedStatus = 'All';

  }
}