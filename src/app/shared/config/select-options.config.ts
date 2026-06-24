import { AccountType } from '../../enum/account.enum';
import { AssetType, Currency, MetalType } from '../../models/asset.model';

export interface SelectOption<T> {
  label: string;
  value: T;
}

export const CURRENCY_OPTIONS: SelectOption<Currency>[] = [
  { label: 'EUR (€)', value: Currency.EUR },
  { label: 'USD ($)', value: Currency.USD },
  { label: 'GBP (£)', value: Currency.GBP },
  { label: 'JPY (¥)', value: Currency.JPY },
  { label: 'CHF (Fr)', value: Currency.CHF },
  { label: 'AUD ($)', value: Currency.AUD },
  { label: 'CAD ($)', value: Currency.CAD },
  { label: 'CNY (¥)', value: Currency.CNY },
  { label: 'SEK (kr)', value: Currency.SEK },
  { label: 'NZD ($)', value: Currency.NZD },
];

export const ACCOUNT_TYPE_OPTIONS: SelectOption<AccountType>[] = [
  { label: 'BANCA', value: 'BANK' },
  { label: 'CARTE / BROKER', value: 'BROKER' },
  { label: 'CONTANTI / CASH', value: 'PHYSICAL_VAULT' },
  { label: 'ALTRO / WALLET', value: 'WALLET' },
];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  [AssetType.STOCK]: 'Stock / ETF',
  [AssetType.CRYPTO]: 'Crypto',
  [AssetType.REAL_ESTATE]: 'Real estate',
  [AssetType.PRECIOUS_METAL]: 'Precious metal',
  [AssetType.VEHICLE]: 'Vehicle',
  [AssetType.COLLECTIBLE]: 'Collectible',
  [AssetType.CASH_EQUIVALENT]: 'Cash',
};

export const ASSET_TYPE_OPTIONS: SelectOption<AssetType>[] = [
  { label: 'AZIONI/ETF', value: AssetType.STOCK },
  { label: 'CRYPTO', value: AssetType.CRYPTO },
  { label: 'METALLI PREZIOSI', value: AssetType.PRECIOUS_METAL },
  { label: 'IMMOBILI', value: AssetType.REAL_ESTATE },
  { label: 'VEICOLI', value: AssetType.VEHICLE },
  { label: 'COLLEZIONI', value: AssetType.COLLECTIBLE },
  { label: 'LIQUIDITÀ', value: AssetType.CASH_EQUIVALENT },
];

export const FINANCIAL_ASSET_TYPE_OPTIONS: SelectOption<AssetType>[] = ASSET_TYPE_OPTIONS.filter(
  (option) => option.value === AssetType.STOCK || option.value === AssetType.CRYPTO,
);

export const PHYSICAL_ASSET_TYPE_OPTIONS: SelectOption<AssetType>[] = ASSET_TYPE_OPTIONS.filter(
  (option) =>
    option.value === AssetType.PRECIOUS_METAL ||
    option.value === AssetType.REAL_ESTATE ||
    option.value === AssetType.VEHICLE ||
    option.value === AssetType.COLLECTIBLE ||
    option.value === AssetType.CASH_EQUIVALENT,
);

export const ASSET_TYPE_FILTER_OPTIONS: SelectOption<AssetType | null>[] = [
  { label: 'TUTTI GLI ASSET', value: null },
  ...ASSET_TYPE_OPTIONS.filter((option) => option.value !== AssetType.VEHICLE),
];

export const METAL_TYPE_OPTIONS: SelectOption<MetalType>[] = [
  { label: 'ORO', value: MetalType.GOLD },
  { label: 'ARGENTO', value: MetalType.SILVER },
  { label: 'PLATINO', value: MetalType.PLATINUM },
  { label: 'PALLADIO', value: MetalType.PALLADIUM },
];
