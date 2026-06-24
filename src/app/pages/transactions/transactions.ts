import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Asset, Currency } from '../../models/asset.model';
import { FinancialAccount } from '../../models/financial-account.model';
import {
  CreateLiquiditySnapshotPayload,
  CreateTransactionPayload,
  LiquiditySnapshotWithAccount,
  Transaction,
} from '../../models/transaction.model';
import { LiquiditySnapshotApi } from '../../services/api/liquidity-snapshot-api/liquidity-snapshot-api';
import { TransactionApi } from '../../services/api/transaction-api/transaction-api';
import { AssetStore } from '../../services/store/asset-store/asset-store';
import { FinancialAccountStore } from '../../services/store/financial-account-store/financial-account-store';
import { LiquidityStore } from '../../services/store/liquidity-store/liquidity-store';
import { TransactionStore } from '../../services/store/transaction-store/transaction-store';
import { RegisterEntryDetailDialog } from './components/register-entry-detail-dialog/register-entry-detail-dialog';
import { RegisterForm } from './components/register-form/register-form';
import {
  AssetRegisterEntry,
  LiquidityRegisterEntry,
  RegisterEntry,
  RegisterTab,
} from './transactions.types';

// Normalizza le date API.
function parseApiDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

// function compareEntriesByDateDesc(a: RegisterEntry, b: RegisterEntry): number {
//   return b.date.getTime() - a.date.getTime();
// }

@Component({
  selector: 'app-transactions',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ButtonModule,
    RegisterEntryDetailDialog,
    RegisterForm,
    TableModule,
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Transactions {
  private readonly financialAccountStore = inject(FinancialAccountStore);
  private readonly assetStore = inject(AssetStore);
  private readonly transactionStore = inject(TransactionStore);
  private readonly liquidityStore = inject(LiquidityStore);
  private readonly liquiditySnapshotApi = inject(LiquiditySnapshotApi);
  private readonly transactionApi = inject(TransactionApi);

  readonly activeTab = signal<RegisterTab>('liquidity');
  readonly isSavingLiquidity = signal(false);
  readonly isSavingTransaction = signal(false);
  readonly selectedEntry = signal<RegisterEntry | null>(null);
  readonly optimisticEntries = signal<RegisterEntry[]>([]);
  readonly optimisticDeletedEntries = signal<Array<{ id: string; kind: RegisterTab }>>([]);
  readonly liquidityResetToken = signal(0);
  readonly assetResetToken = signal(0);

  private previousLiquidityLoading = false;
  private previousTransactionsLoading = false;
  readonly financialAccounts = computed(() => this.financialAccountStore.financialAccounts());

  readonly allAssets = computed<Asset[]>(() => {
    const intangible = this.assetStore.intangibleAssets()?.assets ?? [];
    const physical = this.assetStore.physicalAssets()?.assets ?? [];
    return [...intangible, ...physical].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  });

  readonly accountMap = computed(() => {
    return new Map(
      this.financialAccountStore.financialAccounts().map((account) => [account.uuid, account]),
    );
  });

  readonly rowsPerPageOptions = [15, 30, 50];

  readonly baseEntries = computed(() => {
    return this.toRegisterEntries(
      this.liquidityStore.allSnapshots(),
      this.transactionStore.assetTransactions(),
    );
  });

  readonly mergedEntries = computed(() => {
    const optimisticEntries = this.optimisticEntries();
    const optimisticDeletedEntries = this.optimisticDeletedEntries();
    const hiddenEntryIds = new Set(optimisticDeletedEntries.map((entry) => entry.id));
    const optimisticEntryIds = new Set(optimisticEntries.map((entry) => entry.id));

    const baseEntries = this.baseEntries().filter(
      (entry) => !hiddenEntryIds.has(entry.id) && !optimisticEntryIds.has(entry.id),
    );

    return [...optimisticEntries, ...baseEntries];
  });

  readonly tableRows = computed(() => {
    const activeTab = this.activeTab();
    return this.mergedEntries().filter((entry) => entry.kind === activeTab);
  });

  readonly isLoadingEntries = computed(() => {
    return (
      this.liquidityStore.allSnapshotsResource().isLoading() ||
      this.transactionStore.assetTransactionsResource().isLoading()
    );
  });

  // Inizializza gli effect pagina.
  constructor() {
    effect(() => {
      const isLiquidityLoading = this.liquidityStore.allSnapshotsResource().isLoading();
      if (this.previousLiquidityLoading && !isLiquidityLoading) {
        this.clearOptimisticEntriesForKind('liquidity');
      }
      this.previousLiquidityLoading = isLiquidityLoading;
    });

    effect(() => {
      const isTransactionsLoading = this.transactionStore.assetTransactionsResource().isLoading();
      if (this.previousTransactionsLoading && !isTransactionsLoading) {
        this.clearOptimisticEntriesForKind('assets');
      }
      this.previousTransactionsLoading = isTransactionsLoading;
    });
  }

  // Cambia il tab attivo.
  setActiveTab(tab: RegisterTab): void {
    this.activeTab.set(tab);
  }

  // Apre il dettaglio riga.
  openEntryDetails(entry: RegisterEntry): void {
    this.selectedEntry.set(entry);
  }

  // Chiude il dettaglio riga.
  closeEntryDetails(): void {
    this.selectedEntry.set(null);
  }

  // Salva uno snapshot liquidita.
  async saveLiquiditySnapshot(payload: CreateLiquiditySnapshotPayload): Promise<void> {
    this.isSavingLiquidity.set(true);
    const optimisticEntry = this.buildOptimisticLiquidityEntry(payload);
    this.optimisticEntries.update((entries) => [optimisticEntry, ...entries]);

    try {
      await firstValueFrom(this.liquiditySnapshotApi.createSnapshot(payload));
      this.liquidityResetToken.update((token) => token + 1);
      this.liquidityStore.reloadLiquidityData();
    } catch {
      this.removeOptimisticEntry(optimisticEntry.id);
    } finally {
      this.isSavingLiquidity.set(false);
    }
  }

  // Salva una transazione asset.
  async saveAssetTransaction(payload: CreateTransactionPayload): Promise<void> {
    this.isSavingTransaction.set(true);
    const optimisticEntry = this.buildOptimisticAssetEntry(payload);
    this.optimisticEntries.update((entries) => [optimisticEntry, ...entries]);

    try {
      await firstValueFrom(this.transactionApi.createTransaction(payload));
      this.assetResetToken.update((token) => token + 1);
      this.assetStore.reloadAssets();
      this.transactionStore.reloadTransactions();
    } catch {
      this.removeOptimisticEntry(optimisticEntry.id);
    } finally {
      this.isSavingTransaction.set(false);
    }
  }

  // Elimina una riga gestibile.
  async deleteEntry(entry: RegisterEntry): Promise<void> {
    if (!entry.canDelete) {
      return;
    }

    this.optimisticDeletedEntries.update((entries) => [
      ...entries,
      { id: entry.id, kind: entry.kind },
    ]);
    this.closeEntryDetails();

    try {
      if (entry.kind === 'liquidity') {
        await firstValueFrom(this.liquiditySnapshotApi.deleteSnapshot(entry.snapshot.uuid));
        this.liquidityStore.reloadLiquidityData();
      } else if (entry.kind === 'assets') {
        await firstValueFrom(this.transactionApi.deleteTransaction(entry.transaction.uuid));
        this.assetStore.reloadAssets();
        this.transactionStore.reloadTransactions();
      }
    } catch {
      this.restoreOptimisticDeletedEntry(entry.id);
    }
  }

  // Mostra la label delete.
  getEntryDeleteLabel(entry: RegisterEntry): string {
    return entry.canDelete ? 'Elimina' : 'Non disponibile';
  }

  // Rimuove una riga ottimistica.
  private removeOptimisticEntry(entryId: string): void {
    this.optimisticEntries.update((entries) => entries.filter((entry) => entry.id !== entryId));
  }

  // Ripristina una riga nascosta.
  private restoreOptimisticDeletedEntry(entryId: string): void {
    this.optimisticDeletedEntries.update((entries) =>
      entries.filter((entry) => entry.id !== entryId),
    );
  }

  // Pulisce gli stati ottimistici.
  private clearOptimisticEntriesForKind(kind: RegisterTab): void {
    this.optimisticEntries.update((entries) => entries.filter((entry) => entry.kind !== kind));
    this.optimisticDeletedEntries.update((entries) =>
      entries.filter((entry) => entry.kind !== kind),
    );
  }

  // Crea la riga liquidita.
  private buildOptimisticLiquidityEntry(
    payload: CreateLiquiditySnapshotPayload,
  ): LiquidityRegisterEntry {
    const account = this.accountMap().get(payload.accountUuid) ?? null;
    const date = new Date(payload.date);
    const id = `optimistic-liquidity-${Date.now()}`;

    return {
      id,
      kind: 'liquidity',
      typeLabel: 'LIQUIDITÀ',
      elementLabel: account?.name ?? 'Financial account',
      currency: account?.currency ?? Currency.EUR,
      quantity: null,
      price: null,
      total: payload.amount,
      date,
      canDelete: false,
      isOptimistic: true,
      snapshot: {
        uuid: id,
        accountUuid: payload.accountUuid,
        date,
        amount: payload.amount,
        createdAt: new Date(),
        account:
          account ??
          ({
            uuid: payload.accountUuid,
            name: 'Financial account',
            type: 'BANK',
            currency: Currency.EUR,
          } as FinancialAccount),
      },
      account:
        account ??
        ({
          uuid: payload.accountUuid,
          name: 'Financial account',
          type: 'BANK',
          currency: Currency.EUR,
        } as FinancialAccount),
    };
  }

  // Crea la riga asset.
  private buildOptimisticAssetEntry(payload: CreateTransactionPayload): AssetRegisterEntry {
    const asset = this.allAssets().find((item) => item.uuid === payload.assetUuid) ?? null;
    const account = this.accountMap().get(payload.accountUuid) ?? null;
    const date = new Date(payload.date);
    const id = `optimistic-asset-${Date.now()}`;
    const quantity = payload.quantity;
    const total = payload.totalAmount;

    return {
      id,
      kind: 'assets',
      typeLabel: payload.type === 'BUY' ? 'ACQUISTO' : 'VENDITA',
      elementLabel: asset?.name ?? 'Asset',
      currency: account?.currency ?? asset?.valuationCurrency ?? Currency.EUR,
      quantity,
      price: quantity > 0 ? total / quantity : null,
      total,
      date,
      canDelete: false,
      isOptimistic: true,
      transaction: {
        uuid: id,
        assetUuid: payload.assetUuid,
        accountUuid: payload.accountUuid,
        type: payload.type,
        date,
        quantity,
        totalAmount: total,
        fees: null,
        notes: null,
        realizedGain: null,
        taxAmount: null,
        createdAt: new Date(),
      },
      asset:
        asset ??
        ({
          uuid: payload.assetUuid,
          userId: '',
          name: 'Asset',
          type: 'STOCK',
          baseCurrency: Currency.EUR,
          ticker: null,
          isCustom: false,
          metalType: null,
          weightGrams: null,
          purity: null,
          quantity: 0,
          currentPrice: 0,
          totalValue: 0,
          valuationCurrency: account?.currency ?? Currency.EUR,
          positions: [],
          lastMarketUpdate: null,
          averageBuyPrice: 0,
          taxRate: 0,
          netValue: 0,
          unrealizedGain: 0,
          updatedAt: new Date(),
        } as Asset),
      account: account ?? null,
    };
  }

  // Converte i dati tabella.
  private toRegisterEntries(
    snapshots: LiquiditySnapshotWithAccount[],
    assetTransactions: Transaction[],
  ): RegisterEntry[] {
    const accountMap = this.accountMap();
    const assetMap = new Map(this.allAssets().map((asset) => [asset.uuid, asset]));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const liquidityEntries: LiquidityRegisterEntry[] = snapshots.map((snapshot) => ({
      id: `liquidity-${snapshot.uuid}`,
      kind: 'liquidity',
      typeLabel: 'LIQUIDITÀ',
      elementLabel: snapshot.account.name,
      currency: snapshot.account.currency,
      quantity: null,
      price: null,
      total: snapshot.amount,
      date: parseApiDate(snapshot.date),
      canDelete: true,
      snapshot: {
        ...snapshot,
        date: parseApiDate(snapshot.date),
        createdAt: parseApiDate(snapshot.createdAt),
      },
      account: snapshot.account,
    }));

    const assetEntries: AssetRegisterEntry[] = assetTransactions.map((transaction) => {
      const transactionDate = parseApiDate(transaction.date);

      return {
        id: `asset-transaction-${transaction.uuid}`,
        kind: 'assets',
        typeLabel: transaction.type === 'BUY' ? 'ACQUISTO' : 'VENDITA',
        elementLabel: assetMap.get(transaction.assetUuid)?.name ?? 'Asset',
        currency:
          accountMap.get(transaction.accountUuid)?.currency ??
          assetMap.get(transaction.assetUuid)?.valuationCurrency ??
          Currency.EUR,
        quantity: transaction.quantity,
        price: transaction.quantity > 0 ? transaction.totalAmount / transaction.quantity : null,
        total: transaction.totalAmount,
        date: transactionDate,
        canDelete: transactionDate >= thirtyDaysAgo,
        transaction: {
          ...transaction,
          date: transactionDate,
          createdAt: parseApiDate(transaction.createdAt),
        },
        asset: assetMap.get(transaction.assetUuid) ?? null,
        account: accountMap.get(transaction.accountUuid) ?? null,
      };
    });

    return [...liquidityEntries, ...assetEntries].sort(
      (left, right) => right.date.getTime() - left.date.getTime(),
    );
  }
}
