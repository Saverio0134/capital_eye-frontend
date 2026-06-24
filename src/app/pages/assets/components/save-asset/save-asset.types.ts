import { Asset, AssetType, Currency, MetalType } from '../../../../models/asset.model';

export type AssetCreateMode = 'financial' | 'physical';
export type AssetCreationFlow = 'linked' | 'standalone';
export type PreciousMetalQuantityMode = 'byPiece' | 'byWeight';

export interface CreateAssetFormValue {
  accountUuid: string;
  name: string;
  type: AssetType;
  baseCurrency: Currency;
  ticker: string;
  isCustom: boolean;
  metalType: MetalType | null;
  purity: number | null;
  weightGrams: number | null;
  preciousMetalQuantityMode: PreciousMetalQuantityMode;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  taxRate: number;
}

const EMPTY_CREATE_ASSET_FORM: Omit<CreateAssetFormValue, 'type'> = {
  accountUuid: '',
  name: '',
  baseCurrency: Currency.EUR,
  ticker: '',
  isCustom: false,
  metalType: MetalType.GOLD,
  purity: 0.999,
  weightGrams: 1,
  preciousMetalQuantityMode: 'byPiece',
  quantity: 1,
  averageBuyPrice: 0,
  currentPrice: 0,
  taxRate: 26,
};

// Restituisce il modello iniziale del form in base al gruppo asset selezionato.
export function createDefaultCreateAssetForm(mode: AssetCreateMode): CreateAssetFormValue {
  return {
    ...EMPTY_CREATE_ASSET_FORM,
    type: mode === 'financial' ? AssetType.STOCK : AssetType.PRECIOUS_METAL,
  };
}

// Adatta un asset esistente al modello del form di creazione/modifica.
export function createAssetFormValueFromAsset(asset: Asset): CreateAssetFormValue {
  const firstPosition = asset.positions[0];

  return {
    accountUuid: firstPosition?.accountUuid ?? '',
    name: asset.name,
    type: asset.type,
    baseCurrency: asset.baseCurrency,
    ticker: asset.ticker ?? '',
    isCustom: asset.isCustom,
    metalType: asset.metalType,
    purity: asset.purity,
    weightGrams: asset.weightGrams,
    preciousMetalQuantityMode: asset.weightGrams ? 'byPiece' : 'byWeight',
    quantity: asset.quantity,
    averageBuyPrice: asset.averageBuyPrice,
    currentPrice: asset.currentPrice,
    taxRate: asset.taxRate,
  };
}
