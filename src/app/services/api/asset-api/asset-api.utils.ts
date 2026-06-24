import {
  AllAssetsWithNet,
  Asset,
  AssetGroup,
  AssetPosition,
  Currency,
  MonthlyAssetVariation,
} from '../../../models/asset.model';

type ApiDateValue = Date | string | null | undefined;

function toDateOrNull(value: ApiDateValue): Date | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function toDateOrUndefined(value: ApiDateValue): Date | undefined {
  const normalizedDate = toDateOrNull(value);
  return normalizedDate ?? undefined;
}

function resolveAssetLastMarketUpdate(
  lastMarketUpdate: ApiDateValue,
  positions: AssetPosition[],
): Date | null {
  const normalizedAssetLastMarketUpdate = toDateOrNull(lastMarketUpdate);

  if (normalizedAssetLastMarketUpdate) {
    return normalizedAssetLastMarketUpdate;
  }

  const validTimestamps = positions
    .map((position) => position.lastMarketUpdate)
    .filter((value): value is Date => value instanceof Date)
    .map((value) => value.getTime());

  if (validTimestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...validTimestamps));
}

export function normalizeAssetPosition(position: AssetPosition): AssetPosition {
  return {
    ...position,
    currency: position.currency ?? Currency.EUR,
    lastMarketUpdate: toDateOrNull(position.lastMarketUpdate),
  };
}

// Normalizza l'asset API mantenendo netto e guadagno già calcolati dal backend.
export function normalizeAsset(asset: Asset): Asset {
  const positions = (asset.positions ?? []).map(normalizeAssetPosition);

  return {
    ...asset,
    baseCurrency: asset.baseCurrency ?? Currency.EUR,
    valuationCurrency: asset.valuationCurrency ?? asset.baseCurrency ?? Currency.EUR,
    positions,
    lastMarketUpdate: resolveAssetLastMarketUpdate(asset.lastMarketUpdate, positions),
    netValue:
      typeof asset.netValue === 'number' && Number.isFinite(asset.netValue)
        ? asset.netValue
        : asset.totalValue,
    unrealizedGain:
      typeof asset.unrealizedGain === 'number' && Number.isFinite(asset.unrealizedGain)
        ? asset.unrealizedGain
        : 0,
    updatedAt: toDateOrUndefined(asset.updatedAt),
  };
}

function normalizeAssetGroup(group: AssetGroup): AssetGroup {
  return {
    ...group,
    assets: (group.assets ?? []).map(normalizeAsset),
    lastUpdate: toDateOrUndefined(group.lastUpdate),
  };
}

export function normalizeAllAssetsWithNet(payload: AllAssetsWithNet): AllAssetsWithNet {
  return {
    intangibleAssets: normalizeAssetGroup(payload.intangibleAssets),
    physicalAssets: normalizeAssetGroup(payload.physicalAssets),
  };
}

export function normalizeMonthlyAssetVariations(
  payload: MonthlyAssetVariation[],
): MonthlyAssetVariation[] {
  return payload.map((variation) => ({
    ...variation,
    monthlyVariations: [...variation.monthlyVariations],
  }));
}
