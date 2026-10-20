import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Group {
  id: number;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
  members: string[];
  vehicleLicensePlates: string[];
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

  private readonly apiUrl =
    'http://localhost:5123/Group';

  readonly groups: Group[] = [];

  private nextLocalId = -1;

  constructor() {
    this.loadGroups();
  }

  // =========================================
  // GET - Gruppen aus SQLite laden
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

          console.log(
            'Groups loaded from backend:',
            mappedGroups
          );
        },

        error: (error) => {

          console.error(
            'Error loading groups:',
            error
          );
        }
      });
  }

  // =========================================
  // Backend-Daten umwandeln
  // =========================================

  private mapGroup(group: BackendGroup): Group {

    return {
      id: group.id,
      name: group.name,
      description: group.description || '',
      owner: 'You',
      createdAt: group.createdAt.slice(0, 10),
      members: [],
      vehicleLicensePlates:
        group.vehicleLicensePlates || []
    };
  }

  // =========================================
  // POST - Gruppe erstellen
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
  // PUT - Gruppennamen und Beschreibung ändern
  // =========================================

  async updateGroupInBackend(
    group: Group,
    name: string,
    description: string
  ): Promise<void> {

    if (group.id <= 0) {
      throw new Error('Group has no valid database ID.');
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
  // PUT - Fahrzeuge einer Gruppe zuordnen
  // =========================================

  async assignVehiclesInBackend(
    group: Group,
    licensePlates: string[]
  ): Promise<void> {

    if (group.id <= 0) {
      throw new Error('Group has no valid database ID.');
    }

    const payload = {
      licensePlates: licensePlates
    };

    await firstValueFrom(
      this.http.put<void>(
        `${this.apiUrl}/${group.id}/vehicles`,
        payload
      )
    );

    group.vehicleLicensePlates = [...licensePlates];
  }

  // =========================================
  // NEU: DELETE - Gruppe dauerhaft löschen
  // =========================================

  async deleteGroupInBackend(
    group: Group
  ): Promise<void> {

    if (group.id <= 0) {
      throw new Error('Group has no valid database ID.');
    }

    // Zuerst in SQLite löschen
    await firstValueFrom(
      this.http.delete<void>(
        `${this.apiUrl}/${group.id}`
      )
    );

    // Erst nach erfolgreicher API-Antwort
    // aus der Angular-Liste entfernen
    const index = this.groups.findIndex(
      item => item.id === group.id
    );

    if (index >= 0) {
      this.groups.splice(index, 1);
    }

    console.log(
      'Group deleted successfully:',
      group.id
    );
  }

  // =========================================
  // Bisherige lokale Funktion
  // =========================================

  addGroup(group: Omit<Group, 'id'>): Group {

    const created: Group = {
      ...group,
      id: this.nextLocalId--
    };

    this.groups.push(created);

    return created;
  }

  // =========================================
  // Gruppe suchen
  // =========================================

  findGroup(id: number): Group | undefined {

    return this.groups.find(
      group => group.id === id
    );
  }

  // =========================================
  // Alte lokale Löschfunktion
  // =========================================

  deleteGroup(group: Group): void {

    const index = this.groups.indexOf(group);

    if (index >= 0) {
      this.groups.splice(index, 1);
    }
  }

  // =========================================
  // Gruppennamen überprüfen
  // =========================================

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