import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateFinancialAccountPayload,
  FinancialAccount,
  UpdateFinancialAccountPayload,
} from '../../../models/financial-account.model';
@Injectable({
  providedIn: 'root',
})
export class FinancialAccountApi {
  readonly base = `${environment.apiUrl}/financial-accounts`;
  readonly financialAccounts = this.base;
  readonly financialAccountByUuid = (uuid: string) => `${this.base}/${uuid}`;
  readonly snapshotNetWorth = `${this.base}/snapshot-net-worth`;

  private http = inject(HttpClient);

  fetchFinancialAccounts(): Observable<FinancialAccount[]> {
    return this.http.get<FinancialAccount[]>(this.financialAccounts);
  }

  createFinancialAccount(
    accountData: CreateFinancialAccountPayload,
  ): Observable<FinancialAccount> {
    return this.http.post<FinancialAccount>(this.base, accountData);
  }

  updateFinancialAccount(
    uuid: string,
    accountData: UpdateFinancialAccountPayload,
  ): Observable<FinancialAccount> {
    return this.http.put<FinancialAccount>(`${this.base}/${uuid}`, accountData);
  }

  deleteFinancialAccount(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${uuid}`);
  }
}
