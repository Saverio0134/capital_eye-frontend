import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateTransactionPayload, Transaction } from '../../../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionApi {
  readonly base = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  createTransaction(transactionData: CreateTransactionPayload): Observable<Transaction> {
    return this.http.post<Transaction>(this.base, transactionData);
  }

  deleteTransaction(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${uuid}`);
  }
}
