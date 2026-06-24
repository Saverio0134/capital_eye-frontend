import { computed, inject, Injectable } from '@angular/core';
import { FinancialAccountApi } from '../../api/financial-account-api/financial-account-api';
import { httpResource } from '@angular/common/http';
import { MonthlyNetWorthWithGrowth } from '../../../models/networth.model';
import { AuthStore } from '../auth-store/auth-store';
import { readResourceValue } from '../../../utils/resource.utils';

const EMPTY_MONTHLY_NET_WORTH_WITH_GROWTH: MonthlyNetWorthWithGrowth = {
  monthlyNetWorth: [],
  growth: {
    oneMonth: 0,
    threeMonths: 0,
    sixMonths: 0,
    year: 0,
  },
  dateLastSnapshot: {
    asset: new Date(0),
    liquidity: new Date(0),
  },
};

@Injectable({
  providedIn: 'root',
})
export class SnapshotStore {
  private financialAccountApi = inject(FinancialAccountApi);
  private authStore = inject(AuthStore);
  private readonly httpSnapshotNetWorthResource = httpResource<MonthlyNetWorthWithGrowth>(
    () => {
      const token = this.authStore.authToken();
      if (!token) return undefined;
      return this.financialAccountApi.snapshotNetWorth;
    },
    {
      defaultValue: EMPTY_MONTHLY_NET_WORTH_WITH_GROWTH,
    },
  );

  readonly snapshotNetWorthResource = computed(() =>
    this.httpSnapshotNetWorthResource.asReadonly(),
  );

  readonly snapshotNetWorth = computed<MonthlyNetWorthWithGrowth | undefined>(() => {
    return readResourceValue(this.snapshotNetWorthResource());
  });
}
