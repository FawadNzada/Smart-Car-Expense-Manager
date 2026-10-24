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
  phone: string;
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

  private get storagePrefix(): string | null {
    const subject = this.keycloak.subject ?? this.keycloak.tokenParsed?.sub;
    return subject ? `scem-profile:${subject}` : null;
  }

  // No sample names, emails, phone numbers or fabricated registration dates.
  private activityIdentity = '';

  name = 'Loading...';
  email = '—';
  phone = '';
  role = '—';
  memberSince = 'Not available';

  editPhone = '';
  editMode = false;
  errorMessage = '';
  profileLoadError = '';
  isProfileLoading = true;

  notificationsEnabled = true;
  darkModeEnabled = true;

  // Kept for compatibility with the existing profile template.
  showLeaveGroupModal = false;

  /* =========================
     KEYCLOAK ACCOUNT
     ========================= */

  async ngOnInit(): Promise<void> {
    if (!this.keycloak.authenticated) {
      this.name = 'Not signed in';
      this.profileLoadError = 'Please sign in to see your account details.';
      this.isProfileLoading = false;
      return;
    }

    // Signed-in account data is always sourced from Keycloak.
    // An older localStorage profile must not overwrite the real identity.
    const token = (this.keycloak.tokenParsed ?? {}) as Record<string, unknown>;
    const claim = (field: string): string =>
      typeof token[field] === 'string' ? (token[field] as string).trim() : '';

    let firstName = claim('given_name');
    let lastName = claim('family_name');
    let email = claim('email');
    let displayedName = claim('name');

    try {
      const profile = await this.keycloak.loadUserProfile();
      firstName = profile.firstName?.trim() || firstName;
      lastName = profile.lastName?.trim() || lastName;
      email = profile.email?.trim() || email;
      displayedName = `${firstName} ${lastName}`.trim() || displayedName;
    } catch {
      this.profileLoadError =
        'Keycloak profile details could not be loaded. Showing available account claims.';
    }

    this.name = displayedName || `${firstName} ${lastName}`.trim()
      || claim('preferred_username') || 'Account';
    this.activityIdentity = this.name;
    this.email = email || 'Not available';

    // Role labels reflect Keycloak authorization, not editable local text.
    const realmRoles = this.keycloak.realmAccess?.roles ?? [];
    const clientRoles = Object.values(this.keycloak.resourceAccess ?? {})
      .flatMap(access => access.roles ?? []);
    const roles = [...realmRoles, ...clientRoles];
    this.role = roles.includes('AdminUser') ? 'Admin'
      : roles.includes('NormalUser') ? 'User'
      : 'User';

    this.loadLocalProfile();
    this.loadPreferences();
    this.isProfileLoading = false;
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private belongsToCurrentUser(person: string): boolean {
    const target = person.trim().toLocaleLowerCase();
    const fullName = this.activityIdentity.trim().toLocaleLowerCase();
    if (!target || !fullName) return false;

    // API uses full names; older records may contain only a first name.
    return target === fullName ||
      (!target.includes(' ') && target === fullName.split(/\s+/)[0]);
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
      return parts[0][0].toUpperCase();
    }

    return (
      parts[0][0]
      +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }


  /* =========================
     EDIT: PHONE ONLY (LOCAL)
     ========================= */

  startEditing(): void {
    this.errorMessage = '';
    this.editPhone = this.phone;
    this.editMode = true;
  }

  cancelEditing(): void {
    this.errorMessage = '';
    this.editMode = false;
  }

  saveProfile(): void {
    const phone = this.editPhone.trim();
    if (phone.length > 40) {
      this.errorMessage = 'Phone number is too long.';
      return;
    }

    this.phone = phone;
    this.errorMessage = '';
    this.editMode = false;
    this.saveLocalProfile();
  }

  private saveLocalProfile(): void {
    const prefix = this.storagePrefix;
    if (!this.isBrowser || !prefix) return;
    const value: SavedProfile = { phone: this.phone };
    localStorage.setItem(`${prefix}:details`, JSON.stringify(value));
  }

  private loadLocalProfile(): void {
    const prefix = this.storagePrefix;
    if (!this.isBrowser || !prefix) return;
    const stored = localStorage.getItem(`${prefix}:details`);
    if (!stored) return;
    try {
      const value = JSON.parse(stored) as SavedProfile;
      if (typeof value.phone === 'string') this.phone = value.phone;
    } catch {
      // Ignore invalid per-account browser preferences.
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
     DARK MODE PREFERENCE
     ========================= */

  toggleDarkMode(): void {

    this.darkModeEnabled =
      !this.darkModeEnabled;

    this.savePreferences();
  }


  private savePreferences(): void {
    const prefix = this.storagePrefix;
    if (!this.isBrowser || !prefix) return;
    localStorage.setItem(`${prefix}:notifications`, String(this.notificationsEnabled));
    localStorage.setItem(`${prefix}:dark-mode`, String(this.darkModeEnabled));
  }

  private loadPreferences(): void {
    const prefix = this.storagePrefix;
    if (!this.isBrowser || !prefix) return;
    const notifications = localStorage.getItem(`${prefix}:notifications`);
    const darkMode = localStorage.getItem(`${prefix}:dark-mode`);
    if (notifications !== null) this.notificationsEnabled = notifications === 'true';
    if (darkMode !== null) this.darkModeEnabled = darkMode === 'true';
  }

  /* =========================
     GROUP MEMBERSHIP
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
     * Prefer a group the user does not own,
     * so "Leave Group" is actually meaningful.
     */

    const leaveableGroup =
      this.userGroups.find(group =>
        !this.belongsToCurrentUser(
          group.owner
        )
      );


    return (
      leaveableGroup
      ??
      this.userGroups[0]
      ??
      null
    );
  }


  get currentGroupMemberCount(): number {

    return (
      this.currentGroup?.members.length
      ?? 0
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


  openLeaveGroupModal(): void {

    if (
      !this.currentGroup
      ||
      this.currentUserOwnsGroup
    ) {
      return;
    }


    this.showLeaveGroupModal = true;
  }


  cancelLeaveGroup(): void {

    this.showLeaveGroupModal = false;
  }


  confirmLeaveGroup(): void {
    // Do not fake a database update by mutating a front-end array.
    this.showLeaveGroupModal = false;
    this.errorMessage = 'Leaving a group will be available after the membership API is connected.';
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
        (sum, expense) =>
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

        icon: '🚗',

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


    for (
      const reservation
      of this.reservationService
        .reservations
    ) {

      if (
        !this.belongsToCurrentUser(
          reservation.driver
        )
      ) {
        continue;
      }


      activities.push({

        icon: '📅',

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

        icon: '€',

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
      (a, b) =>
        b.timestamp
        -
        a.timestamp
    );


    return activities[0];
  }


  /* =========================
     HELPERS
     ========================= */

  money(value: number): string {

    return new Intl.NumberFormat(
      'de-AT',
      {
        style: 'currency',
        currency: 'EUR'
      }
    ).format(value);
  }


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
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');


    return `${year}-${month}-${day}`;
  }
}