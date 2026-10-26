import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DebtService } from '../../services/debt.service';

interface DebtUserOption {
  id: number;
  name: string;
}

interface ExpenseOption {
  id: number;
  category: string;
  amount: number;
  date: string;
  paidBy: string;
  vehicleName: string;
  licensePlate: string;
}

@Component({
  selector: 'app-create-debt',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './create-debt.component.html',
  styleUrls: ['./create-debt.component.css']
})
export class CreateDebtComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly debtService = inject(DebtService);
  private readonly router = inject(Router);

  private readonly apiUrl = 'http://localhost:5123';

  readonly debtors: DebtUserOption[] = [];
  readonly expenses: ExpenseOption[] = [];

  selectedDebtorId = 0;
  selectedExpenseId = 0;
  amount = 0;

  isLoading = true;
  isSaving = false;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    // Separate reads: an empty user list does not prevent
    // expenses from being shown in the form.
    const [usersResult, expensesResult] = await Promise.allSettled([
      firstValueFrom(
        this.http.get<DebtUserOption[]>(`${this.apiUrl}/Debt/users`)
      ),
      firstValueFrom(
        this.http.get<ExpenseOption[]>(`${this.apiUrl}/Expense`)
      )
    ]);

    const errors: string[] = [];

    if (usersResult.status === 'fulfilled') {
      this.debtors.splice(0, this.debtors.length, ...usersResult.value);
    } else {
      errors.push('Could not load registered users.');
      console.error('Loading debt users failed:', usersResult.reason);
    }

    if (expensesResult.status === 'fulfilled') {
      this.expenses.splice(0, this.expenses.length, ...expensesResult.value);
    } else {
      errors.push('Could not load expenses.');
      console.error('Loading expenses failed:', expensesResult.reason);
    }

    this.errorMessage = errors.join(' ');
    this.isLoading = false;
  }

  get selectedExpense(): ExpenseOption | undefined {
    return this.expenses.find(e => e.id === Number(this.selectedExpenseId));
  }

  get selectedDebtor(): DebtUserOption | undefined {
    return this.debtors.find(u => u.id === Number(this.selectedDebtorId));
  }

  get creditorName(): string {
    return this.selectedExpense?.paidBy || 'Select an expense';
  }

  get canSave(): boolean {
    return !this.isLoading &&
      !this.isSaving &&
      !!this.selectedExpense &&
      !!this.selectedDebtor &&
      Number.isFinite(this.amount) &&
      this.amount > 0;
  }

  async saveDebt(): Promise<void> {
    if (this.isSaving) return;

    this.errorMessage = '';
    const expense = this.selectedExpense;
    const debtor = this.selectedDebtor;

    if (!expense) {
      this.errorMessage = 'Please select a related expense.';
      return;
    }

    if (!debtor) {
      this.errorMessage = 'Please select a registered debtor.';
      return;
    }

    if (!Number.isFinite(this.amount) || this.amount <= 0) {
      this.errorMessage = 'Amount must be greater than zero.';
      return;
    }

    if (this.amount > expense.amount) {
      this.errorMessage = 'Debt cannot exceed the expense amount.';
      return;
    }

    this.isSaving = true;

    try {
      // POST /Debt only accepts ExpenseId, DebtorId and Amount.
      // The creditor comes from the authenticated expense owner.
      await this.debtService.createDebtInBackend({
        expenseId: expense.id,
        debtorId: debtor.id,
        amount: this.amount
      });

      await this.router.navigate(['/debts']);
    } catch (error: unknown) {
      console.error('Creating debt failed:', error);

      const response = (error as { error?: unknown })?.error;
      if (typeof response === 'string' && response.trim()) {
        this.errorMessage = response;
      } else if (response && typeof response === 'object' &&
                 'title' in response && typeof response.title === 'string') {
        this.errorMessage = response.title;
      } else {
        this.errorMessage = 'Could not save the debt. Please check the backend.';
      }
    } finally {
      this.isSaving = false;
    }
  }

  money(value: number): string {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }
}
