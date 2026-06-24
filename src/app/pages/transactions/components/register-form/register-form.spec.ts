import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Asset, AssetType, Currency } from '../../../../models/asset.model';
import { RegisterForm } from './register-form';

// Crea un asset di test con netto già fornito dall'API.
function createAssetFixture(accountUuid: string, currency: Currency, overrides: Partial<Asset> = {}): Asset {
  return {
    uuid: 'asset-1',
    userId: 'user-1',
    name: 'VWCE',
    type: AssetType.STOCK,
    baseCurrency: currency,
    ticker: 'VWCE',
    isCustom: false,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 1,
    currentPrice: 100,
    totalValue: 100,
    valuationCurrency: currency,
    positions: [
      {
        uuid: 'position-1',
        accountUuid,
        accountName: 'Conto principale',
        accountType: 'BANK',
        currency,
        quantity: 1,
        currentPrice: 100,
        totalValue: 100,
        averageBuyPrice: 90,
        lastMarketUpdate: null,
      },
    ],
    lastMarketUpdate: null,
    averageBuyPrice: 90,
    taxRate: 26,
    netValue: 100,
    unrealizedGain: 10,
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('RegisterForm', () => {
  let component: RegisterForm;
  let fixture: ComponentFixture<RegisterForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterForm],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterForm);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('activeTab', 'liquidity');
    fixture.componentRef.setInput('accounts', [
      {
        uuid: 'account-1',
        name: 'Conto principale',
        type: 'BANK',
        currency: Currency.EUR,
      },
    ]);
    fixture.componentRef.setInput('assets', [
      createAssetFixture('account-1', Currency.EUR),
    ]);

    fixture.detectChanges();
  });

  it('should realign stale selections when available options change', () => {
    component.liquidityFormModel.set({
      accountUuid: 'missing-account',
      date: new Date(2026, 4, 11),
      amount: 100,
    });
    component.assetFormModel.set({
      assetUuid: 'missing-asset',
      accountUuid: 'missing-account',
      type: 'BUY',
      date: new Date(2026, 4, 11),
      quantity: 1,
      totalAmount: 100,
    });

    fixture.componentRef.setInput('accounts', [
      {
        uuid: 'account-2',
        name: 'Conto secondario',
        type: 'BANK',
        currency: Currency.USD,
      },
    ]);
    fixture.componentRef.setInput('assets', [
      createAssetFixture('account-2', Currency.USD, {
        uuid: 'asset-2',
        name: 'BTC',
        type: AssetType.CRYPTO,
        ticker: 'BTC',
        positions: [
          {
            uuid: 'position-2',
            accountUuid: 'account-2',
            accountName: 'Conto secondario',
            accountType: 'BANK',
            currency: Currency.USD,
            quantity: 1,
            currentPrice: 100,
            totalValue: 100,
            averageBuyPrice: 90,
            lastMarketUpdate: null,
          },
        ],
      }),
    ]);
    fixture.detectChanges();

    expect(component.liquidityFormModel().accountUuid).toBe('account-2');
    expect(component.assetFormModel().accountUuid).toBe('account-2');
    expect(component.assetFormModel().assetUuid).toBe('asset-2');
  });

  it('should show the asset form when the asset tab is active', () => {
    fixture.componentRef.setInput('activeTab', 'assets');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('app-register-asset-form'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-register-liquidity-form'))).toBeNull();
  });

  it('should clear touched validation state when the asset form is reset', () => {
    fixture.componentRef.setInput('activeTab', 'assets');
    fixture.detectChanges();

    component.assetForm.quantity().markAsTouched();
    component.assetForm.totalAmount().markAsTouched();
    fixture.detectChanges();

    expect(component.assetForm.quantity().touched()).toBeTrue();
    expect(component.assetForm.totalAmount().touched()).toBeTrue();

    fixture.componentRef.setInput('assetResetToken', 1);
    fixture.detectChanges();

    expect(component.assetForm.quantity().touched()).toBeFalse();
    expect(component.assetForm.totalAmount().touched()).toBeFalse();
    expect(component.assetFormModel().quantity).toBeNull();
    expect(component.assetFormModel().totalAmount).toBe(0);
  });
});
