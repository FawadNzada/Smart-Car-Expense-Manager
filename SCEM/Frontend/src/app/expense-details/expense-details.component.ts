import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ExpenseService } from '../../services/expense.service';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-expense-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './expense-details.component.html',
  styleUrls: ['./expense-details.component.css']
})
export class ExpenseDetailsComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly expenseService = inject(ExpenseService);
  private readonly vehicleService = inject(VehicleService);

  isDeleting = false;
  errorMessage = '';

  get expense() {
    return this.expenseService.findExpense(
      Number(this.route.snapshot.paramMap.get('id'))
    );
  }

  get vehicle() {
    return this.expense
      ? this.vehicleService.findVehicle(this.expense.licensePlate)
      : undefined;
  }

  async deleteExpense(): Promise<void> {

    if (this.isDeleting) return;

    const expense = this.expense;

    if (!expense) return;

    const confirmed = window.confirm(
      `Delete expense?\n\n` +
      `${expense.category} - ${this.money(expense.amount)}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    this.isDeleting = true;
    this.errorMessage = '';

    try {

      // DELETE /Expense/{id} - SQLite
      await this.expenseService.deleteExpenseInBackend(expense);

      console.log('Expense permanently deleted:', expense.id);

      await this.router.navigate(['/expenses']);

    } catch (error) {

      console.error('Delete failed:', error);

      if (error instanceof HttpErrorResponse) {

        switch (error.status) {
          case 401:
            this.errorMessage = 'Please log in again.';
            break;

          case 403:
            this.errorMessage = 'You cannot delete this expense.';
            break;

          case 404:
            this.errorMessage = 'Expense not found.';
            break;

          case 409:
            this.errorMessage =
              'This expense has shared costs and cannot be deleted.';
            break;

          case 0:
            this.errorMessage = 'Cannot connect to backend.';
            break;

          default:
            this.errorMessage = 'Could not delete expense.';
        }

      } else {
        this.errorMessage = 'Unexpected error while deleting.';
      }

      window.alert(this.errorMessage);

    } finally {
      this.isDeleting = false;
    }
  }

  money(value: number): string {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  categoryClass(category: string): string {
    return category.toLowerCase();
  }

  icon(category: string): string {
    switch (category) {
      case 'Fuel': return '⛽';
      case 'Parking': return '🅿️';
      case 'Maintenance': return '🔧';
      default: return '💳';
    }
  }
}