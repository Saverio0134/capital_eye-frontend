import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { TableModule } from 'primeng/table';
import { BarChartComponent } from '../../shared/components/bar-chart/bar-chart';
import { BarChartSeries } from '../../shared/components/bar-chart/config/bar-chart.config';
import { LiquidityStore } from '../../services/store/liquidity-store/liquidity-store';
import { FinancialAccountStore } from '../../services/store/financial-account-store/financial-account-store';
import { LucideAngularModule, PencilIcon, PlusIcon } from 'lucide-angular';
import { FinancialAccount } from '../../models/financial-account.model';
import { LiquidityMonthlyTableAccount } from '../../models/liquidity.model';
import { SaveFinancialAccount } from './save-financial-account/save-financial-account';

interface BankCard {
  key: string;
  name: string;
  currentBalance: number;
  delta: number;
  financialAccount: FinancialAccount;
}

interface HistoryRow {
  mese: string;
  values: Record<string, number>;
  delta: number;
}

function monthKeyToLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;

  const date = new Date(Date.UTC(year, month - 1, 1));
  const label = new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function compareMonthDesc(a: string, b: string): number {
  return new Date(`${b}-01T00:00:00Z`).getTime() - new Date(`${a}-01T00:00:00Z`).getTime();
}

function compareMonthAsc(a: string, b: string): number {
  return new Date(`${a}-01T00:00:00Z`).getTime() - new Date(`${b}-01T00:00:00Z`).getTime();
}

@Component({
  selector: 'app-liquidity',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ButtonModule,
    CarouselModule,
    TableModule,
    BarChartComponent,
    LucideAngularModule,
    SaveFinancialAccount,
  ],
  templateUrl: './liquidity.html',
  styleUrl: './liquidity.css',
})
export default class Liquidity {
  readonly PlusIcon = PlusIcon;
  readonly PencilIcon = PencilIcon;
  private liquidityStore = inject(LiquidityStore);
  private financialAccountStore = inject(FinancialAccountStore);

  readonly isSaveFinancialAccountDialogOpen = signal(false);
  readonly selectedFinancialAccount = signal<FinancialAccount | null>(null);

  readonly liquiditySummary = computed(() => this.liquidityStore.totalLatestLiquidity());
  readonly monthlyTable = computed(() => this.liquidityStore.monthlyTable());
  readonly isTableLoading = computed(() => this.liquidityStore.monthlyTableResource().isLoading());

  readonly accounts = computed<LiquidityMonthlyTableAccount[]>(() => {
    const monthlyAccounts = this.monthlyTable()?.accounts ?? [];
    const mergedAccounts = new Map(monthlyAccounts.map((account) => [account.uuid, account]));

    for (const account of this.financialAccountStore.financialAccounts()) {
      mergedAccounts.set(account.uuid, {
        uuid: account.uuid,
        name: account.name,
        type: account.type,
        currency: account.currency,
      });
    }

    return Array.from(mergedAccounts.values());
  });

  readonly history = computed<HistoryRow[]>(() => {
    const rows = this.monthlyTable()?.rows ?? [];
    return [...rows]
      .sort((a, b) => compareMonthDesc(a.month, b.month))
      .map((row) => ({
        mese: monthKeyToLabel(row.month),
        values: row.values,
        delta: row.totalDelta,
      }));
  });

  readonly banks = computed<BankCard[]>(() => {
    const accounts = this.accounts();
    const latestRow = [...(this.monthlyTable()?.rows ?? [])].sort((a, b) =>
      compareMonthDesc(a.month, b.month),
    )[0];

    return accounts.map((account) => ({
      key: account.uuid,
      name: account.name,
      currentBalance: latestRow?.values?.[account.uuid] ?? 0,
      delta: latestRow?.deltas?.[account.uuid] ?? 0,
      financialAccount: {
        uuid: account.uuid,
        name: account.name,
        type: account.type,
        currency: account.currency,
      },
    }));
  });

  // readonly isCarouselMode = computed(() => this.banks().length > 3);

  readonly bankCarouselResponsiveOptions = [
    { breakpoint: '1400px', numVisible: 3, numScroll: 1 },
    { breakpoint: '1024px', numVisible: 2, numScroll: 1 },
    { breakpoint: '640px', numVisible: 1, numScroll: 1 },
  ];

  readonly totalLiquidity = computed(() => this.liquiditySummary()?.totalLiquidity ?? 0);

  readonly chartRows = computed(() =>
    [...(this.monthlyTable()?.rows ?? [])].sort((a, b) => compareMonthAsc(a.month, b.month)),
  );

  readonly chartLabels = computed(() => this.chartRows().map((row) => monthKeyToLabel(row.month)));

  readonly chartSeries = computed<BarChartSeries[]>(() =>
    this.accounts().map((account) => ({
      label: account.name,
      values: this.chartRows().map((row) => row.values[account.uuid] ?? 0),
    })),
  );

  onCreateBank() {
    this.selectedFinancialAccount.set(null);
    this.isSaveFinancialAccountDialogOpen.set(true);
  }

  onEditBank(financialAccount: FinancialAccount): void {
    this.selectedFinancialAccount.set(financialAccount);
    this.isSaveFinancialAccountDialogOpen.set(true);
  }

  onFinancialAccountSaved(): void {
    this.financialAccountStore.reloadFinancialAccounts();
    this.liquidityStore.reloadLiquidityData();
  }
}
