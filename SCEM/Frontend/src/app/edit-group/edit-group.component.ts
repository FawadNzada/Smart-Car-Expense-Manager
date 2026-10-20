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
  // FAHRZEUGE
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
  // GRUPPE LADEN
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
  // FAHRZEUGAUSWAHL
  // =========================================

  isVehicleSelected(licensePlate: string): boolean {

    return this.selectedVehicles.some(
      plate =>
        plate.toLowerCase() === licensePlate.toLowerCase()
    );
  }

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
  // MITGLIEDER-VORSCHAU
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
  // GRUPPE UND FAHRZEUGE SPEICHERN
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

    const cleanName = this.groupName.trim();
    const cleanDescription = this.description.trim();

    // =========================================
    // EINGABEN PRÜFEN
    // =========================================

    if (!cleanName) {
      this.errorMessage = 'Please enter a group name.';
      return;
    }

    if (cleanName.length > 256) {
      this.errorMessage = 'Group name is too long.';
      return;
    }

    if (cleanDescription.length > 512) {
      this.errorMessage = 'Description is too long.';
      return;
    }

    if (
      this.groupService.groupNameExists(
        cleanName,
        group
      )
    ) {
      this.errorMessage =
        'A group with this name already exists.';
      return;
    }

    this.isSaving = true;

    try {

      // =========================================
      // 1. GRUPPENNAME UND BESCHREIBUNG
      // =========================================

      await this.groupService.updateGroupInBackend(
        group,
        cleanName,
        cleanDescription
      );

      // =========================================
      // 2. FAHRZEUGZUORDNUNG
      // =========================================

      await this.groupService.assignVehiclesInBackend(
        group,
        this.selectedVehicles
      );

      console.log(
        'Group changes saved successfully:',
        group
      );

      // =========================================
      // 3. ZUR DETAILSEITE
      // =========================================

      await this.router.navigate([
        '/groups',
        group.id
      ]);

    } catch (error) {

      console.error(
        'Error saving group changes:',
        error
      );

      this.errorMessage =
        'Could not save all group changes. Please try again.';

    } finally {

      this.isSaving = false;
    }
  }

  // =========================================
  // INITIALEN
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