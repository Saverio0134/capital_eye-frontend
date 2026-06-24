import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Currency } from '../../../models/asset.model';
import { FinancialAccount } from '../../../models/financial-account.model';
import { FinancialAccountApi } from '../../../services/api/financial-account-api/financial-account-api';
import { FinancialAccountStore } from '../../../services/store/financial-account-store/financial-account-store';
import { SaveFinancialAccount } from './save-financial-account';

describe('SaveFinancialAccount', () => {
  let component: SaveFinancialAccount;
  let fixture: ComponentFixture<SaveFinancialAccount>;
  let financialAccountApi: jasmine.SpyObj<FinancialAccountApi>;
  let financialAccountStore: jasmine.SpyObj<FinancialAccountStore>;

  const savedAccount: FinancialAccount = {
    uuid: 'account-uuid',
    userId: 'user-uuid',
    name: 'Fineco',
    type: 'BANK',
    currency: Currency.EUR,
  };

  beforeEach(async () => {
    financialAccountApi = jasmine.createSpyObj<FinancialAccountApi>('FinancialAccountApi', [
      'createFinancialAccount',
      'updateFinancialAccount',
    ]);
    financialAccountStore = jasmine.createSpyObj<FinancialAccountStore>(
      'FinancialAccountStore',
      [
        'upsertOptimisticFinancialAccount',
        'replaceOptimisticFinancialAccount',
        'removeOptimisticFinancialAccount',
      ],
      {
        financialAccounts: signal([]),
      },
    );
    financialAccountApi.createFinancialAccount.and.returnValue(of(savedAccount));
    financialAccountApi.updateFinancialAccount.and.returnValue(of(savedAccount));

    await TestBed.configureTestingModule({
      imports: [SaveFinancialAccount],
      providers: [
        {
          provide: FinancialAccountApi,
          useValue: financialAccountApi,
        },
        {
          provide: FinancialAccountStore,
          useValue: financialAccountStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveFinancialAccount);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit a typed create financial account payload', async () => {
    component.financialAccountFormModel.set({
      name: ' Fineco ',
      type: 'BANK',
      currency: Currency.EUR,
    });

    await component.saveFinancialAccount();

    expect(financialAccountApi.createFinancialAccount).toHaveBeenCalledOnceWith({
      name: 'Fineco',
      type: 'BANK',
      currency: Currency.EUR,
    });
    expect(financialAccountStore.upsertOptimisticFinancialAccount).toHaveBeenCalled();
    expect(financialAccountStore.replaceOptimisticFinancialAccount).toHaveBeenCalledOnceWith(
      jasmine.stringMatching(/^optimistic-financial-account-/),
      savedAccount,
    );
    expect(financialAccountApi.updateFinancialAccount).not.toHaveBeenCalled();
  });

  it('should submit a typed update financial account payload', async () => {
    fixture.componentRef.setInput('financialAccount', savedAccount);
    fixture.detectChanges();

    component.financialAccountFormModel.set({
      name: ' Revolut ',
      type: 'WALLET',
      currency: Currency.USD,
    });

    await component.saveFinancialAccount();

    expect(financialAccountApi.updateFinancialAccount).toHaveBeenCalledOnceWith('account-uuid', {
      name: 'Revolut',
      type: 'WALLET',
      currency: Currency.USD,
    });
    expect(financialAccountStore.upsertOptimisticFinancialAccount).toHaveBeenCalledWith(
      jasmine.objectContaining({
        uuid: 'account-uuid',
        name: 'Revolut',
        type: 'WALLET',
        currency: Currency.USD,
        updatedAt: jasmine.any(Date),
      }),
    );
    expect(financialAccountStore.replaceOptimisticFinancialAccount).toHaveBeenCalledOnceWith(
      'account-uuid',
      savedAccount,
    );
    expect(financialAccountApi.createFinancialAccount).not.toHaveBeenCalled();
  });

  it('should prefill the form in update mode', () => {
    fixture.componentRef.setInput('financialAccount', {
      ...savedAccount,
      name: 'Hype',
      type: 'BROKER',
      currency: Currency.GBP,
    });
    fixture.detectChanges();

    expect(component.financialAccountFormModel()).toEqual({
      name: 'Hype',
      type: 'BROKER',
      currency: Currency.GBP,
    });
  });

  it('should reset the form in create mode', () => {
    fixture.componentRef.setInput('financialAccount', savedAccount);
    fixture.detectChanges();
    fixture.componentRef.setInput('financialAccount', null);
    fixture.detectChanges();

    expect(component.financialAccountFormModel()).toEqual({
      name: '',
      type: 'BANK',
      currency: Currency.EUR,
    });
  });

  it('should not submit when the name is blank', async () => {
    component.financialAccountFormModel.set({
      name: '   ',
      type: 'BANK',
      currency: Currency.EUR,
    });

    await component.saveFinancialAccount();

    expect(financialAccountApi.createFinancialAccount).not.toHaveBeenCalled();
    expect(financialAccountApi.updateFinancialAccount).not.toHaveBeenCalled();
  });

  it('should expose an error and reset loading when the API fails', async () => {
    financialAccountApi.createFinancialAccount.and.returnValue(
      throwError(() => new Error('Save failed')),
    );
    component.financialAccountFormModel.set({
      name: 'Fineco',
      type: 'BANK',
      currency: Currency.EUR,
    });

    await component.saveFinancialAccount();

    expect(component.isSavingFinancialAccount()).toBeFalse();
    expect(financialAccountStore.removeOptimisticFinancialAccount).toHaveBeenCalledWith(
      jasmine.stringMatching(/^optimistic-financial-account-/),
    );
  });
});
