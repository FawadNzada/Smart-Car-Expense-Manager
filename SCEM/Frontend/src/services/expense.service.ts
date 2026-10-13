import { Injectable } from '@angular/core';

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  paidBy: string;
  vehicleName: string;
  licensePlate: string;
  tripId: number | null;
  tripRoute: string;
  notes: string;
}

function dateOffset(days = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private nextId = 4;

  readonly expenses: Expense[] = [
    { id: 1, category: 'Fuel', amount: 72.40, date: dateOffset(0), paidBy: 'Sebastian', vehicleName: 'Volkswagen Golf', licensePlate: 'L-123AB', tripId: 1, tripRoute: 'Linz → Wels', notes: 'Full tank.' },
    { id: 2, category: 'Parking', amount: 8.50, date: dateOffset(0), paidBy: 'Lisa', vehicleName: 'BMW 3 Series', licensePlate: 'L-456CD', tripId: 2, tripRoute: 'Linz → Steyr', notes: 'Parking garage.' },
    { id: 3, category: 'Maintenance', amount: 189.90, date: dateOffset(-2), paidBy: 'Max', vehicleName: 'Audi A4', licensePlate: 'L-789EF', tripId: null, tripRoute: '', notes: 'Oil and filter change.' }
  ];

  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const created = { ...expense, id: this.nextId++ };
    this.expenses.push(created);
    return created;
  }

  findExpense(id: number): Expense | undefined {
    return this.expenses.find(e => e.id === id);
  }

  deleteExpense(expense: Expense): void {
    const index = this.expenses.indexOf(expense);
    if (index >= 0) this.expenses.splice(index, 1);
  }
}
