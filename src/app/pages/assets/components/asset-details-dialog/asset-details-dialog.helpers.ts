import { Asset, AssetType } from '../../../../models/asset.model';
import { METAL_TYPE_OPTIONS } from '../../../../shared/config/select-options.config';
import { isFinancialAssetType, isPreciousMetalAssetType } from '../../../../utils/asset.utils';

export type AssetDetailCardTone = 'default' | 'positive' | 'negative';

export interface AssetDetailCard {
  id: string;
  label: string;
  kind: 'currency' | 'number' | 'percent' | 'text';
  value: number | string;
  digits?: string;
  tone?: AssetDetailCardTone;
}

const METAL_TYPE_LABELS = new Map(
  METAL_TYPE_OPTIONS.map((option) => [option.value, option.label] as const),
);

// Costruisce la lista di card da mostrare nel dialog dettagli in base al tipo asset.
export function buildAssetDetailCards(asset: Asset, performancePercent: number): AssetDetailCard[] {
  const commonCards = buildCommonDetailCards(asset, performancePercent);

  switch (asset.type) {
    case AssetType.STOCK:
    case AssetType.CRYPTO:
      return [...commonCards, ...buildFinancialDetailCards(asset)];
    case AssetType.PRECIOUS_METAL:
      return [...commonCards, ...buildPreciousMetalDetailCards(asset)];
    case AssetType.REAL_ESTATE:
      return [...commonCards, ...buildRealEstateDetailCards(asset)];
    case AssetType.VEHICLE:
    case AssetType.COLLECTIBLE:
      return [...commonCards, ...buildCollectibleDetailCards(asset)];
    case AssetType.CASH_EQUIVALENT:
      return [...commonCards, ...buildCashEquivalentDetailCards(asset)];
    default:
      return commonCards;
  }
}

// Restituisce il blocco comune a tutti i tipi con i principali KPI economici.
function buildCommonDetailCards(asset: Asset, performancePercent: number): AssetDetailCard[] {
  return [
    {
      id: 'gross-value',
      label: 'Valore Lordo',
      kind: 'currency',
      value: asset.totalValue,
      digits: '1.2-2',
    },
    {
      id: 'net-value',
      label: 'Valore Netto',
      kind: 'currency',
      value: asset.netValue,
      digits: '1.2-2',
    },
    {
      id: 'quantity',
      label: resolveQuantityLabel(asset.type),
      kind: 'number',
      value: asset.quantity,
      digits: resolveQuantityDigits(asset.type),
    },
    {
      id: 'gain',
      label: 'Guadagno',
      kind: 'currency',
      value: asset.unrealizedGain,
      digits: '1.2-2',
      tone: resolveNumericTone(asset.unrealizedGain),
    },
    {
      id: 'performance',
      label: 'Performance',
      kind: 'percent',
      value: performancePercent,
      digits: '1.2-2',
      tone: resolveNumericTone(performancePercent),
    },
  ];
}

// Aggiunge i dettagli finanziari per stock e crypto.
function buildFinancialDetailCards(asset: Asset): AssetDetailCard[] {
  return [
    {
      id: 'average-buy-price',
      label: 'Prezzo Medio',
      kind: 'currency',
      value: asset.averageBuyPrice,
      digits: '1.2-4',
    },
    {
      id: 'current-price',
      label: 'Prezzo Attuale',
      kind: 'currency',
      value: asset.currentPrice,
      digits: '1.2-4',
    },
    {
      id: 'tax-rate',
      label: 'Imposta',
      kind: 'percent',
      value: asset.taxRate,
      digits: '1.2-2',
    },
    {
      id: 'ticker',
      label: 'Ticker',
      kind: 'text',
      value: asset.ticker || 'N/D',
    },
  ];
}

// Aggiunge i dettagli specifici del metallo prezioso.
function buildPreciousMetalDetailCards(asset: Asset): AssetDetailCard[] {
  const totalWeight = asset.weightGrams ? asset.weightGrams * asset.quantity : asset.quantity;
  const cards: AssetDetailCard[] = [
    {
      id: 'metal-type',
      label: 'Metallo',
      kind: 'text',
      value: asset.metalType ? (METAL_TYPE_LABELS.get(asset.metalType) ?? asset.metalType) : 'N/D',
    },
    {
      id: 'purity',
      label: 'Purezza',
      kind: 'percent',
      value: (asset.purity ?? 0) * 100,
      digits: '1.2-2',
    },
    {
      id: 'total-weight',
      label: 'Peso Totale (g)',
      kind: 'number',
      value: totalWeight,
      digits: '1.2-2',
    },
    {
      id: 'average-buy-price',
      label: 'Prezzo Medio al g',
      kind: 'currency',
      value: asset.averageBuyPrice,
      digits: '1.2-4',
    },
    {
      id: 'current-price',
      label: 'Prezzo Attuale al g',
      kind: 'currency',
      value: asset.currentPrice,
      digits: '1.2-4',
    },
    {
      id: 'tax-rate',
      label: 'Imposta',
      kind: 'percent',
      value: asset.taxRate,
      digits: '1.2-2',
    },
  ];

  if (asset.weightGrams) {
    cards.splice(3, 0, {
      id: 'unit-weight',
      label: 'Peso Unità (g)',
      kind: 'number',
      value: asset.weightGrams,
      digits: '1.2-2',
    });
  }

  return cards;
}

// Aggiunge i dettagli specifici degli immobili.
function buildRealEstateDetailCards(asset: Asset): AssetDetailCard[] {
  return [
    {
      id: 'average-buy-price',
      label: 'Valore di Carico',
      kind: 'currency',
      value: asset.averageBuyPrice,
      digits: '1.2-2',
    },
    {
      id: 'current-price',
      label: 'Valore Unitario Attuale',
      kind: 'currency',
      value: asset.currentPrice,
      digits: '1.2-2',
    },
    {
      id: 'tax-rate',
      label: 'Imposta',
      kind: 'percent',
      value: asset.taxRate,
      digits: '1.2-2',
    },
  ];
}

// Aggiunge i dettagli specifici per veicoli e collezioni.
function buildCollectibleDetailCards(asset: Asset): AssetDetailCard[] {
  return [
    {
      id: 'average-buy-price',
      label: 'Costo Medio',
      kind: 'currency',
      value: asset.averageBuyPrice,
      digits: '1.2-2',
    },
    {
      id: 'current-price',
      label: 'Valore Unitario Attuale',
      kind: 'currency',
      value: asset.currentPrice,
      digits: '1.2-2',
    },
    {
      id: 'tax-rate',
      label: 'Imposta',
      kind: 'percent',
      value: asset.taxRate,
      digits: '1.2-2',
    },
  ];
}

// Aggiunge i dettagli minimali per la liquidità valorizzata come asset.
function buildCashEquivalentDetailCards(asset: Asset): AssetDetailCard[] {
  return [
    {
      id: 'current-price',
      label: 'Valore Unitario',
      kind: 'currency',
      value: asset.currentPrice,
      digits: '1.2-2',
    },
    {
      id: 'tax-rate',
      label: 'Imposta',
      kind: 'percent',
      value: asset.taxRate,
      digits: '1.2-2',
    },
  ];
}

// Restituisce la label quantità più adatta alla semantica del tipo asset.
function resolveQuantityLabel(type: AssetType): string {
  if (type === AssetType.REAL_ESTATE) {
    return 'Unità Totali';
  }

  if (isPreciousMetalAssetType(type)) {
    return 'Peso / Quantità';
  }

  return 'Quantità Totale';
}

// Restituisce la precisione numerica coerente con il tipo asset.
function resolveQuantityDigits(type: AssetType): string {
  if (isFinancialAssetType(type) || isPreciousMetalAssetType(type)) {
    return '1.2-4';
  }

  return '1.2-2';
}

// Traduce il segno di un numero nel tono visivo della card.
function resolveNumericTone(value: number): AssetDetailCardTone {
  if (value > 0) {
    return 'positive';
  }

  if (value < 0) {
    return 'negative';
  }

  return 'default';
}
