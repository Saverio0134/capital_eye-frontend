import { FinancialAccount } from './financial-account.model';
import { Asset } from './asset.model';

export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  uuid: string;
  assetUuid: string;
  accountUuid: string;
  type: TransactionType;
  date: Date;
  quantity: number;
  totalAmount: number;
  fees: number | null;
  notes: string | null;
  realizedGain: number | null;
  taxAmount: number | null;
  createdAt: Date;
}

export interface CreateTransactionPayload {
  assetUuid: string;
  accountUuid: string;
  type: TransactionType;
  date: string;
  quantity: number;
  totalAmount: number;
}

export interface LiquiditySnapshotWithAccount {
  uuid: string;
  accountUuid: string;
  date: Date;
  amount: number;
  createdAt: Date;
  account: FinancialAccount;
}

export interface CreateLiquiditySnapshotPayload {
  accountUuid: string;
  date: string;
  amount: number;
}

export interface AssetSnapshot {
  uuid: string;
  assetUuid: string;
  date: Date;
  value: number;
  quantity: number | null;
  unitPriceInUserCurrency: number | null;
  createdAt: Date;
}

export interface AssetSnapshotWithAsset extends AssetSnapshot {
  asset: Asset;
}

export interface CreateAssetSnapshotPayload {
  assetUuid: string;
  date: string;
  value: number;
}
