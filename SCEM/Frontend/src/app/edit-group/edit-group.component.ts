import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  Group,
  GroupService
} from '../../services/group.service';

import {
  VehicleService
} from '../../services/vehicle.service';

@Component({
  selector: 'app-edit-group',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './edit-group.component.html',
  styleUrls: ['./edit-group.component.css']
})
export class EditGroupComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly groupService = inject(GroupService);
  private readonly vehicleService = inject(VehicleService);

  group?: Group;

  groupName = '';
  owner = '';
  description = '';
  membersText = '';

  selectedVehicles: string[] = [];

  errorMessage = '';
  isSaving = false;

  // =========================================
  // Fahrzeuge anzeigen
  // =========================================

  get vehicles() {
    return this.vehicleService.vehicles;
  }

  get previewMembers(): string[] {
    return this.parseMembers();
  }

  get selectedVehicleObjects() {
    return this.vehicles.filter(
      vehicle => this.isVehicleSelected(vehicle.licensePlate)
    );
  }

  // =========================================
  // Gruppe laden
  // =========================================

  ngOnInit(): void {

    const groupId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.group = this.groupService.findGroup(groupId);

    if (!this.group) {
      this.errorMessage = 'Group not found.';
      return;
    }

    this.groupName = this.group.name;
    this.owner = this.group.owner;
    this.description = this.group.description;

    this.membersText = this.group.members.join(', ');

    this.selectedVehicles = [
      ...this.group.vehicleLicensePlates
    ];
  }

  // =========================================
  // Fahrzeugauswahl überprüfen
  // =========================================

  isVehicleSelected(licensePlate: string): boolean {

    return this.selectedVehicles.some(
      plate =>
        plate.toLowerCase() === licensePlate.toLowerCase()
    );
  }

  // =========================================
  // Fahrzeug auswählen / entfernen
  // =========================================

  toggleVehicle(
    licensePlate: string,
    checked: boolean
  ): void {

    if (checked) {

      if (!this.isVehicleSelected(licensePlate)) {
        this.selectedVehicles.push(licensePlate);
      }

    } else {

      this.selectedVehicles = this.selectedVehicles.filter(
        plate =>
          plate.toLowerCase() !== licensePlate.toLowerCase()
      );
    }
  }

  // =========================================
  // Mitglieder für die Vorschau
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
  // Fahrzeugzuordnung in SQLite speichern
  // =========================================

  async saveChanges(): Promise<void> {

    if (this.isSaving) {
      return;
    }

    const group = this.group;

    if (!group) {
      this.errorMessage = 'Group not found.';
      return;
    }

    this.errorMessage = '';
    this.isSaving = true;

    try {

      await this.groupService.assignVehiclesInBackend(
        group,
        this.selectedVehicles
      );

      console.log(
        'Group vehicles saved successfully:',
        group
      );

      await this.router.navigate([
        '/groups',
        group.id
      ]);

    } catch (error) {

      console.error(
        'Error saving group vehicles:',
        error
      );

      this.errorMessage =
        'Could not save vehicle assignments. Please try again.';

    } finally {

      this.isSaving = false;
    }
  }

  // =========================================
  // Initialen anzeigen
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