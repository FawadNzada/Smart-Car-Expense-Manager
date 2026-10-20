import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { GroupService } from '../../services/group.service';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-group-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.css']
})
export class GroupDetailsComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly groupService = inject(GroupService);
  private readonly vehicleService = inject(VehicleService);

  showDeleteModal = false;

  isDeleting = false;
  errorMessage = '';

  // =========================================
  // GRUPPE LADEN
  // =========================================

  get group() {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    return this.groupService.findGroup(id);
  }

  // =========================================
  // ZUGEORDNETE FAHRZEUGE
  // =========================================

  get assignedVehicles() {

    const group = this.group;

    if (!group) {
      return [];
    }

    return this.vehicleService.vehicles.filter(
      vehicle =>
        group.vehicleLicensePlates.some(
          plate =>
            plate.toLowerCase() ===
            vehicle.licensePlate.toLowerCase()
        )
    );
  }

  // =========================================
  // NEU: GRUPPE DAUERHAFT LÖSCHEN
  // =========================================

  async deleteGroup(): Promise<void> {

    if (this.isDeleting) {
      return;
    }

    const group = this.group;

    if (!group) {
      this.errorMessage = 'Group not found.';
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    try {

      // Gruppe über Backend aus SQLite löschen
      await this.groupService.deleteGroupInBackend(
        group
      );

      console.log(
        'Group deleted successfully:',
        group.id
      );

      this.showDeleteModal = false;

      // Zur Gruppenübersicht zurückkehren
      await this.router.navigate(['/groups']);

    } catch (error) {

      console.error(
        'Error deleting group:',
        error
      );

      this.errorMessage =
        'Could not delete group. Please try again.';

      alert(this.errorMessage);

    } finally {

      this.isDeleting = false;
    }
  }

  // =========================================
  // INITIALEN ANZEIGEN
  // =========================================

  initials(name: string): string {

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
}