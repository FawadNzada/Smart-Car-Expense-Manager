import { Injectable } from '@angular/core';

export interface Group {
  id: number;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
  members: string[];
  vehicleLicensePlates: string[];
}

function dateOffset(days = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private nextId = 4;

  readonly groups: Group[] = [
    { id: 1, name: 'Family Car', description: 'Shared vehicle group for family members.', owner: 'Sebastian', createdAt: dateOffset(-30), members: ['Sebastian', 'Lisa', 'Max', 'Emily'], vehicleLicensePlates: ['L-123AB', 'L-456CD'] },
    { id: 2, name: 'WG Linz', description: 'Shared vehicle group for the apartment.', owner: 'Lisa', createdAt: dateOffset(-20), members: ['Lisa', 'Sebastian', 'Max'], vehicleLicensePlates: ['L-789EF'] },
    { id: 3, name: 'HTL Team', description: 'Carsharing group for the school project team.', owner: 'Sebastian', createdAt: dateOffset(-10), members: ['Sebastian', 'Lisa', 'Max', 'Emily', 'Tom'], vehicleLicensePlates: ['L-123AB', 'L-321GH'] }
  ];

  addGroup(group: Omit<Group, 'id'>): Group {
    const created = { ...group, id: this.nextId++ };
    this.groups.push(created);
    return created;
  }

  findGroup(id: number): Group | undefined {
    return this.groups.find(g => g.id === id);
  }

  deleteGroup(group: Group): void {
    const index = this.groups.indexOf(group);
    if (index >= 0) this.groups.splice(index, 1);
  }

  groupNameExists(name: string, ignoreGroup?: Group): boolean {
    return this.groups.some(g => g !== ignoreGroup && g.name.toLowerCase() === name.toLowerCase());
  }
}
