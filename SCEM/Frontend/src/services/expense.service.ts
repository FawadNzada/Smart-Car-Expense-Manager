import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5123/Expense';

  readonly expenses: Expense[] = [];

  private nextLocalId = -1;

  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor() {
    this.loadExpenses();
  }

  // =========================================
  // GET - AUSGABEN AUS SQLITE LADEN
  // =========================================

  loadExpenses(): void {

    this.http.get<Expense[]>(this.apiUrl)
      .subscribe({

        next: (data) => {

          this.expenses.splice(
            0,
            this.expenses.length,
            ...data
          );

          console.log(
            'Expenses loaded from SQLite:',
            data
          );
        },

        error: (error) => {

          console.error(
            'Error loading expenses:',
            error
          );

        }

      });
  }

  // =========================================
  // POST - AUSGABE ERSTELLEN
  // =========================================

  async createExpenseInBackend(
    expense: Omit<Expense, 'id'>
  ): Promise<Expense> {

    const payload = {
      licensePlate: expense.licensePlate,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      tripId: expense.tripId,
      notes: expense.notes
    };

    const created = await firstValueFrom(
      this.http.post<Expense>(
        this.apiUrl,
        payload
      )
    );

    this.expenses.push(created);

    return created;
  }

  // =========================================
  // PUT - AUSGABE BEARBEITEN
  // =========================================

  async updateExpenseInBackend(
    expense: Expense
  ): Promise<void> {

    const payload = {
      licensePlate: expense.licensePlate,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      tripId: expense.tripId,
      notes: expense.notes
    };

    await firstValueFrom(
      this.http.put<void>(
        `${this.apiUrl}/${expense.id}`,
        payload
      )
    );

    const existing = this.findExpense(expense.id);

    if (existing) {
      Object.assign(existing, expense);
    }
  }

  // =========================================
  // DELETE - AUSGABE LÖSCHEN
  // =========================================

  async deleteExpenseInBackend(
    expense: Expense
  ): Promise<void> {

    await firstValueFrom(
      this.http.delete<void>(
        `${this.apiUrl}/${expense.id}`
      )
    );

    this.deleteExpense(expense);
  }

  // =========================================
  // AUSGABE SUCHEN
  // =========================================

  findExpense(id: number): Expense | undefined {

    return this.expenses.find(
      expense => expense.id === id
    );
  }

  // =========================================
  // ALTE FUNKTIONEN
  // VORERST FÜR BESTEHENDE KOMPONENTEN
  // =========================================

  addExpense(
    expense: Omit<Expense, 'id'>
  ): Expense {

    const created: Expense = {
      ...expense,
      id: this.nextLocalId--
    };

    this.expenses.push(created);

    return created;
  }

  deleteExpense(expense: Expense): void {

    const index = this.expenses.indexOf(expense);

    if (index >= 0) {
      this.expenses.splice(index, 1);
    }
  }
}