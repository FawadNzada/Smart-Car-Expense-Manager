import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  GroupMember,
  GroupService
} from '../../services/group.service';

import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-group-details',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.css']
})
export class GroupDetailsComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly groupService = inject(GroupService);
  private readonly vehicleService = inject(VehicleService);

  // =========================================
  // GRUPPE LÖSCHEN
  // =========================================

  showDeleteModal = false;
  isDeleting = false;
  errorMessage = '';

  // =========================================
  // MITGLIEDER VERWALTEN
  // =========================================

  showAddMemberForm = false;

  memberEmail = '';

  isAddingMember = false;
  isRemovingMember = false;

  memberToRemove: GroupMember | null = null;

  memberErrorMessage = '';
  memberSuccessMessage = '';

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
  // GRUPPENMITGLIEDER
  // =========================================

  get members(): GroupMember[] {

    return this.group?.memberDetails ?? [];
  }

  get memberCount(): number {

    return this.members.length;
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
  // MITGLIEDERNAMEN ANZEIGEN
  // =========================================

  memberName(member: GroupMember): string {

    const name = [
      member.firstName,
      member.lastName
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return name || member.email;
  }

  // =========================================
  // FORMULAR ÖFFNEN
  // =========================================

  openAddMemberForm(): void {

    this.showAddMemberForm = true;

    this.memberEmail = '';
    this.memberErrorMessage = '';
    this.memberSuccessMessage = '';
  }

  // =========================================
  // FORMULAR SCHLIESSEN
  // =========================================

  closeAddMemberForm(): void {

    if (this.isAddingMember) {
      return;
    }

    this.showAddMemberForm = false;
    this.memberEmail = '';
    this.memberErrorMessage = '';
  }

  // =========================================
  // MITGLIED HINZUFÜGEN
  // =========================================

  async addMember(): Promise<void> {

    if (this.isAddingMember) {
      return;
    }

    const group = this.group;

    if (!group) {
      return;
    }

    this.memberErrorMessage = '';
    this.memberSuccessMessage = '';

    const email = this.memberEmail.trim();

    if (!email) {

      this.memberErrorMessage =
        'Please enter an email address.';

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

      this.memberErrorMessage =
        'Please enter a valid email address.';

      return;
    }

    this.isAddingMember = true;

    try {

      await this.groupService.addMemberInBackend(
        group,
        email
      );

      this.memberEmail = '';
      this.showAddMemberForm = false;

      this.memberSuccessMessage =
        'Member added successfully.';

    } catch (error) {

      console.error(
        'Error adding member:',
        error
      );

      if (error instanceof HttpErrorResponse) {

        if (error.status === 404) {

          this.memberErrorMessage =
            'This user does not have an SCEM account yet.';

        } else if (error.status === 409) {

          this.memberErrorMessage =
            'This user is already a member or the group owner.';

        } else if (error.status === 401) {

          this.memberErrorMessage =
            'Your session has expired. Please log in again.';

        } else {

          this.memberErrorMessage =
            'Could not add member. Please try again.';
        }

      } else {

        this.memberErrorMessage =
          'Could not add member. Please try again.';
      }

    } finally {

      this.isAddingMember = false;
    }
  }

  // =========================================
  // MITGLIED ENTFERNEN - BESTÄTIGUNG ÖFFNEN
  // =========================================

  requestRemoveMember(member: GroupMember): void {

    this.memberToRemove = member;

    this.memberErrorMessage = '';
    this.memberSuccessMessage = '';
  }

  // =========================================
  // MITGLIED ENTFERNEN - ABBRECHEN
  // =========================================

  cancelRemoveMember(): void {

    if (this.isRemovingMember) {
      return;
    }

    this.memberToRemove = null;
  }

  // =========================================
  // MITGLIED DAUERHAFT ENTFERNEN
  // =========================================

  async confirmRemoveMember(): Promise<void> {

    if (this.isRemovingMember) {
      return;
    }

    const group = this.group;
    const member = this.memberToRemove;

    if (!group || !member) {
      return;
    }

    this.isRemovingMember = true;

    this.memberErrorMessage = '';
    this.memberSuccessMessage = '';

    try {

      await this.groupService.removeMemberInBackend(
        group,
        member.userId
      );

      this.memberToRemove = null;

      this.memberSuccessMessage =
        'Member removed successfully.';

    } catch (error) {

      console.error(
        'Error removing member:',
        error
      );

      this.memberErrorMessage =
        'Could not remove member. Please try again.';

      this.memberToRemove = null;

    } finally {

      this.isRemovingMember = false;
    }
  }

  // =========================================
  // GRUPPE DAUERHAFT LÖSCHEN
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

      await this.groupService.deleteGroupInBackend(
        group
      );

      this.showDeleteModal = false;

      await this.router.navigate([
        '/groups'
      ]);

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

      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
}