import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Currency } from '../../../models/asset.model';
import { FinancialAccount } from '../../../models/financial-account.model';
import { FinancialAccountApi } from '../../api/financial-account-api/financial-account-api';
import { AuthStore } from '../auth-store/auth-store';
import { FinancialAccountStore } from './financial-account-store';

function createFinancialAccountFixture(
  overrides: Partial<FinancialAccount> = {},
): FinancialAccount {
  return {
    uuid: 'account-1',
    userId: 'user-1',
    name: 'Fineco',
    type: 'BANK',
    currency: Currency.EUR,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('FinancialAccountStore', () => {
  let service: FinancialAccountStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FinancialAccountApi,
          useValue: {
            financialAccounts: '/financial-accounts',
          },
        },
        {
          provide: AuthStore,
          useValue: {
            authToken: signal(''),
          },
        },
      ],
    });

    service = TestBed.inject(FinancialAccountStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose an empty financial accounts list by default', () => {
    expect(service.financialAccounts()).toEqual([]);
  });

  it('should merge optimistic financial accounts into the derived list', () => {
    const account = createFinancialAccountFixture();

    service.upsertOptimisticFinancialAccount(account);

    expect(service.financialAccounts()).toEqual([account]);
  });

  it('should replace an optimistic financial account with the saved one', () => {
    const optimisticAccount = createFinancialAccountFixture({
      uuid: 'optimistic-account-1',
      name: 'Conto provvisorio',
    });
    const savedAccount = createFinancialAccountFixture({
      uuid: 'account-1',
      name: 'Fineco aggiornato',
    });

    service.upsertOptimisticFinancialAccount(optimisticAccount);
    service.replaceOptimisticFinancialAccount(optimisticAccount.uuid, savedAccount);

    expect(service.financialAccounts()).toEqual([savedAccount]);
  });
});
