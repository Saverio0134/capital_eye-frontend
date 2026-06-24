import { CurrencyPipe, DatePipe, DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DistributionChart } from '../../shared/components/distribution-chart/distribution-chart';
import { TrendChart } from '../../shared/components/trend-chart/trend-chart';
import { AssetStore } from '../../services/store/asset-store/asset-store';
import { LiquidityStore } from '../../services/store/liquidity-store/liquidity-store';
import { SnapshotStore } from '../../services/store/snapshot-store/snapshot-store';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card';
@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DistributionChart,
    TrendChart,
    DecimalPipe,
    DatePipe,
    SummaryCardComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export default class Dashboard implements OnInit, OnDestroy {
  liquidityStore = inject(LiquidityStore);
  assetStore = inject(AssetStore);
  snapshotStore = inject(SnapshotStore);

  // Deriva il trend mensile solo quando la resource ha un valore leggibile.
  monthlyNetWorth = computed(() => this.snapshotStore.snapshotNetWorth()?.monthlyNetWorth ?? []);

  liquidity = computed(() => {
    return this.liquidityStore.totalLatestLiquidity()?.totalLiquidity ?? 0;
  });
  growthLiquidity = computed(() => {
    return this.liquidityStore.totalLatestLiquidity()?.growth.oneMonth ?? 0;
  });

  intangibleAssets = computed(() => {
    return this.assetStore.intangibleAssets()?.netTotal ?? 0;
  });

  growthIntangible = computed(() => this.assetStore.intangibleAssets()?.growth.oneMonth ?? 0);

  physicalAssets = computed(() => {
    return this.assetStore.physicalAssets()?.netTotal ?? 0;
  });

  distributionLabels = computed(() => ['Liquidità', 'Investimenti', 'Assets Fisici']);
  distributionValues = computed(() => [this.liquidity(), this.intangibleAssets(), this.physicalAssets()]);

  growthPhysical = computed(() => this.assetStore.physicalAssets()?.growth.oneMonth ?? 0);

  isGlobalLoading = computed(() => {
    return (
      this.liquidityStore.totalLatestLiquidityResource().isLoading() ||
      this.assetStore.assetsResource().isLoading() ||
      this.snapshotStore.snapshotNetWorthResource().isLoading()
    );
  });

  lastUpdate = computed(() => {
    if (this.isGlobalLoading()) return undefined;

    const liquidity = this.liquidityStore.totalLatestLiquidity()?.lastUpdate;
    const physical = this.assetStore.physicalAssets()?.lastUpdate;
    const intangible = this.assetStore.intangibleAssets()?.lastUpdate;

    // Se uno o più valori possono essere undefined/null, filtrali
    const dates = [liquidity, physical, intangible].filter(Boolean) as Date[];

    if (dates.length === 0) return undefined;

    // Torna la data più grande
    return new Date(Math.max(...dates.map((d) => new Date(d).getTime())));
  });
  totalWealth = computed(() => {
    if (this.isGlobalLoading()) return this.randomNumber();
    return this.intangibleAssets() + this.liquidity() + this.physicalAssets();
  });

  // Calcola la crescita netta evitando di leggere la resource in stato error.
  growthNetWorth = computed(() => {
    return this.snapshotStore.snapshotNetWorth()?.growth.oneMonth ?? 0;
  });

  randomNumber = signal(0);

  private intervalId: any;

  constructor() {
    effect(() => {
      if (this.isGlobalLoading()) return;
      clearInterval(this.intervalId);
      this.randomNumber.set(0);
    });
  }

  ngOnInit() {
    this.simulateLoading();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  simulateLoading() {
    this.intervalId = setInterval(() => {
      this.randomNumber.set(this.generateRandomValue(10000, 100000));
    }, 70);
  }

  private generateRandomValue(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
