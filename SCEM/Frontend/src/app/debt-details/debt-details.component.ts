import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Debt, DebtService } from '../../services/debt.service';

@Component({
  selector: 'app-debt-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './debt-details.component.html',
  styleUrls: ['./debt-details.component.css']
})
export class DebtDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly debtService = inject(DebtService);

  showDeleteModal = false;
  isSaving = false;
  actionError = '';

  ngOnInit(): void {
    // DebtService loads on construction. If it has already finished,
    // refresh the list when the user opens a detail page directly.
    if (!this.debtService.isLoading) {
      void this.refreshDebts();
    }
  }

  get debt(): Debt | undefined {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    return this.debtService.findDebt(id);
  }

  get isLoading(): boolean {
    return this.debtService.isLoading;
  }

  get hasLoadError(): boolean {
    return this.debtService.errorMessage ===
      'Could not load debts from the backend.';
  }

  async refreshDebts(): Promise<void> {
    if (this.isLoading || this.isSaving) return;

    this.actionError = '';
    try {
      await this.debtService.loadDebts();
    } catch (error) {
      console.error('Could not load debt details:', error);
      this.actionError = 'Unable to load debt details. Please try again.';
    }
  }

  async markAsPaid(): Promise<void> {
    const currentDebt = this.debt;
    if (!currentDebt || currentDebt.status !== 'Open' || this.isSaving) return;
    await this.changePaymentStatus(currentDebt, true);
  }

  async reopenDebt(): Promise<void> {
    const currentDebt = this.debt;
    if (!currentDebt || currentDebt.status !== 'Paid' || this.isSaving) return;
    await this.changePaymentStatus(currentDebt, false);
  }

  private async changePaymentStatus(debt: Debt, isPaid: boolean): Promise<void> {
    this.isSaving = true;
    this.actionError = '';

    try {
      await this.debtService.setDebtPaymentStatusInBackend(debt, isPaid);
      // DebtService reloads the current values from SQLite after success.
    } catch (error) {
      this.actionError = this.getErrorMessage(error, 'update the payment status');
      console.error('Debt payment update failed:', error);
    } finally {
      this.isSaving = false;
    }
  }

  async deleteDebt(): Promise<void> {
    const currentDebt = this.debt;
    if (!currentDebt || currentDebt.status !== 'Open' || this.isSaving) return;

    this.isSaving = true;
    this.actionError = '';

    try {
      await this.debtService.deleteDebtInBackend(currentDebt);
      this.showDeleteModal = false;
      await this.router.navigate(['/debts']);
    } catch (error) {
      this.actionError = this.getErrorMessage(error, 'delete this debt');
      console.error('Debt deletion failed:', error);
      this.showDeleteModal = false;
    } finally {
      this.isSaving = false;
    }
  }

  private getErrorMessage(error: unknown, action: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Please log in again and try again.';
      }
      if (error.status === 403) {
        return 'Only the person who paid the expense can change or delete this debt.';
      }
      if (error.status === 404) {
        return 'This debt no longer exists. Return to the debt list.';
      }
      if (error.status === 409) {
        return 'This debt cannot be deleted because its payment status has changed.';
      }
    }

    return `Could not ${action}. Please try again.`;
  }

  statusClass(status: string): string {
    return status === 'Paid' ? 'paid' : 'open';
  }

  money(amount: number): string {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}