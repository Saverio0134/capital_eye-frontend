import { Asset, Currency } from '../../models/asset.model';
import { FinancialAccount } from '../../models/financial-account.model';
import {
  LiquiditySnapshotWithAccount,
  Transaction,
  TransactionType,
} from '../../models/transaction.model';

export type RegisterTab = 'liquidity' | 'assets';

export interface LiquidityRegisterFormValue {
  accountUuid: string;
  date: Date | null;
  amount: number | null;
}

export interface AssetRegisterFormValue {
  assetUuid: string;
  accountUuid: string;
  type: TransactionType;
  date: Date | null;
  quantity: number | null;
  totalAmount: number | null;
}

interface RegisterEntryBase {
  id: string;
  kind: RegisterTab;
  typeLabel: string;
  elementLabel: string;
  currency: Currency;
  quantity: number | null;
  price: number | null;
  total: number;
  date: Date;
  canDelete: boolean;
  isOptimistic?: boolean;
}

export interface LiquidityRegisterEntry extends RegisterEntryBase {
  kind: 'liquidity';
  snapshot: LiquiditySnapshotWithAccount;
  account: FinancialAccount;
}

export interface AssetRegisterEntry extends RegisterEntryBase {
  kind: 'assets';
  transaction: Transaction;
  asset: Asset | null;
  account: FinancialAccount | null;
}

export type RegisterEntry = LiquidityRegisterEntry | AssetRegisterEntry;
