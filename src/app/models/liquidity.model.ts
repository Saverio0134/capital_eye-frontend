import { AccountType } from '../enum/account.enum';
import { Currency } from './asset.model';
import { Growth } from './growth.model';

export interface LiquidityWithGrowth {
  totalLiquidity: number;
  growth: Growth;
  lastUpdate?: Date;
}

export interface LiquiditySnapshot {
  uuid: string;
  accountUuid: string;
  date: Date;
  amount: number;
  createdAt: Date;
}
export interface LiquidityMonthlyTableAccount {
  uuid: string;
  name: string;
  type: AccountType;
  currency: Currency;
}

export interface LiquidityMonthlyTableRow {
  month: string;
  values: Record<string, number>;
  deltas: Record<string, number>;
  total: number;
  totalDelta: number;
}

export interface LiquidityMonthlyTable {
  accounts: LiquidityMonthlyTableAccount[];
  rows: LiquidityMonthlyTableRow[];
}
