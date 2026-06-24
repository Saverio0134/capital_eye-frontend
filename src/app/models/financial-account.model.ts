import { AccountType } from '../enum/account.enum';
import { Currency } from './asset.model';

export interface FinancialAccount {
  uuid: string;
  userId?: string;
  name: string;
  type: AccountType;
  currency: Currency;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateFinancialAccountPayload {
  name: string;
  type: AccountType;
  currency: Currency;
}

export type UpdateFinancialAccountPayload = Partial<CreateFinancialAccountPayload>;
