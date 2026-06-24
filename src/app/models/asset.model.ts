import { AccountType } from '../enum/account.enum';
import { Growth } from './growth.model';

export interface AssetPosition {
  uuid: string;
  accountUuid: string;
  accountName: string;
  accountType: AccountType;
  currency: Currency;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  averageBuyPrice: number;
  lastMarketUpdate: Date | null;
}

export interface Asset {
  uuid: string;
  userId: string;
  name: string;
  type: AssetType;
  baseCurrency: Currency;
  ticker: string | null;
  isCustom: boolean;
  metalType: MetalType | null;
  weightGrams: number | null;
  purity: number | null;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  valuationCurrency: Currency;
  positions: AssetPosition[];
  lastMarketUpdate: Date | null;
  averageBuyPrice: number;
  taxRate: number;
  netValue: number;
  unrealizedGain: number;
  updatedAt?: Date;
}

export interface CreateAssetWithPositionPayload {
  accountUuid: string;
  name: string;
  type: AssetType;
  baseCurrency: Currency;
  isCustom: boolean;
  quantity: number;
  averageBuyPrice: number;
  ticker?: string | null;
  currentPrice?: number;
  taxRate?: number;
  metalType?: MetalType | null;
  weightGrams?: number | null;
  purity?: number | null;
}

export interface CreateStandaloneAssetPayload {
  name: string;
  type: AssetType;
  baseCurrency: Currency;
  isCustom: boolean;
  quantity: 0;
  averageBuyPrice: 0;
  ticker?: string | null;
  currentPrice?: number;
  taxRate?: number;
  metalType?: MetalType | null;
  weightGrams?: number | null;
  purity?: number | null;
}

export interface LinkAssetToAccountPayload {
  assetUuid: string;
  accountUuid: string;
}

export type CreateAssetPayload =
  | CreateAssetWithPositionPayload
  | CreateStandaloneAssetPayload
  | LinkAssetToAccountPayload;

export interface UpdateAssetPayload {
  name: string;
  type: AssetType;
  baseCurrency: Currency;
  isCustom?: boolean;
  ticker?: string | null;
  currentPrice?: number;
  taxRate?: number;
  metalType?: MetalType | null;
  weightGrams?: number | null;
  purity?: number | null;
}

export enum AssetType {
  STOCK = 'STOCK',
  CRYPTO = 'CRYPTO',
  REAL_ESTATE = 'REAL_ESTATE',
  PRECIOUS_METAL = 'PRECIOUS_METAL',
  VEHICLE = 'VEHICLE',
  COLLECTIBLE = 'COLLECTIBLE',
  CASH_EQUIVALENT = 'CASH_EQUIVALENT',
}
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CHF = 'CHF',
  AUD = 'AUD',
  CAD = 'CAD',
  CNY = 'CNY',
  SEK = 'SEK',
  NZD = 'NZD',
}

export enum MetalType {
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  PLATINUM = 'PLATINUM',
  PALLADIUM = 'PALLADIUM',
}
export interface AssetGroup {
  assets: Asset[];
  netTotal: number;
  growth: Growth;
  lastUpdate?: Date;
}

export interface MonthlyAssetVariationPoint {
  date: string;
  value: number;
  changeValue: number;
  changePercentage: number;
}

export interface MonthlyAssetVariation {
  assetUuid: string;
  name: string;
  ticker: string | null;
  type: AssetType | string;
  monthlyVariations: MonthlyAssetVariationPoint[];
  dateLastSnapshot: string | null;
}

//TODO spostarla
export interface AllAssetsWithNet {
  intangibleAssets: AssetGroup;
  physicalAssets: AssetGroup;
}
