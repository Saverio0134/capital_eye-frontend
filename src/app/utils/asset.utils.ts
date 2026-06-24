import { AssetType } from '../models/asset.model';

export const FINANCIAL_ASSET_TYPES = new Set<AssetType>([AssetType.STOCK, AssetType.CRYPTO]);
export const GENERIC_PHYSICAL_ASSET_TYPES = new Set<AssetType>([
  AssetType.REAL_ESTATE,
  AssetType.VEHICLE,
  AssetType.COLLECTIBLE,
  AssetType.CASH_EQUIVALENT,
]);
export const PHYSICAL_ASSET_TYPES = new Set<AssetType>([
  AssetType.PRECIOUS_METAL,
  ...GENERIC_PHYSICAL_ASSET_TYPES,
]);

// Riconosce gli asset finanziari gestiti da ticker/provider.
export function isFinancialAssetType(type: AssetType): boolean {
  return FINANCIAL_ASSET_TYPES.has(type);
}

// Riconosce il tipo metallo prezioso.
export function isPreciousMetalAssetType(type: AssetType): boolean {
  return type === AssetType.PRECIOUS_METAL;
}

// Riconosce gli asset fisici manuali non metallo.
export function isGenericPhysicalAssetType(type: AssetType): boolean {
  return GENERIC_PHYSICAL_ASSET_TYPES.has(type);
}

// Riconosce qualsiasi asset fisico come lo espone il backend.
export function isPhysicalAssetType(type: AssetType): boolean {
  return PHYSICAL_ASSET_TYPES.has(type);
}

// Determina quando il backend accetta un prezzo manuale.
export function requiresManualCurrentPrice(type: AssetType, isCustom: boolean): boolean {
  return isGenericPhysicalAssetType(type) || (isPreciousMetalAssetType(type) && isCustom);
}

// Calcola il valore totale asset coerente con la semantica backend.
export function calculateAssetTotalValue(
  type: AssetType,
  quantity: number,
  currentPrice: number,
  weightGrams: number | null,
  purity: number | null,
): number {
  if (!isPreciousMetalAssetType(type)) {
    return quantity * currentPrice;
  }

  const units = isPositiveNumber(weightGrams) ? weightGrams * quantity : quantity;
  const normalizedPurity = purity ?? 1;

  return currentPrice * units * normalizedPurity;
}

// Valida un numero positivo.
export function isPositiveNumber(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

// Valida zero o positivo.
export function isValidNonNegativeNumber(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// Valida la purezza ammessa dal backend.
export function isValidPurity(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1;
}
