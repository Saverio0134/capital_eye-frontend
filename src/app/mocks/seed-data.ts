// Seed dati realistici per la modalita demo.
// Tutti gli export sono tipizzati e indipendenti dal backend reale: alimentano
// lo stato in memoria del mock-db e vengono usati dagli handler dell'interceptor.
import { AllAssetsWithNet, Asset, AssetType, Currency, MetalType } from '../models/asset.model';
import { FinancialAccount } from '../models/financial-account.model';
import { Growth } from '../models/growth.model';
import {
  LiquidityWithGrowth,
  LiquidityMonthlyTable,
  LiquiditySnapshot,
  LiquidityMonthlyTableAccount,
  LiquidityMonthlyTableRow,
} from '../models/liquidity.model';
import {
  Transaction,
  TransactionType,
  LiquiditySnapshotWithAccount,
} from '../models/transaction.model';
import { MonthlyNetWorthWithGrowth } from '../models/networth.model';
import { AccountType } from '../enum/account.enum';
import { calculateAssetTotalValue } from '../utils/asset.utils';

// Riferimento temporale: usa "ora" al runtime cosi i dati restano recenti.
const NOW = new Date();

// Restituisce l'ISO del primo giorno del mese n mesi fa rispetto a oggi.
function monthStartISO(monthsAgo: number): string {
  const date = new Date(Date.UTC(NOW.getFullYear(), NOW.getMonth() - monthsAgo, 1));
  return date.toISOString();
}

// Restituisce un'ISO circa n giorni fa utile per date transizione/snapshot recenti.
function daysAgoISO(days: number): string {
  const date = new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

// Genera una serie mensile crescente con ramo mensile stabile, partendo dal valore finale.
function buildMonthlySeries(endValue: number, monthsCount: number, monthlyRate: number) {
  const points: Array<{ date: string; value: number }> = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const value = endValue / Math.pow(1 + monthlyRate, i);
    points.push({ date: monthStartISO(i), value: Number(value.toFixed(2)) });
  }
  return points;
}

// Calcola punti di variazione mensile con cambio e percentuale rispetto al mese precedente.
function buildVariationPoints(endValue: number, monthsCount: number, monthlyRate: number) {
  const series = buildMonthlySeries(endValue, monthsCount, monthlyRate);
  return series.map((point, index) => {
    const previous = index > 0 ? series[index - 1].value : point.value;
    const changeValue = Number((point.value - previous).toFixed(2));
    const changePercentage = previous > 0 ? Number(((changeValue / previous) * 100).toFixed(2)) : 0;
    return {
      date: point.date,
      value: point.value,
      changeValue,
      changePercentage,
    };
  });
}

// Deriva un Growth da una serie mensile, calcolando le finestre disponibili.
function deriveGrowth(monthlyValues: number[]): Growth {
  const at = (offset: number) => monthlyValues[monthlyValues.length - 1 - offset] ?? 0;
  const latest = at(0);
  const pct = (prev: number) => (prev > 0 ? Number((((latest - prev) / prev) * 100).toFixed(2)) : 0);
  return {
    oneMonth: pct(at(1)),
    threeMonths: pct(at(3)),
    sixMonths: pct(at(6)),
    year: pct(at(11)),
  };
}

/* ------------------------------------------------------------------ */
/* Financial accounts                                                  */
/* ------------------------------------------------------------------ */

export const seedFinancialAccounts: FinancialAccount[] = [
  {
    uuid: 'acc-1',
    name: 'Conto Corrente Unicredit',
    type: 'BANK' satisfies AccountType,
    currency: Currency.EUR,
    createdAt: new Date(daysAgoISO(800)),
    updatedAt: new Date(daysAgoISO(20)),
  },
  {
    uuid: 'acc-2',
    name: 'Conto Risparmio Illimitato',
    type: 'BANK' satisfies AccountType,
    currency: Currency.EUR,
    createdAt: new Date(daysAgoISO(760)),
    updatedAt: new Date(daysAgoISO(15)),
  },
  {
    uuid: 'acc-3',
    name: 'Degiro',
    type: 'BROKER' satisfies AccountType,
    currency: Currency.EUR,
    createdAt: new Date(daysAgoISO(720)),
    updatedAt: new Date(daysAgoISO(10)),
  },
  {
    uuid: 'acc-4',
    name: 'Crypto.com App',
    type: 'WALLET' satisfies AccountType,
    currency: Currency.EUR,
    createdAt: new Date(daysAgoISO(680)),
    updatedAt: new Date(daysAgoISO(8)),
  },
  {
    uuid: 'acc-5',
    name: 'Cassaforte di Casa',
    type: 'PHYSICAL_VAULT' satisfies AccountType,
    currency: Currency.EUR,
    createdAt: new Date(daysAgoISO(640)),
    updatedAt: new Date(daysAgoISO(5)),
  },
];

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

// Costruttore campo asset con defaults coerenti e guadagno calcolato dal costo.
// Usa calculateAssetTotalValue per rispettare la semantica backend sui metalli
// preziosi (prezzo al grammo * grammi per pezzo * quantita * purezza).
function buildAsset(input: {
  uuid: string;
  name: string;
  type: AssetType;
  baseCurrency: Currency;
  valuationCurrency: Currency;
  ticker: string | null;
  isCustom: boolean;
  metalType: MetalType | null;
  weightGrams: number | null;
  purity: number | null;
  quantity: number;
  currentPrice: number;
  averageBuyPrice: number;
  taxRate: number;
  position: { accountUuid: string; accountName: string; accountType: AccountType; currency: Currency; quantity: number } | null;
}): Asset {
  const totalValue = Number(calculateAssetTotalValue(input.type, input.quantity, input.currentPrice, input.weightGrams, input.purity).toFixed(2));
  const costBasis = Number(calculateAssetTotalValue(input.type, input.quantity, input.averageBuyPrice, input.weightGrams, input.purity).toFixed(2));
  const unrealizedGain = Number((totalValue - costBasis).toFixed(2));
  const taxableGain = Math.max(unrealizedGain, 0);
  const tax = Number((taxableGain * input.taxRate).toFixed(2));
  const netValue = Number((totalValue - tax).toFixed(2));
  const positions =
    input.position === null
      ? []
      : [
          {
            uuid: `pos-${input.uuid}-1`,
            accountUuid: input.position.accountUuid,
            accountName: input.position.accountName,
            accountType: input.position.accountType,
            currency: input.position.currency,
            quantity: input.position.quantity,
            currentPrice: input.currentPrice,
            totalValue,
            averageBuyPrice: input.averageBuyPrice,
            lastMarketUpdate: new Date(daysAgoISO(1)),
          },
        ];

  return {
    uuid: input.uuid,
    userId: 'demo-user',
    name: input.name,
    type: input.type,
    baseCurrency: input.baseCurrency,
    ticker: input.ticker,
    isCustom: input.isCustom,
    metalType: input.metalType,
    weightGrams: input.weightGrams,
    purity: input.purity,
    quantity: input.quantity,
    currentPrice: input.currentPrice,
    totalValue,
    valuationCurrency: input.valuationCurrency,
    positions,
    lastMarketUpdate: new Date(daysAgoISO(1)),
    averageBuyPrice: input.averageBuyPrice,
    taxRate: input.taxRate,
    netValue,
    unrealizedGain,
    updatedAt: new Date(daysAgoISO(1)),
  };
}

// Asset intangibili (stock + crypto): posizioni su broker/wallet.
const intangibleAssetSeeds: Asset[] = [
  buildAsset({
    uuid: 'asset-1',
    name: 'Apple Inc.',
    type: AssetType.STOCK,
    baseCurrency: Currency.USD,
    valuationCurrency: Currency.EUR,
    ticker: 'AAPL',
    isCustom: false,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 50,
    currentPrice: 230,
    averageBuyPrice: 150,
    taxRate: 0.26,
    position: { accountUuid: 'acc-3', accountName: 'Degiro', accountType: 'BROKER', currency: Currency.EUR, quantity: 50 },
  }),
  buildAsset({
    uuid: 'asset-2',
    name: 'Microsoft Corporation',
    type: AssetType.STOCK,
    baseCurrency: Currency.USD,
    valuationCurrency: Currency.EUR,
    ticker: 'MSFT',
    isCustom: false,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 30,
    currentPrice: 420,
    averageBuyPrice: 300,
    taxRate: 0.26,
    position: { accountUuid: 'acc-3', accountName: 'Degiro', accountType: 'BROKER', currency: Currency.EUR, quantity: 30 },
  }),
  buildAsset({
    uuid: 'asset-3',
    name: 'iShares S&P 500 ETF',
    type: AssetType.STOCK,
    baseCurrency: Currency.USD,
    valuationCurrency: Currency.EUR,
    ticker: 'IVV',
    isCustom: false,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 25,
    currentPrice: 480,
    averageBuyPrice: 400,
    taxRate: 0.26,
    position: { accountUuid: 'acc-3', accountName: 'Degiro', accountType: 'BROKER', currency: Currency.EUR, quantity: 25 },
  }),
  buildAsset({
    uuid: 'asset-4',
    name: 'Bitcoin',
    type: AssetType.CRYPTO,
    baseCurrency: Currency.EUR,
    valuationCurrency: Currency.EUR,
    ticker: 'BTC',
    isCustom: false,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 0.5,
    currentPrice: 60000,
    averageBuyPrice: 46000,
    taxRate: 0.26,
    position: { accountUuid: 'acc-4', accountName: 'Crypto.com App', accountType: 'WALLET', currency: Currency.EUR, quantity: 0.5 },
  }),
  buildAsset({
    uuid: 'asset-5',
    name: 'Ethereum',
    type: AssetType.CRYPTO,
    baseCurrency: Currency.EUR,
    valuationCurrency: Currency.EUR,
    ticker: 'ETH',
    isCustom: false,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 8,
    currentPrice: 3200,
    averageBuyPrice: 2200,
    taxRate: 0.26,
    position: { accountUuid: 'acc-4', accountName: 'Crypto.com App', accountType: 'WALLET', currency: Currency.EUR, quantity: 8 },
  }),
];

// Asset fisici (metalli, immobili, veicoli, collezionabili): posizioni su cassaforte o null.
const physicalAssetSeeds: Asset[] = [
  buildAsset({
    uuid: 'asset-6',
    name: 'Oro fisico (barra 100g)',
    type: AssetType.PRECIOUS_METAL,
    baseCurrency: Currency.EUR,
    valuationCurrency: Currency.EUR,
    ticker: null,
    isCustom: false,
    metalType: MetalType.GOLD,
    weightGrams: 100,
    purity: 0.999,
    quantity: 1,
    currentPrice: 70,
    averageBuyPrice: 55,
    taxRate: 0.26,
    position: { accountUuid: 'acc-5', accountName: 'Cassaforte di Casa', accountType: 'PHYSICAL_VAULT', currency: Currency.EUR, quantity: 1 },
  }),
  buildAsset({
    uuid: 'asset-7',
    name: 'Argento fisico (lingotto 1kg)',
    type: AssetType.PRECIOUS_METAL,
    baseCurrency: Currency.EUR,
    valuationCurrency: Currency.EUR,
    ticker: null,
    isCustom: false,
    metalType: MetalType.SILVER,
    weightGrams: 1000,
    purity: 0.999,
    quantity: 1,
    currentPrice: 0.85,
    averageBuyPrice: 0.7,
    taxRate: 0.26,
    position: { accountUuid: 'acc-5', accountName: 'Cassaforte di Casa', accountType: 'PHYSICAL_VAULT', currency: Currency.EUR, quantity: 1 },
  }),
  buildAsset({
    uuid: 'asset-8',
    name: 'Appartamento Roma',
    type: AssetType.REAL_ESTATE,
    baseCurrency: Currency.EUR,
    valuationCurrency: Currency.EUR,
    ticker: null,
    isCustom: true,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 1,
    currentPrice: 280000,
    averageBuyPrice: 250000,
    taxRate: 0.26,
    position: null,
  }),
  buildAsset({
    uuid: 'asset-9',
    name: 'Fiat 500',
    type: AssetType.VEHICLE,
    baseCurrency: Currency.EUR,
    valuationCurrency: Currency.EUR,
    ticker: null,
    isCustom: true,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 1,
    currentPrice: 12000,
    averageBuyPrice: 14000,
    taxRate: 0.26,
    position: null,
  }),
  buildAsset({
    uuid: 'asset-10',
    name: 'Rolex Submariner',
    type: AssetType.COLLECTIBLE,
    baseCurrency: Currency.EUR,
    valuationCurrency: Currency.EUR,
    ticker: null,
    isCustom: true,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 1,
    currentPrice: 11000,
    averageBuyPrice: 8000,
    taxRate: 0.26,
    position: { accountUuid: 'acc-5', accountName: 'Cassaforte di Casa', accountType: 'PHYSICAL_VAULT', currency: Currency.EUR, quantity: 1 },
  }),
];

const allAssetSeeds = [...intangibleAssetSeeds, ...physicalAssetSeeds];

// Calcola i Growth dei due gruppi dai valori mensili aggregati (ultimi 12 mesi).
// L'endValue della serie coincide con il netTotal reale calcolato dagli asset.
const intangibleNetTotal = Number(intangibleAssetSeeds.reduce((sum, asset) => sum + asset.netValue, 0).toFixed(2));
const physicalNetTotal = Number(physicalAssetSeeds.reduce((sum, asset) => sum + asset.netValue, 0).toFixed(2));
const intangibleMonthlyTotals = buildMonthlySeries(intangibleNetTotal, 12, 0.018).map((p) => p.value);
const physicalMonthlyTotals = buildMonthlySeries(physicalNetTotal, 12, 0.007).map((p) => p.value);

export const seedAssetsWithNet: AllAssetsWithNet = {
  intangibleAssets: {
    assets: intangibleAssetSeeds,
    netTotal: intangibleNetTotal,
    growth: deriveGrowth(intangibleMonthlyTotals),
    lastUpdate: new Date(daysAgoISO(1)),
  },
  physicalAssets: {
    assets: physicalAssetSeeds,
    netTotal: physicalNetTotal,
    growth: deriveGrowth(physicalMonthlyTotals),
    lastUpdate: new Date(daysAgoISO(1)),
  },
};

/* ------------------------------------------------------------------ */
/* Variazioni mensili per asset (trend chart pagina assets)            */
/* ------------------------------------------------------------------ */

export const seedMonthlyVariations = allAssetSeeds.map((asset) => {
  const monthlyRate = asset.type === AssetType.CRYPTO ? 0.035 : asset.type === AssetType.STOCK ? 0.022 : 0.006;
  return {
    assetUuid: asset.uuid,
    name: asset.name,
    ticker: asset.ticker,
    type: asset.type,
    monthlyVariations: buildVariationPoints(asset.totalValue, 12, monthlyRate),
    dateLastSnapshot: monthStartISO(0),
  };
});

/* ------------------------------------------------------------------ */
/* Liquidita: serie mensili per account (definite qui per consentire    */
/* il calcolo del net worth che ne dipende)                            */
/* ------------------------------------------------------------------ */

// Serie mensile di liquidita per i 4 account con liquidita (esclusa la cassaforte).
const liquidityAccountSeries: Record<string, { start: number; end: number }> = {
  'acc-1': { start: 8000, end: 12000 },
  'acc-2': { start: 15000, end: 22000 },
  'acc-3': { start: 2000, end: 3500 },
  'acc-4': { start: 1000, end: 2800 },
};

// Totale liquidita dell'ultimo snapshot (somma dei valori `end` dei account).
const liquidityTotalLatest = Object.values(liquidityAccountSeries).reduce((sum, series) => sum + series.end, 0);

/* ------------------------------------------------------------------ */
/* Net worth mensile + growth (dashboard trend)                        */
/* ------------------------------------------------------------------ */

// La serie net worth parte dal valore attuale (intangibili + fisici + liquidita).
const netWorthMonthlyTotals = buildMonthlySeries(
  intangibleNetTotal + physicalNetTotal + liquidityTotalLatest,
  12,
  0.011,
).map((point) => ({ date: new Date(point.date), value: point.value }));

export const seedSnapshotNetWorth: MonthlyNetWorthWithGrowth = {
  monthlyNetWorth: netWorthMonthlyTotals,
  growth: deriveGrowth(netWorthMonthlyTotals.map((point) => point.value)),
  dateLastSnapshot: {
    asset: new Date(daysAgoISO(1)),
    liquidity: new Date(daysAgoISO(2)),
  },
};

/* ------------------------------------------------------------------ */
/* Liquidita: snapshot, totale e tabella mensile                      */
/* ------------------------------------------------------------------ */

const liquidityMonthsCount = 8;

// Costruisce gli snapshot liquidita per ogni account su 8 mesi.
export const seedLiquiditySnapshots: LiquiditySnapshotWithAccount[] = (() => {
  const snapshots: LiquiditySnapshotWithAccount[] = [];
  let snapshotCounter = 0;

  for (const account of seedFinancialAccounts) {
    const series = liquidityAccountSeries[account.uuid];
    if (!series) {
      continue;
    }

    for (let i = liquidityMonthsCount - 1; i >= 0; i--) {
      const progress = (liquidityMonthsCount - 1 - i) / (liquidityMonthsCount - 1);
      const amount = Number((series.start + (series.end - series.start) * progress).toFixed(2));
      snapshotCounter += 1;
      snapshots.push({
        uuid: `snap-${snapshotCounter}`,
        accountUuid: account.uuid,
        date: new Date(monthStartISO(i)),
        amount,
        createdAt: new Date(daysAgoISO(i * 5 + 2)),
        account,
      });
    }
  }

  return snapshots;
})();

// Totale liquidita + growth derivato dall'ultimo snapshot di ogni account.
export const seedTotalLatestLiquidity: LiquidityWithGrowth = (() => {
  const latestByAccount = new Map<string, LiquiditySnapshotWithAccount>();
  for (const snapshot of seedLiquiditySnapshots) {
    const existing = latestByAccount.get(snapshot.accountUuid);
    if (!existing || snapshot.date.getTime() > existing.date.getTime()) {
      latestByAccount.set(snapshot.accountUuid, snapshot);
    }
  }

  const monthlyTotals = buildMonthlySeries(
    Array.from(latestByAccount.values()).reduce((sum, snapshot) => sum + snapshot.amount, 0),
    12,
    0.012,
  ).map((point) => point.value);

  return {
    totalLiquidity: Number(
      Array.from(latestByAccount.values())
        .reduce((sum, snapshot) => sum + snapshot.amount, 0)
        .toFixed(2),
    ),
    growth: deriveGrowth(monthlyTotals),
    lastUpdate: new Date(daysAgoISO(2)),
  };
})();

// Tabella mensile liquidita derivata dagli snapshot.
export const seedMonthlyTable: LiquidityMonthlyTable = (() => {
  const liquidAccounts = seedFinancialAccounts.filter((account) =>
    Boolean(liquidityAccountSeries[account.uuid]),
  );

  const tableAccounts: LiquidityMonthlyTableAccount[] = liquidAccounts.map((account) => ({
    uuid: account.uuid,
    name: account.name,
    type: account.type,
    currency: account.currency,
  }));

  const rows: LiquidityMonthlyTableRow[] = [];
  const snapshotMap = new Map<string, LiquiditySnapshotWithAccount[]>();
  for (const snapshot of seedLiquiditySnapshots) {
    const list = snapshotMap.get(snapshot.accountUuid) ?? [];
    list.push(snapshot);
    snapshotMap.set(snapshot.accountUuid, list);
  }

  for (let i = liquidityMonthsCount - 1; i >= 0; i--) {
    const monthISO = monthStartISO(i);
    const values: Record<string, number> = {};
    const deltas: Record<string, number> = {};
    let total = 0;
    let totalDelta = 0;

    for (const account of liquidAccounts) {
      const accountSnapshots = (snapshotMap.get(account.uuid) ?? []).sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );
      // Gli snapshot sono ordinati cronologicamente (0 = piu vecchio, N-1 = piu recente),
      // mentre l'indice i del ciclo va da N-1 (piu vecchio) a 0 (piu recente):
      // va mappato invertito per allineare data e valore.
      const snapshotIndex = liquidityMonthsCount - 1 - i;
      const current = accountSnapshots[snapshotIndex]?.amount ?? 0;
      const previous = snapshotIndex > 0 ? (accountSnapshots[snapshotIndex - 1]?.amount ?? 0) : current;
      const delta = Number((current - previous).toFixed(2));
      values[account.uuid] = current;
      deltas[account.uuid] = delta;
      total += current;
      totalDelta += delta;
    }

    rows.push({
      month: monthISO.slice(0, 7),
      values,
      deltas,
      total: Number(total.toFixed(2)),
      totalDelta: Number(totalDelta.toFixed(2)),
    });
  }

  return { accounts: tableAccounts, rows };
})();

/* ------------------------------------------------------------------ */
/* Transazioni BUY/SELL (Registro tab Assets)                          */
/* ------------------------------------------------------------------ */

function buildTransaction(input: {
  uuid: string;
  assetUuid: string;
  accountUuid: string;
  type: TransactionType;
  date: string;
  quantity: number;
  totalAmount: number;
  fees: number | null;
  notes: string | null;
  realizedGain: number | null;
  taxAmount: number | null;
}): Transaction {
  return {
    uuid: input.uuid,
    assetUuid: input.assetUuid,
    accountUuid: input.accountUuid,
    type: input.type,
    date: new Date(input.date),
    quantity: input.quantity,
    totalAmount: input.totalAmount,
    fees: input.fees,
    notes: input.notes,
    realizedGain: input.realizedGain,
    taxAmount: input.taxAmount,
    createdAt: new Date(input.date),
  };
}

// Transazioni su ~10 mesi; alcune recenti (<30gg) risultano eliminabili nel Registro.
export const seedTransactions: Transaction[] = [
  buildTransaction({
    uuid: 'tx-1',
    assetUuid: 'asset-1',
    accountUuid: 'acc-3',
    type: 'BUY',
    date: monthStartISO(9),
    quantity: 20,
    totalAmount: 3000,
    fees: 5,
    notes: 'Primo acquisto Apple',
    realizedGain: null,
    taxAmount: null,
  }),
  buildTransaction({
    uuid: 'tx-2',
    assetUuid: 'asset-2',
    accountUuid: 'acc-3',
    type: 'BUY',
    date: monthStartISO(8),
    quantity: 20,
    totalAmount: 6000,
    fees: 5,
    notes: null,
    realizedGain: null,
    taxAmount: null,
  }),
  buildTransaction({
    uuid: 'tx-3',
    assetUuid: 'asset-4',
    accountUuid: 'acc-4',
    type: 'BUY',
    date: monthStartISO(8),
    quantity: 0.25,
    totalAmount: 10000,
    fees: null,
    notes: 'DCA Bitcoin',
    realizedGain: null,
    taxAmount: null,
  }),
  buildTransaction({
    uuid: 'tx-4',
    assetUuid: 'asset-3',
    accountUuid: 'acc-3',
    type: 'BUY',
    date: monthStartISO(7),
    quantity: 15,
    totalAmount: 6000,
    fees: 5,
    notes: null,
    realizedGain: null,
    taxAmount: null,
  }),
  buildTransaction({
    uuid: 'tx-5',
    assetUuid: 'asset-5',
    accountUuid: 'acc-4',
    type: 'BUY',
    date: monthStartISO(6),
    quantity: 5,
    totalAmount: 11000,
    fees: null,
    notes: 'Ethereum',
    realizedGain: null,
    taxAmount: null,
  }),
  buildTransaction({
    uuid: 'tx-6',
    assetUuid: 'asset-1',
    accountUuid: 'acc-3',
    type: 'BUY',
    date: monthStartISO(5),
    quantity: 35,
    totalAmount: 5250,
    fees: 5,
    notes: 'Ricarica posizione',
    realizedGain: null,
    taxAmount: null,
  }),
  buildTransaction({
    uuid: 'tx-7',
    assetUuid: 'asset-2',
    accountUuid: 'acc-3',
    type: 'BUY',
    date: monthStartISO(4),
    quantity: 15,
    totalAmount: 4500,
    fees: 5,
    notes: null,
    realizedGain: null,
    taxAmount: null,
  }),
  buildTransaction({
    uuid: 'tx-8',
    assetUuid: 'asset-4',
    accountUuid: 'acc-4',
    type: 'BUY',
    date: monthStartISO(3),
    quantity: 0.2,
    totalAmount: 10000,
    fees: null,
    notes: 'DCA Bitcoin',
    realizedGain: null,
    taxAmount: null,
  }),
  buildTransaction({
    uuid: 'tx-9',
    assetUuid: 'asset-3',
    accountUuid: 'acc-3',
    type: 'BUY',
    date: monthStartISO(2),
    quantity: 10,
    totalAmount: 4000,
    fees: 5,
    notes: null,
    realizedGain: null,
    taxAmount: null,
  }),
  buildTransaction({
    uuid: 'tx-10',
    assetUuid: 'asset-1',
    accountUuid: 'acc-3',
    type: 'SELL',
    date: monthStartISO(1),
    quantity: 5,
    totalAmount: 1150,
    fees: 5,
    notes: 'Realizzo parziale',
    realizedGain: 400,
    taxAmount: 104,
  }),
  buildTransaction({
    uuid: 'tx-11',
    assetUuid: 'asset-5',
    accountUuid: 'acc-4',
    type: 'BUY',
    date: monthStartISO(1),
    quantity: 3,
    totalAmount: 6600,
    fees: null,
    notes: null,
    realizedGain: null,
    taxAmount: null,
  }),
  // Transazioni recenti (<30gg) per mostrare voci eliminabili nel Registro.
  buildTransaction({
    uuid: 'tx-12',
    assetUuid: 'asset-2',
    accountUuid: 'acc-3',
    type: 'SELL',
    date: daysAgoISO(12),
    quantity: 5,
    totalAmount: 2100,
    fees: 5,
    notes: 'Realizzo Microsoft',
    realizedGain: 600,
    taxAmount: 156,
  }),
  buildTransaction({
    uuid: 'tx-13',
    assetUuid: 'asset-4',
    accountUuid: 'acc-4',
    type: 'BUY',
    date: daysAgoISO(5),
    quantity: 0.05,
    totalAmount: 3000,
    fees: null,
    notes: 'DCA recente',
    realizedGain: null,
    taxAmount: null,
  }),
];

/* ------------------------------------------------------------------ */
/* Utente demo                                                         */
/* ------------------------------------------------------------------ */

export const seedUser = {
  id: 'demo-user',
  email: 'demo@capitaleye.app',
  name: 'Demo Utente',
};