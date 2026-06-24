import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Resource, signal } from '@angular/core';
import { Currency } from '../../models/asset.model';
import { LiquidityMonthlyTable } from '../../models/liquidity.model';
import { FinancialAccountStore } from '../../services/store/financial-account-store/financial-account-store';
import { LiquidityStore } from '../../services/store/liquidity-store/liquidity-store';

import Liquidity from './liquidity';

function createMonthlyTableResourceStub(value: LiquidityMonthlyTable): Resource<LiquidityMonthlyTable> {
  function hasValue(
    this: Resource<LiquidityMonthlyTable> | never,
  ): this is Resource<LiquidityMonthlyTable> {
    return true;
  }

  return {
    value: signal(value),
    status: signal('resolved'),
    error: signal(undefined),
    isLoading: signal(false),
    snapshot: signal({
      status: 'resolved',
      previousStatus: 'loading',
      value,
      error: undefined,
    }),
    hasValue,
  };
}

describe('Liquidita', () => {
  let component: Liquidity;
  let fixture: ComponentFixture<Liquidity>;
  let liquidityStore: jasmine.SpyObj<LiquidityStore>;
  let financialAccountStore: jasmine.SpyObj<FinancialAccountStore>;

  beforeEach(async () => {
    const monthlyTable: LiquidityMonthlyTable = {
      accounts: [
        {
          uuid: 'account-uuid',
          name: 'Fineco',
          type: 'BANK',
          currency: Currency.EUR,
        },
      ],
      rows: [],
    };

    liquidityStore = jasmine.createSpyObj<LiquidityStore>(
      'LiquidityStore',
      ['reloadLiquidityData'],
      {
        totalLatestLiquidity: signal({
          totalLiquidity: 7800,
          growth: {
            oneMonth: 0,
            threeMonths: 0,
            sixMonths: 0,
            year: 0,
          },
          lastUpdate: new Date('2026-04-10T11:15:00'),
        }),
        monthlyTable: signal(monthlyTable),
        monthlyTableResource: signal(createMonthlyTableResourceStub(monthlyTable)),
      },
    );
    liquidityStore.reloadLiquidityData.and.returnValue(true);
    financialAccountStore = jasmine.createSpyObj<FinancialAccountStore>(
      'FinancialAccountStore',
      ['reloadFinancialAccounts'],
      {
        financialAccounts: signal([]),
      },
    );
    financialAccountStore.reloadFinancialAccounts.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [Liquidity],
      providers: [
        {
          provide: LiquidityStore,
          useValue: liquidityStore,
        },
        {
          provide: FinancialAccountStore,
          useValue: financialAccountStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Liquidity);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open create dialog without a selected financial account', () => {
    component.onCreateBank();

    expect(component.selectedFinancialAccount()).toBeNull();
    expect(component.isSaveFinancialAccountDialogOpen()).toBeTrue();
  });

  it('should open update dialog with the selected financial account', () => {
    const account = component.banks()[0].financialAccount;

    component.onEditBank(account);

    expect(component.selectedFinancialAccount()).toEqual(account);
    expect(component.isSaveFinancialAccountDialogOpen()).toBeTrue();
  });

  it('should reload financial accounts after save', () => {
    component.onFinancialAccountSaved();

    expect(financialAccountStore.reloadFinancialAccounts).toHaveBeenCalled();
    expect(liquidityStore.reloadLiquidityData).toHaveBeenCalled();
  });
});
