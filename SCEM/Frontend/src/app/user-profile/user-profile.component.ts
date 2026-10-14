import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import Keycloak from 'keycloak-js';

import { TripService } from '../../services/trip.service';
import { ExpenseService } from '../../services/expense.service';
import { ReservationService } from '../../services/reservation.service';
import { VehicleService } from '../../services/vehicle.service';
import { Group, GroupService } from '../../services/group.service';

interface ProfileActivity {
  icon: string;
  title: string;
  subtitle: string;
  type: string;
  when: string;
  timestamp: number;
}

interface SavedProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly keycloak = inject(Keycloak);

  private readonly tripService = inject(TripService);
  private readonly expenseService = inject(ExpenseService);
  private readonly reservationService = inject(ReservationService);
  private readonly vehicleService = inject(VehicleService);
  private readonly groupService = inject(GroupService);

  private readonly profileStorageKey = 'scem-profile';
  private readonly notificationStorageKey = 'scem-notifications';
  private readonly darkModeStorageKey = 'scem-dark-mode';

  /*
   * Stable demo identity.
   * Editing the visible full name must not break
   * Trip / Expense / Reservation matching.
   */
  private activityIdentity = 'Sebastian';


  /* =========================
     PROFILE
     ========================= */

  name = 'Sebastian Junior';
  email = 'sebastian@email.com';
  phone = '+43 660 1234567';
  role = 'Group Member';
  memberSince = '12 Jan 2026';


  /* =========================
     EDIT FORM
     ========================= */

  editName = '';
  editEmail = '';
  editPhone = '';
  editRole = '';


  /* =========================
     UI STATE
     ========================= */

  editMode = false;
  errorMessage = '';

  notificationsEnabled = true;
  darkModeEnabled = true;

  showLeaveGroupModal = false;


  /* =========================
     INIT
     ========================= */

  async ngOnInit(): Promise<void> {

    try {

      if (this.keycloak?.authenticated) {

        const profile =
          await this.keycloak.loadUserProfile();

        if (profile.firstName) {

          this.activityIdentity =
            profile.firstName.trim();
        }

        const loadedName =
          `${profile.firstName || ''} ${profile.lastName || ''}`.trim();

        if (loadedName) {

          this.name =
            loadedName;
        }

        if (profile.email) {

          this.email =
            profile.email;
        }
      }

    } catch {

      // Demo profile stays active if Keycloak data is unavailable.
    }

    this.loadLocalProfile();
    this.loadPreferences();
  }


  /* =========================
     BROWSER
     ========================= */

  private get isBrowser(): boolean {

    return isPlatformBrowser(
      this.platformId
    );
  }


  /* =========================
     USER MATCHING
     ========================= */

  private belongsToCurrentUser(
    person: string
  ): boolean {

    return (
      person.trim().toLowerCase()
      ===
      this.activityIdentity
        .trim()
        .toLowerCase()
    );
  }


  /* =========================
     INITIALS
     ========================= */

  initials(): string {

    const parts =
      this.name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) {

      return '?';
    }

    if (parts.length === 1) {

      return parts[0][0]
        .toUpperCase();
    }

    return (
      parts[0][0]
      +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }


  /* =========================
     EDIT PROFILE
     ========================= */

  startEditing(): void {

    this.errorMessage = '';

    this.editName =
      this.name;

    this.editEmail =
      this.email;

    this.editPhone =
      this.phone;

    this.editRole =
      this.role;

    this.editMode = true;
  }


  cancelEditing(): void {

    this.errorMessage = '';
    this.editMode = false;
  }


  saveProfile(): void {

    if (!this.editName.trim()) {

      this.errorMessage =
        'Name cannot be empty.';

      return;
    }

    if (!this.editEmail.trim()) {

      this.errorMessage =
        'Email cannot be empty.';

      return;
    }

    this.name =
      this.editName.trim();

    this.email =
      this.editEmail.trim();

    this.phone =
      this.editPhone.trim();

    this.role =
      this.editRole.trim()
      || 'Group Member';

    this.errorMessage = '';
    this.editMode = false;

    this.saveLocalProfile();
  }


  /* =========================
     PROFILE STORAGE
     ========================= */

  private saveLocalProfile(): void {

    if (!this.isBrowser) {

      return;
    }

    const profile: SavedProfile = {

      name:
        this.name,

      email:
        this.email,

      phone:
        this.phone,

      role:
        this.role
    };

    localStorage.setItem(
      this.profileStorageKey,
      JSON.stringify(profile)
    );
  }


  private loadLocalProfile(): void {

    if (!this.isBrowser) {

      return;
    }

    const stored =
      localStorage.getItem(
        this.profileStorageKey
      );

    if (!stored) {

      return;
    }

    try {

      const profile: SavedProfile =
        JSON.parse(stored);

      if (profile.name) {

        this.name =
          profile.name;
      }

      if (profile.email) {

        this.email =
          profile.email;
      }

      if (profile.phone) {

        this.phone =
          profile.phone;
      }

      if (profile.role) {

        this.role =
          profile.role;
      }

    } catch {

      // Ignore invalid demo storage.
    }
  }


  /* =========================
     NOTIFICATIONS
     ========================= */

  toggleNotifications(): void {

    this.notificationsEnabled =
      !this.notificationsEnabled;

    this.savePreferences();
  }


  /* =========================
     DARK MODE
     ========================= */

  toggleDarkMode(): void {

    this.darkModeEnabled =
      !this.darkModeEnabled;

    this.savePreferences();
  }


  private savePreferences(): void {

    if (!this.isBrowser) {

      return;
    }

    localStorage.setItem(
      this.notificationStorageKey,
      String(
        this.notificationsEnabled
      )
    );

    localStorage.setItem(
      this.darkModeStorageKey,
      String(
        this.darkModeEnabled
      )
    );
  }


  private loadPreferences(): void {

    if (!this.isBrowser) {

      return;
    }

    const notifications =
      localStorage.getItem(
        this.notificationStorageKey
      );

    const darkMode =
      localStorage.getItem(
        this.darkModeStorageKey
      );

    if (notifications !== null) {

      this.notificationsEnabled =
        notifications === 'true';
    }

    if (darkMode !== null) {

      this.darkModeEnabled =
        darkMode === 'true';
    }
  }


  /* =========================
     GROUPS
     ========================= */

  get userGroups(): Group[] {

    return this.groupService.groups
      .filter(group =>

        group.members.some(member =>

          this.belongsToCurrentUser(
            member
          )
        )
      );
  }


  get currentGroup(): Group | null {

    /*
     * Prefer a group where the current user
     * is a member but not the owner.
     */

    const leaveableGroup =
      this.userGroups.find(group =>

        !this.belongsToCurrentUser(
          group.owner
        )
      );

    if (leaveableGroup) {

      return leaveableGroup;
    }

    return (
      this.userGroups[0]
      ??
      null
    );
  }


  get currentGroupMemberCount(): number {

    return (
      this.currentGroup
        ?.members
        .length
      ??
      0
    );
  }


  get currentUserOwnsGroup(): boolean {

    const group =
      this.currentGroup;

    if (!group) {

      return false;
    }

    return this.belongsToCurrentUser(
      group.owner
    );
  }


  /* =========================
     LEAVE GROUP
     ========================= */

  openLeaveGroupModal(): void {

    if (!this.currentGroup) {

      return;
    }

    if (this.currentUserOwnsGroup) {

      return;
    }

    this.showLeaveGroupModal = true;
  }


  cancelLeaveGroup(): void {

    this.showLeaveGroupModal = false;
  }


  confirmLeaveGroup(): void {

    const group =
      this.currentGroup;

    if (!group) {

      return;
    }

    if (
      this.belongsToCurrentUser(
        group.owner
      )
    ) {

      return;
    }

    const index =
      group.members.findIndex(member =>

        this.belongsToCurrentUser(
          member
        )
      );

    if (index >= 0) {

      group.members.splice(
        index,
        1
      );
    }

    this.showLeaveGroupModal = false;
  }


  /* =========================
     TOTAL TRIPS
     ========================= */

  get totalTrips(): number {

    return this.tripService.trips
      .filter(trip =>

        this.belongsToCurrentUser(
          trip.driver
        )
      )
      .length;
  }


  /* =========================
     EXPENSES
     ========================= */

  get totalExpensesPaid(): number {

    return this.expenseService.expenses
      .filter(expense =>

        this.belongsToCurrentUser(
          expense.paidBy
        )
      )
      .reduce(
        (
          sum,
          expense
        ) =>
          sum + expense.amount,
        0
      );
  }


  get totalExpensesPaidFormatted(): string {

    return this.money(
      this.totalExpensesPaid
    );
  }


  /* =========================
     RESERVATIONS
     ========================= */

  get totalReservations(): number {

    return this.reservationService
      .reservations
      .filter(reservation =>

        this.belongsToCurrentUser(
          reservation.driver
        )
      )
      .length;
  }


  /* =========================
     VEHICLES USED
     ========================= */

  get vehiclesUsed(): number {

    const licensePlates =
      new Set<string>();

    for (
      const trip
      of this.tripService.trips
    ) {

      if (
        !this.belongsToCurrentUser(
          trip.driver
        )
      ) {

        continue;
      }

      const vehicleExists =
        this.vehicleService.vehicles
          .some(vehicle =>

            vehicle.licensePlate
              .toLowerCase()
            ===
            trip.licensePlate
              .toLowerCase()
          );

      if (vehicleExists) {

        licensePlates.add(
          trip.licensePlate
            .toLowerCase()
        );
      }
    }

    return licensePlates.size;
  }


  /* =========================
     RECENT ACTIVITY
     ========================= */

  get recentActivity():
    ProfileActivity | null {

    const activities:
      ProfileActivity[] = [];


    /* TRIPS */

    for (
      const trip
      of this.tripService.trips
    ) {

      if (
        !this.belongsToCurrentUser(
          trip.driver
        )
      ) {

        continue;
      }

      activities.push({

        icon:
          '🚗',

        title:
          trip.vehicleName,

        subtitle:
          `${trip.startLocation} → ${trip.destination}`,

        type:
          `Trip ${trip.status}`,

        when:
          this.displayDate(
            trip.date
          ),

        timestamp:
          this.timestamp(
            trip.date,
            trip.endTime
            || trip.startTime
          )
      });
    }


    /* RESERVATIONS */

    for (
      const reservation
      of this.reservationService.reservations
    ) {

      if (
        !this.belongsToCurrentUser(
          reservation.driver
        )
      ) {

        continue;
      }

      activities.push({

        icon:
          '📅',

        title:
          reservation.vehicleName,

        subtitle:
          `${reservation.startTime} - ${reservation.endTime}`,

        type:
          `Reservation ${reservation.status}`,

        when:
          this.displayDate(
            reservation.date
          ),

        timestamp:
          this.timestamp(
            reservation.date,
            reservation.startTime
          )
      });
    }


    /* EXPENSES */

    for (
      const expense
      of this.expenseService.expenses
    ) {

      if (
        !this.belongsToCurrentUser(
          expense.paidBy
        )
      ) {

        continue;
      }

      activities.push({

        icon:
          '€',

        title:
          expense.vehicleName,

        subtitle:
          `${expense.category} · ${this.money(expense.amount)}`,

        type:
          'Expense recorded',

        when:
          this.displayDate(
            expense.date
          ),

        timestamp:
          this.timestamp(
            expense.date,
            '12:00'
          )
      });
    }


    if (!activities.length) {

      return null;
    }

    activities.sort(
      (
        a,
        b
      ) =>
        b.timestamp
        -
        a.timestamp
    );

    return activities[0];
  }


  /* =========================
     MONEY
     ========================= */

  money(
    value: number
  ): string {

    return new Intl.NumberFormat(
      'de-AT',
      {
        style: 'currency',
        currency: 'EUR'
      }
    ).format(
      value
    );
  }


  /* =========================
     DATE HELPERS
     ========================= */

  private timestamp(
    date: string,
    time = '12:00'
  ): number {

    return new Date(
      `${date}T${time}:00`
    ).getTime();
  }


  private displayDate(
    date: string
  ): string {

    const today =
      this.localDateString(
        new Date()
      );

    const yesterdayDate =
      new Date();

    yesterdayDate.setDate(
      yesterdayDate.getDate() - 1
    );

    const yesterday =
      this.localDateString(
        yesterdayDate
      );

    if (date === today) {

      return 'Today';
    }

    if (date === yesterday) {

      return 'Yesterday';
    }

    return new Intl.DateTimeFormat(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    ).format(
      new Date(
        `${date}T12:00:00`
      )
    );
  }


  private localDateString(
    date: Date
  ): string {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );

    return `${year}-${month}-${day}`;
  }
}