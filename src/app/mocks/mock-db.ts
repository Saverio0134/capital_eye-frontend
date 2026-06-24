// Stato in memoria mutabile per la modalita demo: carica i seed all'avvio e
// fornisce primitive CRUD che mantengono coerenza tra mutate successive.
import { Asset, AllAssetsWithNet, AssetGroup, AssetType } from '../models/asset.model';
import { FinancialAccount } from '../models/financial-account.model';
import { LiquidityWithGrowth, LiquidityMonthlyTable } from '../models/liquidity.model';
import {
  Transaction,
  LiquiditySnapshotWithAccount,
} from '../models/transaction.model';
import { MonthlyNetWorthWithGrowth } from '../models/networth.model';
import {
  seedFinancialAccounts,
  seedAssetsWithNet,
  seedMonthlyVariations,
  seedSnapshotNetWorth,
  seedLiquiditySnapshots,
  seedTotalLatestLiquidity,
  seedMonthlyTable,
  seedTransactions,
  seedUser,
} from './seed-data';
import { AccountType } from '../enum/account.enum';
import { Currency, MetalType } from '../models/asset.model';

// Genera un identificativo univoco stabile anche quando crypto non e disponibile.
function generateUuid(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Ricalcola i totali e il growth di un gruppo asset in base allo stato corrente.
function recomputeAssetGroup(group: AssetGroup): AssetGroup {
  const assets = group.assets ?? [];
  const netTotal = Number(assets.reduce((sum, asset) => sum + asset.netValue, 0).toFixed(2));
  const lastUpdate = assets.reduce<Date | undefined>((latest, asset) => {
    const candidate = asset.updatedAt ?? asset.lastMarketUpdate ?? null;
    if (!candidate) return latest;
    if (!latest) return new Date(candidate);
    return new Date(candidate).getTime() > latest.getTime() ? new Date(candidate) : latest;
  }, undefined);
  return { ...group, assets, netTotal, lastUpdate };
}

// Aggiorna il gruppo "all assets" dopo mutate su un asset.
function recomputeAllAssetsWithNet(current: AllAssetsWithNet): AllAssetsWithNet {
  return {
    intangibleAssets: recomputeAssetGroup(current.intangibleAssets),
    physicalAssets: recomputeAssetGroup(current.physicalAssets),
  };
}

// Costruisce un asset completo da payload di creazione, applicando defaults coerenti.
function buildAssetFromPayload(payload: Record<string, unknown>, account: FinancialAccount | undefined): Asset {
  const uuid = generateUuid('asset');
  const quantity = typeof payload['quantity'] === 'number' ? payload['quantity'] : 0;
  const currentPrice = typeof payload['currentPrice'] === 'number' ? payload['currentPrice'] : 0;
  const averageBuyPrice = typeof payload['averageBuyPrice'] === 'number' ? payload['averageBuyPrice'] : 0;
  const totalValue = Number((quantity * currentPrice).toFixed(2));
  const costBasis = Number((quantity * averageBuyPrice).toFixed(2));
  const unrealizedGain = Number((totalValue - costBasis).toFixed(2));
  const taxRate = typeof payload['taxRate'] === 'number' ? payload['taxRate'] : 0.26;
  const tax = Number((Math.max(unrealizedGain, 0) * taxRate).toFixed(2));
  const netValue = Number((totalValue - tax).toFixed(2));
  const accountUuid = typeof payload['accountUuid'] === 'string' ? payload['accountUuid'] : '';
  const positions =
    account && accountUuid
      ? [
          {
            uuid: generateUuid('pos'),
            accountUuid,
            accountName: account.name,
            accountType: account.type,
            currency: account.currency,
            quantity,
            currentPrice,
            totalValue,
            averageBuyPrice,
            lastMarketUpdate: new Date(),
          },
        ]
      : [];

  return {
    uuid,
    userId: 'demo-user',
    name: typeof payload['name'] === 'string' ? payload['name'] : 'Asset',
    type: (payload['type'] as AssetType) ?? AssetType.STOCK,
    baseCurrency: (payload['baseCurrency'] as Currency) ?? Currency.EUR,
    ticker: typeof payload['ticker'] === 'string' ? payload['ticker'] : null,
    isCustom: Boolean(payload['isCustom']),
    metalType: (payload['metalType'] as MetalType | null) ?? null,
    weightGrams: typeof payload['weightGrams'] === 'number' ? payload['weightGrams'] : null,
    purity: typeof payload['purity'] === 'number' ? payload['purity'] : null,
    quantity,
    currentPrice,
    totalValue,
    valuationCurrency: (payload['valuationCurrency'] as Currency) ?? Currency.EUR,
    positions,
    lastMarketUpdate: new Date(),
    averageBuyPrice,
    taxRate,
    netValue,
    unrealizedGain,
    updatedAt: new Date(),
  };
}

// Singolo stato applicativo demo, mutato dagli handler dell'interceptor.
class MockDb {
  readonly user = seedUser;
  private financialAccounts: FinancialAccount[] = seedFinancialAccounts.map((account) => ({ ...account }));
  private allAssetsWithNet: AllAssetsWithNet = seedAssetsWithNet;
  private monthlyVariations: typeof seedMonthlyVariations = seedMonthlyVariations;
  private snapshotNetWorth: MonthlyNetWorthWithGrowth = seedSnapshotNetWorth;
  private liquiditySnapshots: LiquiditySnapshotWithAccount[] = seedLiquiditySnapshots.map((snapshot) => ({ ...snapshot }));
  private totalLatestLiquidity: LiquidityWithGrowth = seedTotalLatestLiquidity;
  private monthlyTable: LiquidityMonthlyTable = seedMonthlyTable;
  private transactions: Transaction[] = seedTransactions.map((transaction) => ({ ...transaction }));

  // Restituisce i conti correnti.
  getFinancialAccounts(): FinancialAccount[] {
    return [...this.financialAccounts];
  }

  // Crea un nuovo conto finanziario.
  createFinancialAccount(payload: Record<string, unknown>): FinancialAccount {
    const uuid = generateUuid('acc');
    const account: FinancialAccount = {
      uuid,
      name: typeof payload['name'] === 'string' ? payload['name'] : 'Conto',
      type: (payload['type'] as AccountType) ?? 'BANK',
      currency: (payload['currency'] as Currency) ?? Currency.EUR,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.financialAccounts = [...this.financialAccounts, account];
    return account;
  }

  // Aggiorna un conto esistente.
  updateFinancialAccount(uuid: string, payload: Record<string, unknown>): FinancialAccount | undefined {
    const index = this.financialAccounts.findIndex((account) => account.uuid === uuid);
    if (index === -1) return undefined;
    const existing = this.financialAccounts[index];
    const updated: FinancialAccount = {
      ...existing,
      name: typeof payload['name'] === 'string' ? payload['name'] : existing.name,
      type: (payload['type'] as AccountType) ?? existing.type,
      currency: (payload['currency'] as Currency) ?? existing.currency,
      updatedAt: new Date(),
    };
    this.financialAccounts = this.financialAccounts.map((account, i) => (i === index ? updated : account));
    return updated;
  }

  // Elimina un conto.
  deleteFinancialAccount(uuid: string): boolean {
    const index = this.financialAccounts.findIndex((account) => account.uuid === uuid);
    if (index === -1) return false;
    this.financialAccounts = this.financialAccounts.filter((account, i) => i !== index);
    return true;
  }

  // Restituisce l'aggregato degli asset.
  getAllAssetsWithNet(): AllAssetsWithNet {
    return this.allAssetsWithNet;
  }

  // Crea un asset (con posizione quando fornita) e ricalcola i gruppi.
  createAsset(payload: Record<string, unknown>): Asset {
    const accountUuid = typeof payload['accountUuid'] === 'string' ? payload['accountUuid'] : '';
    const account = this.financialAccounts.find((entry) => entry.uuid === accountUuid);
    const asset = buildAssetFromPayload(payload, account);
    const intangible = [AssetType.STOCK, AssetType.CRYPTO, AssetType.CASH_EQUIVALENT].includes(asset.type);
    this.allAssetsWithNet = {
      intangibleAssets: {
        ...this.allAssetsWithNet.intangibleAssets,
        assets: intangible
          ? [...this.allAssetsWithNet.intangibleAssets.assets, asset]
          : this.allAssetsWithNet.intangibleAssets.assets,
      },
      physicalAssets: {
        ...this.allAssetsWithNet.physicalAssets,
        assets: !intangible
          ? [...this.allAssetsWithNet.physicalAssets.assets, asset]
          : this.allAssetsWithNet.physicalAssets.assets,
      },
    };
    this.allAssetsWithNet = recomputeAllAssetsWithNet(this.allAssetsWithNet);
    return asset;
  }

  // Aggiorna un asset esistente.
  updateAsset(uuid: string, payload: Record<string, unknown>): Asset | undefined {
    const groups = [this.allAssetsWithNet.intangibleAssets, this.allAssetsWithNet.physicalAssets];
    let updatedAsset: Asset | undefined;
    const nextGroups = groups.map((group) => {
      const assets = group.assets.map((asset) => {
        if (asset.uuid !== uuid) return asset;
        const updated = {
          ...asset,
          name: typeof payload['name'] === 'string' ? payload['name'] : asset.name,
          type: (payload['type'] as AssetType) ?? asset.type,
          baseCurrency: (payload['baseCurrency'] as Currency) ?? asset.baseCurrency,
          isCustom: typeof payload['isCustom'] === 'boolean' ? payload['isCustom'] : asset.isCustom,
          ticker: payload['ticker'] !== undefined ? (payload['ticker'] as string | null) : asset.ticker,
          currentPrice: typeof payload['currentPrice'] === 'number' ? payload['currentPrice'] : asset.currentPrice,
          taxRate: typeof payload['taxRate'] === 'number' ? payload['taxRate'] : asset.taxRate,
          metalType: payload['metalType'] !== undefined ? (payload['metalType'] as MetalType | null) : asset.metalType,
          weightGrams: payload['weightGrams'] !== undefined ? (payload['weightGrams'] as number | null) : asset.weightGrams,
          purity: payload['purity'] !== undefined ? (payload['purity'] as number | null) : asset.purity,
        } as Asset;
        const totalValue = Number((updated.quantity * updated.currentPrice).toFixed(2));
        const costBasis = Number((updated.quantity * updated.averageBuyPrice).toFixed(2));
        const unrealizedGain = Number((totalValue - costBasis).toFixed(2));
        const tax = Number((Math.max(unrealizedGain, 0) * updated.taxRate).toFixed(2));
        updated.totalValue = totalValue;
        updated.unrealizedGain = unrealizedGain;
        updated.netValue = Number((totalValue - tax).toFixed(2));
        updated.updatedAt = new Date();
        updatedAsset = updated;
        return updated;
      });
      return { ...group, assets };
    });
    this.allAssetsWithNet = recomputeAllAssetsWithNet({
      intangibleAssets: nextGroups[0],
      physicalAssets: nextGroups[1],
    });
    return updatedAsset;
  }

  // Elimina un asset.
  deleteAsset(uuid: string): boolean {
    const intangibleIndex = this.allAssetsWithNet.intangibleAssets.assets.findIndex((asset) => asset.uuid === uuid);
    const physicalIndex = this.allAssetsWithNet.physicalAssets.assets.findIndex((asset) => asset.uuid === uuid);
    if (intangibleIndex === -1 && physicalIndex === -1) return false;
    if (intangibleIndex !== -1) {
      this.allAssetsWithNet.intangibleAssets.assets = this.allAssetsWithNet.intangibleAssets.assets.filter(
        (asset) => asset.uuid !== uuid,
      );
    }
    if (physicalIndex !== -1) {
      this.allAssetsWithNet.physicalAssets.assets = this.allAssetsWithNet.physicalAssets.assets.filter(
        (asset) => asset.uuid !== uuid,
      );
    }
    this.allAssetsWithNet = recomputeAllAssetsWithNet(this.allAssetsWithNet);
    return true;
  }

  // Elimina una posizione di un asset.
  deleteAssetPosition(assetUuid: string, positionUuid: string): boolean {
    let removed = false;
    for (const group of [this.allAssetsWithNet.intangibleAssets, this.allAssetsWithNet.physicalAssets]) {
      group.assets = group.assets.map((asset) => {
        if (asset.uuid !== assetUuid) return asset;
        const positions = asset.positions.filter((position) => {
          if (position.uuid === positionUuid) {
            removed = true;
            return false;
          }
          return true;
        });
        return { ...asset, positions };
      });
    }
    if (removed) {
      this.allAssetsWithNet = recomputeAllAssetsWithNet(this.allAssetsWithNet);
    }
    return removed;
  }

  // Restituisce le variazioni mensili.
  getMonthlyVariations() {
    return [...this.monthlyVariations];
  }

  // Restituisce lo snapshot del net worth.
  getSnapshotNetWorth(): MonthlyNetWorthWithGrowth {
    return this.snapshotNetWorth;
  }

  // Restituisce tutti gli snapshot di liquidita.
  getLiquiditySnapshots(): LiquiditySnapshotWithAccount[] {
    return [...this.liquiditySnapshots];
  }

  // Crea uno snapshot di liquidita.
  createLiquiditySnapshot(payload: Record<string, unknown>): LiquiditySnapshotWithAccount | undefined {
    const accountUuid = typeof payload['accountUuid'] === 'string' ? payload['accountUuid'] : '';
    const account = this.financialAccounts.find((entry) => entry.uuid === accountUuid);
    if (!account) return undefined;
    const uuid = generateUuid('snap');
    const date = typeof payload['date'] === 'string' ? payload['date'] : new Date().toISOString();
    const amount = typeof payload['amount'] === 'number' ? payload['amount'] : 0;
    const snapshot: LiquiditySnapshotWithAccount = {
      uuid,
      accountUuid,
      date: new Date(date),
      amount,
      createdAt: new Date(),
      account,
    };
    this.liquiditySnapshots = [...this.liquiditySnapshots, snapshot];
    return snapshot;
  }

  // Elimina uno snapshot di liquidita.
  deleteLiquiditySnapshot(uuid: string): boolean {
    const index = this.liquiditySnapshots.findIndex((snapshot) => snapshot.uuid === uuid);
    if (index === -1) return false;
    this.liquiditySnapshots = this.liquiditySnapshots.filter((snapshot, i) => i !== index);
    return true;
  }

  // Restituisce il totale liquidita aggregato.
  getTotalLatestLiquidity(): LiquidityWithGrowth {
    return this.totalLatestLiquidity;
  }

  // Restituisce la tabella mensile liquidita.
  getMonthlyTable(): LiquidityMonthlyTable {
    return this.monthlyTable;
  }

  // Restituisce tutte le transazioni.
  getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  // Crea una transazione asset.
  createTransaction(payload: Record<string, unknown>): Transaction | undefined {
    const assetUuid = typeof payload['assetUuid'] === 'string' ? payload['assetUuid'] : '';
    const accountUuid = typeof payload['accountUuid'] === 'string' ? payload['accountUuid'] : '';
    const type = payload['type'] === 'SELL' ? 'SELL' : 'BUY';
    const date = typeof payload['date'] === 'string' ? payload['date'] : new Date().toISOString();
    const quantity = typeof payload['quantity'] === 'number' ? payload['quantity'] : 0;
    const totalAmount = typeof payload['totalAmount'] === 'number' ? payload['totalAmount'] : 0;
    const uuid = generateUuid('tx');
    const transaction: Transaction = {
      uuid,
      assetUuid,
      accountUuid,
      type,
      date: new Date(date),
      quantity,
      totalAmount,
      fees: null,
      notes: null,
      realizedGain: null,
      taxAmount: null,
      createdAt: new Date(),
    };
    this.transactions = [...this.transactions, transaction];
    return transaction;
  }

  // Elimina una transazione.
  deleteTransaction(uuid: string): boolean {
    const index = this.transactions.findIndex((transaction) => transaction.uuid === uuid);
    if (index === -1) return false;
    this.transactions = this.transactions.filter((transaction, i) => i !== index);
    return true;
  }

  // Imposta il nome utente.
  setUserName(name: string): void {
    this.user.name = name;
  }
}

export const mockDb = new MockDb();