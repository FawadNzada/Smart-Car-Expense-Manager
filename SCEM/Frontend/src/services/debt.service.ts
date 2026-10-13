import { Injectable } from '@angular/core';

export interface Debt {
  id: number;
  fromPerson: string;
  toPerson: string;
  amount: number;
  date: string;
  description: string;
  expenseId: number | null;
  expenseDescription: string;
  status: string;
}

function dateOffset(days = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class DebtService {
  private nextId = 5;

  readonly debts: Debt[] = [
    { id: 1, fromPerson: 'Max', toPerson: 'Sebastian', amount: 30, date: dateOffset(0), description: 'Shared costs', expenseId: null, expenseDescription: '', status: 'Open' },
    { id: 2, fromPerson: 'Lisa', toPerson: 'Sebastian', amount: 15, date: dateOffset(-1), description: 'Shared costs', expenseId: null, expenseDescription: '', status: 'Open' },
    { id: 3, fromPerson: 'Tom', toPerson: 'Max', amount: 22, date: dateOffset(-2), description: 'Shared costs', expenseId: null, expenseDescription: '', status: 'Open' },
    { id: 4, fromPerson: 'Sebastian', toPerson: 'Lisa', amount: 20, date: dateOffset(-3), description: 'Shared costs', expenseId: null, expenseDescription: '', status: 'Open' }
  ];

  addDebt(debt: Omit<Debt, 'id'>): Debt {
    const created = { ...debt, id: this.nextId++ };
    this.debts.push(created);
    return created;
  }

  findDebt(id: number): Debt | undefined {
    return this.debts.find(d => d.id === id);
  }

  deleteDebt(debt: Debt): void {
    const index = this.debts.indexOf(debt);
    if (index >= 0) this.debts.splice(index, 1);
  }

  markAsPaid(debt: Debt): void { debt.status = 'Paid'; }
  reopenDebt(debt: Debt): void { debt.status = 'Open'; }
}
