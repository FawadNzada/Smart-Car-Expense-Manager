import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { Debt, DebtService } from '../../services/debt.service';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './debts.component.html',
  styleUrls: ['./debts.component.css']
})
export class DebtsComponent implements OnInit {
  private readonly service = inject(DebtService);
  private readonly router = inject(Router);

  activeFilter: 'All' | 'Open' | 'Paid' = 'All';
  actionBusyId: number | null = null;
  actionError = '';

  ngOnInit(): void {
    // DebtService loads once on creation. Refresh when returning to this page.
    if (!this.service.isLoading) {
      void this.refreshDebts();
    }
  }

  get isLoading(): boolean {
    return this.service.isLoading;
  }

  get hasLoadError(): boolean {
    return this.service.errorMessage === 'Could not load debts from the backend.';
  }

  get filteredDebts(): Debt[] {
    const allDebts = [...this.service.debts]
      .sort((a, b) => b.id - a.id);

    return this.activeFilter === 'All'
      ? allDebts
      : allDebts.filter(debt => debt.status === this.activeFilter);
  }

  get openAmount(): number {
    return this.service.debts
      .filter(debt => debt.status === 'Open')
      .reduce((total, debt) => total + debt.amount, 0);
  }

  get paidAmount(): number {
    return this.service.debts
      .filter(debt => debt.status === 'Paid')
      .reduce((total, debt) => total + debt.amount, 0);
  }

  get openCount(): number {
    return this.service.debts.filter(debt => debt.status === 'Open').length;
  }

  get paidCount(): number {
    return this.service.debts.filter(debt => debt.status === 'Paid').length;
  }

  setFilter(filter: string): void {
    if (filter === 'All' || filter === 'Open' || filter === 'Paid') {
      this.activeFilter = filter;
    }
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

  openDebt(id: number): void {
    void this.router.navigate(['/debts', id]);
  }

  async refreshDebts(): Promise<void> {
    if (this.service.isLoading) {
      return;
    }

    this.actionError = '';

    try {
      await this.service.loadDebts();
    } catch (error) {
      console.error('Could not refresh debts:', error);
      // The service already exposes its loading error for the view.
    }
  }

  async markAsPaid(debt: Debt): Promise<void> {
    await this.updatePaymentStatus(debt, true);
  }

  async reopenDebt(debt: Debt): Promise<void> {
    await this.updatePaymentStatus(debt, false);
  }

  private async updatePaymentStatus(debt: Debt, isPaid: boolean): Promise<void> {
    if (this.actionBusyId !== null || this.isLoading) {
      return;
    }

    this.actionBusyId = debt.id;
    this.actionError = '';

    try {
      await this.service.setDebtPaymentStatusInBackend(debt, isPaid);
    } catch (error) {
      console.error('Could not update payment status:', error);

      if (error instanceof HttpErrorResponse && error.status === 403) {
        this.actionError =
          'Only the person who paid the expense can confirm or reopen a payment.';
      } else if (error instanceof HttpErrorResponse && error.status === 401) {
        this.actionError = 'Please log in again and retry.';
      } else {
        this.actionError = 'Payment status could not be saved. Please try again.';
      }
    } finally {
      this.actionBusyId = null;
    }
  }
}
