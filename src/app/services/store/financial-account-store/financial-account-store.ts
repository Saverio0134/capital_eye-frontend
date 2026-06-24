import { httpResource } from '@angular/common/http';
import { computed, effect, inject, Injectable } from '@angular/core';
import { FinancialAccount } from '../../../models/financial-account.model';
import { FinancialAccountApi } from '../../api/financial-account-api/financial-account-api';
import { AuthStore } from '../auth-store/auth-store';
import { createOptimisticCollectionState } from '../../../utils/optimistic-collection.utils';
import { readResourceValueOr } from '../../../utils/resource.utils';

@Injectable({
  providedIn: 'root',
})
export class FinancialAccountStore {
  private financialAccountApi = inject(FinancialAccountApi);
  private authStore = inject(AuthStore);
  private readonly optimisticFinancialAccounts = createOptimisticCollectionState<
    FinancialAccount,
    string
  >((account) => account.uuid);
  private wasLoadingFinancialAccounts = false;

  private readonly httpFinancialAccountsResource = httpResource<FinancialAccount[]>(
    () => {
      const token = this.authStore.authToken();
      if (!token) return undefined;
      return this.financialAccountApi.financialAccounts;
    },
    {
      defaultValue: [],
      parse: (resp) => resp as FinancialAccount[],
    },
  );

  readonly financialAccountsResource = computed(() =>
    this.httpFinancialAccountsResource.asReadonly(),
  );

  readonly financialAccounts = computed<FinancialAccount[]>(() => {
    const baseAccounts = readResourceValueOr(this.financialAccountsResource(), []);
    return this.optimisticFinancialAccounts.applyTo(baseAccounts);
  });

  constructor() {
    effect(() => {
      const isLoading = this.financialAccountsResource().isLoading();

      if (this.wasLoadingFinancialAccounts && !isLoading) {
        const resolvedAccounts = readResourceValueOr(this.financialAccountsResource(), []);
        const resolvedAccountIds = new Set(resolvedAccounts.map((account) => account.uuid));
        this.optimisticFinancialAccounts.reconcileWithResolvedIds(resolvedAccountIds);
      }

      this.wasLoadingFinancialAccounts = isLoading;
    });
  }

  upsertOptimisticFinancialAccount(account: FinancialAccount): void {
    this.optimisticFinancialAccounts.upsert(account);
  }

  replaceOptimisticFinancialAccount(tempUuid: string, account: FinancialAccount): void {
    this.optimisticFinancialAccounts.replace(tempUuid, account);
  }

  removeOptimisticFinancialAccount(uuid: string): void {
    this.optimisticFinancialAccounts.remove(uuid);
  }

  reloadFinancialAccounts(): boolean {
    return this.httpFinancialAccountsResource.reload();
  }
}
