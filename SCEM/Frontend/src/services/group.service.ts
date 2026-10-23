import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface GroupMember {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
  members: string[];
  vehicleLicensePlates: string[];

  memberDetails?: GroupMember[];
}

interface BackendGroup {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: string;
  vehicleLicensePlates: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:5123/Group';

  readonly groups: Group[] = [];

  private nextLocalId = -1;

  constructor() {
    this.loadGroups();
  }

  // =========================================
  // GRUPPEN LADEN
  // =========================================

  loadGroups(): void {

    this.http.get<BackendGroup[]>(this.apiUrl)
      .subscribe({

        next: (groups) => {

          const mappedGroups = groups.map(
            group => this.mapGroup(group)
          );

          this.groups.splice(
            0,
            this.groups.length,
            ...mappedGroups
          );

          // Mitglieder jeder Gruppe aus SQLite laden
          for (const group of mappedGroups) {

            void this.loadMembersInBackend(group)
              .catch(error => {

                console.error(
                  'Error loading group members:',
                  error
                );

              });
          }

        },

        error: (error) => {

          console.error(
            'Error loading groups:',
            error
          );

        }

      });
  }

  private mapGroup(group: BackendGroup): Group {

    return {
      id: group.id,
      name: group.name,
      description: group.description || '',
      owner: 'You',
      createdAt: group.createdAt.slice(0, 10),
      members: [],
      vehicleLicensePlates:
        group.vehicleLicensePlates || [],
      memberDetails: []
    };
  }

  // =========================================
  // GRUPPE ERSTELLEN
  // =========================================

  async createGroupInBackend(
    name: string,
    description: string
  ): Promise<Group> {

    const payload = {
      name: name.trim(),
      description: description.trim()
    };

    const createdGroup = await firstValueFrom(
      this.http.post<BackendGroup>(
        this.apiUrl,
        payload
      )
    );

    const mappedGroup = this.mapGroup(createdGroup);

    this.groups.push(mappedGroup);

    return mappedGroup;
  }

  // =========================================
  // GRUPPE BEARBEITEN
  // =========================================

  async updateGroupInBackend(
    group: Group,
    name: string,
    description: string
  ): Promise<void> {

    if (group.id <= 0) {
      throw new Error('Invalid group ID.');
    }

    const payload = {
      name: name.trim(),
      description: description.trim()
    };

    await firstValueFrom(
      this.http.put<void>(
        `${this.apiUrl}/${group.id}`,
        payload
      )
    );

    group.name = payload.name;
    group.description = payload.description;
  }

  // =========================================
  // FAHRZEUGE ZUORDNEN
  // =========================================

  async assignVehiclesInBackend(
    group: Group,
    licensePlates: string[]
  ): Promise<void> {

    if (group.id <= 0) {
      throw new Error('Invalid group ID.');
    }

    await firstValueFrom(
      this.http.put<void>(
        `${this.apiUrl}/${group.id}/vehicles`,
        {
          licensePlates
        }
      )
    );

    group.vehicleLicensePlates = [...licensePlates];
  }

  // =========================================
  // GRUPPE LÖSCHEN
  // =========================================

  async deleteGroupInBackend(
    group: Group
  ): Promise<void> {

    if (group.id <= 0) {
      throw new Error('Invalid group ID.');
    }

    await firstValueFrom(
      this.http.delete<void>(
        `${this.apiUrl}/${group.id}`
      )
    );

    const index = this.groups.findIndex(
      item => item.id === group.id
    );

    if (index >= 0) {
      this.groups.splice(index, 1);
    }
  }

  // =========================================
  // NEU: MITGLIEDER LADEN
  // =========================================

  async loadMembersInBackend(
    group: Group
  ): Promise<GroupMember[]> {

    const members = await firstValueFrom(
      this.http.get<GroupMember[]>(
        `${this.apiUrl}/${group.id}/members`
      )
    );

    this.updateLocalMembers(group, members);

    return members;
  }

  // =========================================
  // NEU: MITGLIED HINZUFÜGEN
  // =========================================

  async addMemberInBackend(
    group: Group,
    email: string
  ): Promise<GroupMember> {

    if (group.id <= 0) {
      throw new Error('Invalid group ID.');
    }

    const member = await firstValueFrom(
      this.http.post<GroupMember>(
        `${this.apiUrl}/${group.id}/members`,
        {
          email: email.trim()
        }
      )
    );

    const updatedMembers = [
      ...(group.memberDetails || []),
      member
    ];

    this.updateLocalMembers(
      group,
      updatedMembers
    );

    return member;
  }

  // =========================================
  // NEU: MITGLIED ENTFERNEN
  // =========================================

  async removeMemberInBackend(
    group: Group,
    userId: number
  ): Promise<void> {

    if (group.id <= 0) {
      throw new Error('Invalid group ID.');
    }

    await firstValueFrom(
      this.http.delete<void>(
        `${this.apiUrl}/${group.id}/members/${userId}`
      )
    );

    const updatedMembers =
      (group.memberDetails || []).filter(
        member => member.userId !== userId
      );

    this.updateLocalMembers(
      group,
      updatedMembers
    );
  }

  // =========================================
  // MITGLIEDER IN ANGULAR AKTUALISIEREN
  // =========================================

  private updateLocalMembers(
    group: Group,
    members: GroupMember[]
  ): void {

    group.memberDetails = [...members];

    group.members = members.map(member => {

      const fullName = [
        member.firstName,
        member.lastName
      ].filter(Boolean).join(' ').trim();

      return fullName || member.email;

    });
  }

  // =========================================
  // BISHERIGE LOKALE FUNKTIONEN
  // =========================================

  addGroup(group: Omit<Group, 'id'>): Group {

    const created: Group = {
      ...group,
      id: this.nextLocalId--
    };

    this.groups.push(created);

    return created;
  }

  findGroup(id: number): Group | undefined {

    return this.groups.find(
      group => group.id === id
    );
  }

  deleteGroup(group: Group): void {

    const index = this.groups.indexOf(group);

    if (index >= 0) {
      this.groups.splice(index, 1);
    }
  }

  groupNameExists(
    name: string,
    ignoreGroup?: Group
  ): boolean {

    return this.groups.some(
      group =>
        group !== ignoreGroup &&
        group.name.toLowerCase() ===
        name.toLowerCase()
    );
  }
}