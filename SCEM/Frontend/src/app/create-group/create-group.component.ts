import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { GroupService } from '../../services/group.service';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.css']
})
export class CreateGroupComponent {

  private readonly groupService = inject(GroupService);
  private readonly vehicleService = inject(VehicleService);
  private readonly router = inject(Router);

  // =========================================
  // Formularfelder
  // =========================================

  groupName = '';
  owner = 'You';
  description = '';
  membersText = '';

  errorMessage = '';
  isSaving = false;

  selectedVehicles: string[] = [];

  // =========================================
  // Fahrzeuge anzeigen
  // =========================================

  get vehicles() {
    return this.vehicleService.vehicles;
  }

  get previewMembers() {
    return this.parseMembers();
  }

  get selectedVehicleObjects() {
    return this.vehicles.filter(
      vehicle => this.isVehicleSelected(vehicle.licensePlate)
    );
  }

  // =========================================
  // Fahrzeugauswahl
  // =========================================

  isVehicleSelected(licensePlate: string): boolean {

    return this.selectedVehicles.some(
      plate =>
        plate.toLowerCase() === licensePlate.toLowerCase()
    );
  }

  toggleVehicle(licensePlate: string, checked: boolean): void {

    if (checked && !this.isVehicleSelected(licensePlate)) {

      this.selectedVehicles.push(licensePlate);

    } else if (!checked) {

      this.selectedVehicles = this.selectedVehicles.filter(
        plate =>
          plate.toLowerCase() !== licensePlate.toLowerCase()
      );
    }
  }

  // =========================================
  // Mitglieder für Vorschau
  // =========================================

  parseMembers(): string[] {

    return [
      ...new Map(
        this.membersText
          .split(',')
          .map(name => name.trim())
          .filter(Boolean)
          .map(name => [name.toLowerCase(), name])
      ).values()
    ];
  }

  // =========================================
  // POST - Gruppe dauerhaft erstellen
  // =========================================

  async saveGroup(): Promise<void> {

    if (this.isSaving) {
      return;
    }

    this.errorMessage = '';

    const cleanName = this.groupName.trim();
    const cleanDescription = this.description.trim();

    // Gruppenname überprüfen

    if (!cleanName) {

      this.errorMessage = 'Please enter a group name.';
      return;
    }

    // Doppelte Namen überprüfen

    if (this.groupService.groupNameExists(cleanName)) {

      this.errorMessage =
        'A group with this name already exists.';

      return;
    }

    this.isSaving = true;

    try {

      // Gruppe in SQLite speichern

      const createdGroup =
        await this.groupService.createGroupInBackend(
          cleanName,
          cleanDescription
        );

      console.log(
        'Group created successfully:',
        createdGroup
      );

      // Gruppendetailseite öffnen

      await this.router.navigate([
        '/groups',
        createdGroup.id
      ]);

    } catch (error) {

      console.error(
        'Error creating group:',
        error
      );

      this.errorMessage =
        'Could not save group. Please try again.';

    } finally {

      this.isSaving = false;
    }
  }

  // =========================================
  // Initialen für Gruppenmitglieder
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