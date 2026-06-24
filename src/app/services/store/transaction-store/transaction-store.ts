import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { Transaction } from '../../../models/transaction.model';
import { TransactionApi } from '../../api/transaction-api/transaction-api';
import { AuthStore } from '../auth-store/auth-store';
import { readResourceValueOr } from '../../../utils/resource.utils';

function parseApiDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

@Injectable({
  providedIn: 'root',
})
export class TransactionStore {
  private readonly transactionApi = inject(TransactionApi);
  private readonly authStore = inject(AuthStore);

  private readonly httpAssetTransactionsResource = httpResource<Transaction[]>(
    () => {
      const token = this.authStore.authToken();

      if (!token) {
        return undefined;
      }

      return this.transactionApi.base;
    },
    {
      defaultValue: [],
      parse: (response) =>
        (response as Transaction[]).map((transaction) => ({
          ...transaction,
          date: parseApiDate(transaction.date),
          createdAt: parseApiDate(transaction.createdAt),
        })),
    },
  );

  readonly assetTransactionsResource = computed(() =>
    this.httpAssetTransactionsResource.asReadonly(),
  );

  readonly assetTransactions = computed<Transaction[]>(() => {
    return readResourceValueOr(this.assetTransactionsResource(), []);
  });

  reloadTransactions(): boolean {
    return this.httpAssetTransactionsResource.reload();
  }
}
