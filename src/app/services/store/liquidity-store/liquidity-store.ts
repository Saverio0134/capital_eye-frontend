import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { LiquiditySnapshotApi } from '../../api/liquidity-snapshot-api/liquidity-snapshot-api';
import { AuthStore } from '../auth-store/auth-store';
import {
  LiquidityMonthlyTable,
  LiquidityWithGrowth,
} from '../../../models/liquidity.model';
import { LiquiditySnapshotWithAccount } from '../../../models/transaction.model';
import { readResourceValueOr } from '../../../utils/resource.utils';

const EMPTY_LIQUIDITY_WITH_GROWTH: LiquidityWithGrowth = {
  totalLiquidity: 0,
  growth: {
    oneMonth: 0,
    threeMonths: 0,
    sixMonths: 0,
    year: 0,
  },
  lastUpdate: new Date(),
};

const EMPTY_LIQUIDITY_MONTHLY_TABLE: LiquidityMonthlyTable = {
  accounts: [],
  rows: [],
};

@Injectable({
  providedIn: 'root',
})
export class LiquidityStore {
  private liquiditySnapshotApi = inject(LiquiditySnapshotApi);
  private authStore = inject(AuthStore);
  //totale liquidità
  private readonly httpTotalLatestLiquidityResource = httpResource<LiquidityWithGrowth>(
    () => {
      const token = this.authStore.authToken();
      if (!token) return undefined;
      return this.liquiditySnapshotApi.totalLatestLiquidity;
    },
    {
      defaultValue: EMPTY_LIQUIDITY_WITH_GROWTH,
    },
  );

  //all snapshots
  private readonly httpMonthlyTableResource = httpResource<LiquidityMonthlyTable>(
    () => {
      const token = this.authStore.authToken();
      if (!token) return undefined;
      return this.liquiditySnapshotApi.monthlyTable;
    },
    {
      defaultValue: EMPTY_LIQUIDITY_MONTHLY_TABLE,
    },
  );

  private readonly httpAllSnapshotsResource = httpResource<LiquiditySnapshotWithAccount[]>(
    () => {
      const token = this.authStore.authToken();
      if (!token) return undefined;
      return this.liquiditySnapshotApi.base;
    },
    {
      defaultValue: [],
      parse: (resp) => resp as LiquiditySnapshotWithAccount[],
    },
  );

  readonly totalLatestLiquidityResource = computed(() =>
    this.httpTotalLatestLiquidityResource.asReadonly(),
  );
  readonly totalLatestLiquidity = computed<LiquidityWithGrowth | undefined>(() => {
    return readResourceValueOr(this.totalLatestLiquidityResource(), EMPTY_LIQUIDITY_WITH_GROWTH);
  });

  readonly monthlyTableResource = computed(() => this.httpMonthlyTableResource.asReadonly());
  readonly monthlyTable = computed<LiquidityMonthlyTable | undefined>(() => {
    return readResourceValueOr(this.monthlyTableResource(), EMPTY_LIQUIDITY_MONTHLY_TABLE);
  });

  readonly allSnapshotsResource = computed(() => this.httpAllSnapshotsResource.asReadonly());
  readonly allSnapshots = computed<LiquiditySnapshotWithAccount[]>(() => {
    return readResourceValueOr(this.allSnapshotsResource(), []);
  });

  reloadLiquidityData(): boolean {
    const totalReloaded = this.httpTotalLatestLiquidityResource.reload();
    const monthlyTableReloaded = this.httpMonthlyTableResource.reload();
    const allSnapshotsReloaded = this.httpAllSnapshotsResource.reload();
    return totalReloaded || monthlyTableReloaded || allSnapshotsReloaded;
  }
}
