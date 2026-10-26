import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// =========================================
// FRONTEND MODEL
// =========================================

export interface Debt {
  id: number;
  fromPerson: string;
  toPerson: string;
  amount: number;
  date: string;
  description: string;
  expenseId: number | null;
  expenseDescription: string;
  status: 'Open' | 'Paid';

  debtorId?: number;
  creditorId?: number;
  paidAt?: string | null;
}

// =========================================
// BACKEND DTOs
// =========================================

interface DebtApiDto {
  id: number;
  expenseId: number;
  category: string;
  debtorId: number;
  debtor: string;
  creditorId: number;
  creditor: string;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
}

export interface CreateDebtInput {
  expenseId: number;
  debtorId: number;
  amount: number;
}

// =========================================
// SERVICE
// =========================================

@Injectable({
  providedIn: 'root'
})
export class DebtService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5123/Debt';

  // Keine Mock-Daten mehr!
  readonly debts: Debt[] = [];

  isLoading = false;
  errorMessage = '';

  constructor() {
    void this.loadDebts().catch(error => {
      console.error('Could not load debts:', error);
    });
  }

  // =========================================
  // BACKEND -> FRONTEND
  // =========================================

  private toDebt(dto: DebtApiDto): Debt {

    return {
      id: dto.id,

      fromPerson: dto.debtor,
      toPerson: dto.creditor,

      amount: dto.amount,

      // Die API liefert noch kein Erstellungsdatum.
      date: dto.paidAt?.slice(0, 10) ?? '',

      description: dto.category,

      expenseId: dto.expenseId,

      expenseDescription: dto.category,

      status: dto.isPaid ? 'Paid' : 'Open',

      debtorId: dto.debtorId,
      creditorId: dto.creditorId,

      paidAt: dto.paidAt
    };
  }

  // =========================================
  // GET /Debt
  // =========================================

  async loadDebts(): Promise<void> {

    this.isLoading = true;
    this.errorMessage = '';

    try {

      const data = await firstValueFrom(
        this.http.get<DebtApiDto[]>(this.apiUrl)
      );

      const mappedDebts = data.map(
        dto => this.toDebt(dto)
      );

      this.debts.splice(
        0,
        this.debts.length,
        ...mappedDebts
      );

      console.log(
        'Debts loaded from SQLite:',
        this.debts
      );

    } catch (error) {

      this.errorMessage =
        'Could not load debts from the backend.';

      console.error(error);

      throw error;

    } finally {

      this.isLoading = false;

    }
  }

  // =========================================
  // GET LOCAL DEBT
  // =========================================

  findDebt(id: number): Debt | undefined {

    return this.debts.find(
      debt => debt.id === id
    );
  }

  // =========================================
  // POST /Debt
  // =========================================

  async createDebtInBackend(
    input: CreateDebtInput
  ): Promise<Debt> {

    this.errorMessage = '';

    try {

      const response = await firstValueFrom(
        this.http.post<DebtApiDto>(
          this.apiUrl,
          input
        )
      );

      const createdDebt = this.toDebt(response);

      this.debts.unshift(createdDebt);

      return createdDebt;

    } catch (error) {

      this.errorMessage =
        'Could not create debt.';

      console.error(error);

      throw error;

    }
  }

  // =========================================
  // PUT /Debt/{id}/paid
  // =========================================

  async setDebtPaymentStatusInBackend(
    debt: Debt,
    isPaid: boolean
  ): Promise<void> {

    this.errorMessage = '';

    try {

      await firstValueFrom(
        this.http.put<void>(
          `${this.apiUrl}/${debt.id}/paid`,
          { isPaid }
        )
      );

      // Erneut laden, damit auch PaidAt aktuell ist.
      await this.loadDebts();

    } catch (error) {

      this.errorMessage =
        'Could not update payment status.';

      console.error(error);

      throw error;

    }
  }

  async markAsPaidInBackend(
    debt: Debt
  ): Promise<void> {

    await this.setDebtPaymentStatusInBackend(
      debt,
      true
    );
  }

  async reopenDebtInBackend(
    debt: Debt
  ): Promise<void> {

    await this.setDebtPaymentStatusInBackend(
      debt,
      false
    );
  }

  // =========================================
  // DELETE /Debt/{id}
  // =========================================

  async deleteDebtInBackend(
    debt: Debt
  ): Promise<void> {

    this.errorMessage = '';

    try {

      await firstValueFrom(
        this.http.delete<void>(
          `${this.apiUrl}/${debt.id}`
        )
      );

      const index = this.debts.findIndex(
        item => item.id === debt.id
      );

      if (index >= 0) {
        this.debts.splice(index, 1);
      }

    } catch (error) {

      this.errorMessage =
        'Could not delete debt.';

      console.error(error);

      throw error;

    }
  }

  // =========================================
  // TEMPORARY COMPATIBILITY
  // =========================================

  // Die alten Angular-Seiten verwenden diese
  // Methoden noch. Wir stellen sie im nächsten
  // Schritt auf die neuen API-Methoden um.

  addDebt(
    debt: Omit<Debt, 'id'>
  ): Debt {

    throw new Error(
      'Creating debts requires an Expense ID and ' +
      'a valid Debtor ID. Use createDebtInBackend().'
    );
  }

  deleteDebt(debt: Debt): void {

    void this.deleteDebtInBackend(debt)
      .catch(error => {
        console.error('Delete failed:', error);
      });
  }

  markAsPaid(debt: Debt): void {

    void this.markAsPaidInBackend(debt)
      .catch(error => {
        console.error('Payment update failed:', error);
      });
  }

  reopenDebt(debt: Debt): void {

    void this.reopenDebtInBackend(debt)
      .catch(error => {
        console.error('Reopen failed:', error);
      });
  }
}