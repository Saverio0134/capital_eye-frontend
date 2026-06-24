import {
  Asset,
  AssetPosition,
  AssetType,
  CreateAssetWithPositionPayload,
  CreateStandaloneAssetPayload,
  MetalType,
  UpdateAssetPayload,
} from '../../../../models/asset.model';
import { FinancialAccount } from '../../../../models/financial-account.model';
import {
  calculateAssetTotalValue,
  isFinancialAssetType,
  isGenericPhysicalAssetType,
  isPositiveNumber,
  isPreciousMetalAssetType,
  isValidNonNegativeNumber,
  isValidPurity,
  requiresManualCurrentPrice,
} from '../../../../utils/asset.utils';
import type { CreateAssetFormValue, PreciousMetalQuantityMode } from './save-asset.types';

const DEFAULT_PRECIOUS_METAL_TYPE = MetalType.GOLD;
const DEFAULT_PRECIOUS_METAL_PURITY = 0.999;
const DEFAULT_WEIGHT_GRAMS = 1;

export interface SaveAssetFormContext {
  isEditMode: boolean;
  isStandaloneCreationFlow: boolean;
  defaultAccountUuid: string;
}

export interface SaveAssetPhysicalFormConfig {
  showMetalFields: boolean;
  showMetalWeightField: boolean;
  showCurrentPriceField: boolean;
  isCustom: boolean;
  currentPriceLabel: string;
  currentPriceHint: string;
  quantityLabel: string;
  quantityHint: string;
  preciousMetalQuantityMode: PreciousMetalQuantityMode;
}

// Crea la configurazione visuale del form fisico a partire dal modello corrente.
export function buildPhysicalFormConfig(
  value: CreateAssetFormValue,
): SaveAssetPhysicalFormConfig {
  const showMetalFields = isPreciousMetalAssetType(value.type);
  const showMetalWeightField =
    showMetalFields && value.preciousMetalQuantityMode === 'byPiece';

  return {
    showMetalFields,
    showMetalWeightField,
    showCurrentPriceField: requiresManualCurrentPrice(value.type, value.isCustom),
    isCustom: value.isCustom,
    currentPriceLabel: showMetalFields ? 'PREZZO CORRENTE / GRAMMO' : 'VALORE CORRENTE',
    currentPriceHint: showMetalFields
      ? "Usa il prezzo per grammo nella valuta base dell'asset."
      : "Valore corrente manuale dell'asset nella valuta base.",
    quantityLabel: showMetalFields
      ? value.preciousMetalQuantityMode === 'byPiece'
        ? 'NUMERO PEZZI'
        : 'GRAMMI POSSEDUTI'
      : 'QUANTITA INIZIALE',
    quantityHint: showMetalFields
      ? value.preciousMetalQuantityMode === 'byPiece'
        ? 'La quantita rappresenta il numero di pezzi. Il backend moltiplica quantita, grammi per pezzo e purezza.'
        : 'La quantita rappresenta i grammi totali posseduti. Il backend usera direttamente questo valore come unita.'
      : 'Quantita iniziale associata al conto selezionato.',
    preciousMetalQuantityMode: value.preciousMetalQuantityMode,
  };
}

// Normalizza i campi dipendenti dal tipo e dal flusso selezionati.
export function normalizeCreateAssetFormValue(
  value: CreateAssetFormValue,
  context: SaveAssetFormContext,
): CreateAssetFormValue {
  const nextValue: CreateAssetFormValue = {
    ...value,
  };

  if (isFinancialAssetType(nextValue.type)) {
    nextValue.isCustom = false;
    nextValue.metalType = null;
    nextValue.purity = null;
    nextValue.weightGrams = null;
    nextValue.preciousMetalQuantityMode = 'byPiece';
  }

  if (isGenericPhysicalAssetType(nextValue.type)) {
    nextValue.isCustom = true;
    nextValue.ticker = '';
    nextValue.metalType = null;
    nextValue.purity = null;
    nextValue.weightGrams = null;
    nextValue.preciousMetalQuantityMode = 'byPiece';
  }

  if (isPreciousMetalAssetType(nextValue.type)) {
    nextValue.ticker = '';
    nextValue.metalType = nextValue.metalType ?? DEFAULT_PRECIOUS_METAL_TYPE;
    nextValue.purity = isValidPurity(nextValue.purity)
      ? nextValue.purity
      : DEFAULT_PRECIOUS_METAL_PURITY;
    nextValue.weightGrams =
      nextValue.preciousMetalQuantityMode === 'byPiece'
        ? isPositiveNumber(nextValue.weightGrams)
          ? nextValue.weightGrams
          : DEFAULT_WEIGHT_GRAMS
        : null;

    if (!nextValue.isCustom) {
      nextValue.currentPrice = 0;
    }
  }

  if (context.isStandaloneCreationFlow) {
    nextValue.accountUuid = '';
    nextValue.quantity = 0;
    nextValue.averageBuyPrice = 0;
  } else if (!context.isEditMode && !nextValue.accountUuid.trim()) {
    nextValue.accountUuid = context.defaultAccountUuid;
  }

  return nextValue;
}

// Confronta due modelli form per evitare update ridondanti negli effect.
export function areCreateAssetFormValuesEqual(
  currentValue: CreateAssetFormValue,
  nextValue: CreateAssetFormValue,
): boolean {
  return JSON.stringify(currentValue) === JSON.stringify(nextValue);
}

// Costruisce i campi condivisi tra create e update.
export function buildSharedAssetPayload(
  value: CreateAssetFormValue,
): UpdateAssetPayload & { isCustom: boolean } {
  const resolvedIsCustom = resolveIsCustom(value.type, value.isCustom);
  const payload: UpdateAssetPayload & { isCustom: boolean } = {
    name: value.name.trim(),
    type: value.type,
    baseCurrency: value.baseCurrency,
    isCustom: resolvedIsCustom,
    taxRate: value.taxRate,
  };

  if (isFinancialAssetType(value.type)) {
    payload.ticker = value.ticker.trim().length > 0 ? value.ticker.trim().toUpperCase() : null;
    return payload;
  }

  payload.ticker = null;

  if (isGenericPhysicalAssetType(value.type) || resolvedIsCustom) {
    payload.currentPrice = value.currentPrice;
  }

  if (isPreciousMetalAssetType(value.type)) {
    payload.metalType = value.metalType;
    payload.purity = value.purity;
    payload.weightGrams =
      value.preciousMetalQuantityMode === 'byPiece' ? value.weightGrams : null;
  }

  return payload;
}

// Costruisce il payload create coerente con il contratto backend.
export function buildCreateAssetPayload(
  value: CreateAssetFormValue,
  isStandaloneCreationFlow: boolean,
): CreateAssetWithPositionPayload | CreateStandaloneAssetPayload {
  const sharedPayload = buildSharedAssetPayload(value);

  if (isStandaloneCreationFlow) {
    return {
      ...sharedPayload,
      quantity: 0,
      averageBuyPrice: 0,
    };
  }

  return {
    ...sharedPayload,
    accountUuid: value.accountUuid,
    quantity: value.quantity,
    averageBuyPrice: value.averageBuyPrice,
  };
}

// Crea l'asset ottimistico a partire dal payload e dal conto collegato.
export function buildOptimisticAssetForCreate(
  payload: CreateAssetWithPositionPayload | CreateStandaloneAssetPayload,
  account?: FinancialAccount,
): Asset {
  const now = new Date();
  const currentPrice = payload.currentPrice ?? payload.averageBuyPrice;
  const totalValue = calculateAssetTotalValue(
    payload.type,
    payload.quantity,
    currentPrice,
    payload.weightGrams ?? null,
    payload.purity ?? null,
  );
  const position: AssetPosition | null =
    account && 'accountUuid' in payload
      ? {
          uuid: buildOptimisticPositionUuid(),
          accountUuid: payload.accountUuid,
          accountName: account.name,
          accountType: account.type,
          currency: account.currency,
          quantity: payload.quantity,
          currentPrice,
          totalValue,
          averageBuyPrice: payload.averageBuyPrice,
          lastMarketUpdate: null,
        }
      : null;

  return {
    uuid: buildOptimisticAssetUuid(),
    userId: 'optimistic-user',
    name: payload.name,
    type: payload.type,
    baseCurrency: payload.baseCurrency,
    ticker: payload.ticker ?? null,
    isCustom: payload.isCustom,
    metalType: payload.metalType ?? null,
    weightGrams: payload.weightGrams ?? null,
    purity: payload.purity ?? null,
    quantity: payload.quantity,
    currentPrice,
    totalValue,
    valuationCurrency: account?.currency ?? payload.baseCurrency,
    positions: position ? [position] : [],
    lastMarketUpdate: null,
    averageBuyPrice: payload.averageBuyPrice,
    taxRate: payload.taxRate ?? 0,
    netValue: totalValue,
    unrealizedGain: 0,
    updatedAt: now,
  };
}

// Aggiorna l'asset ottimistico in modifica senza cambiare il contratto del dialog.
export function buildOptimisticAssetForUpdate(
  sourceAsset: Asset,
  updatePayload: UpdateAssetPayload,
): Asset {
  const currentPrice = updatePayload.currentPrice ?? sourceAsset.currentPrice;
  const weightGrams = updatePayload.weightGrams ?? null;
  const purity = updatePayload.purity ?? null;

  return {
    ...sourceAsset,
    name: updatePayload.name,
    type: updatePayload.type,
    baseCurrency: updatePayload.baseCurrency,
    ticker: updatePayload.ticker ?? null,
    isCustom: updatePayload.isCustom ?? sourceAsset.isCustom,
    metalType: updatePayload.metalType ?? null,
    weightGrams,
    purity,
    currentPrice,
    totalValue: calculateAssetTotalValue(
      updatePayload.type,
      sourceAsset.quantity,
      currentPrice,
      weightGrams,
      purity,
    ),
    taxRate: updatePayload.taxRate ?? sourceAsset.taxRate,
    netValue: sourceAsset.netValue,
    unrealizedGain: sourceAsset.unrealizedGain,
    updatedAt: new Date(),
  };
}

// Verifica i campi attivi prima del submit.
export function hasValidAssetModeFields(
  value: CreateAssetFormValue,
  context: SaveAssetFormContext,
): boolean {
  if (!value.name.trim()) {
    return false;
  }

  if (!isValidNonNegativeNumber(value.taxRate) || value.taxRate > 100) {
    return false;
  }

  if (!context.isEditMode) {
    if (context.isStandaloneCreationFlow) {
      if (value.accountUuid.trim().length > 0 || value.quantity !== 0 || value.averageBuyPrice !== 0) {
        return false;
      }
    } else {
      if (!value.accountUuid.trim()) {
        return false;
      }

      if (
        !isValidNonNegativeNumber(value.quantity) ||
        !isValidNonNegativeNumber(value.averageBuyPrice)
      ) {
        return false;
      }
    }
  }

  if (isFinancialAssetType(value.type)) {
    return value.ticker.trim().length > 0;
  }

  if (isGenericPhysicalAssetType(value.type)) {
    return isPositiveNumber(value.currentPrice);
  }

  if (!value.metalType || !isValidPurity(value.purity)) {
    return false;
  }

  if (value.preciousMetalQuantityMode === 'byPiece' && !isPositiveNumber(value.weightGrams)) {
    return false;
  }

  if (!value.isCustom) {
    return true;
  }

  return isPositiveNumber(value.currentPrice);
}

// Risolve il flag custom in base al gruppo asset.
function resolveIsCustom(type: AssetType, isCustom: boolean): boolean {
  if (isFinancialAssetType(type)) {
    return false;
  }

  if (isGenericPhysicalAssetType(type)) {
    return true;
  }

  return isCustom;
}

// Genera l'id temporaneo dell'asset ottimistico.
function buildOptimisticAssetUuid(): string {
  return `optimistic-asset-${Date.now()}`;
}

// Genera l'id temporaneo della posizione ottimistica.
function buildOptimisticPositionUuid(): string {
  return `optimistic-position-${Date.now()}`;
}
