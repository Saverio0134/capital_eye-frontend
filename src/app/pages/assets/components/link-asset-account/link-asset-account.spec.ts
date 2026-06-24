import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Asset, AssetType, Currency } from '../../../../models/asset.model';
import { AssetApi } from '../../../../services/api/asset-api/asset-api';
import { AssetStore } from '../../../../services/store/asset-store/asset-store';
import { FinancialAccountStore } from '../../../../services/store/financial-account-store/financial-account-store';
import { AssetAccountsDialog } from './link-asset-account';

// Crea un asset compatibile con il dialog conti.
function createAssetFixture(overrides: Partial<Asset> = {}): Asset {
  return {
    uuid: 'asset-1',
    userId: 'user-1',
    name: 'VWCE',
    type: AssetType.STOCK,
    baseCurrency: Currency.EUR,
    ticker: 'VWCE',
    isCustom: false,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 1,
    currentPrice: 100,
    totalValue: 100,
    valuationCurrency: Currency.EUR,
    positions: [
      {
        uuid: 'position-1',
        accountUuid: 'account-1',
        accountName: 'Conto principale',
        accountType: 'BANK',
        currency: Currency.EUR,
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

describe('AssetAccountsDialog', () => {
  let component: AssetAccountsDialog;
  let fixture: ComponentFixture<AssetAccountsDialog>;
  let assetApi: jasmine.SpyObj<AssetApi>;
  let assetStore: jasmine.SpyObj<AssetStore>;
  let intangibleAssetsSignal: ReturnType<
    typeof signal<{
      assets: Asset[];
      netTotal: number;
      growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
      lastUpdate: Date;
    }>
  >;

  beforeEach(async () => {
    assetApi = jasmine.createSpyObj<AssetApi>('AssetApi', ['createAsset', 'deleteAssetPosition']);
    assetStore = jasmine.createSpyObj<AssetStore>('AssetStore', [
      'upsertOptimisticAsset',
      'replaceOptimisticAsset',
    ]);
    intangibleAssetsSignal = signal({
      assets: [createAssetFixture()],
      netTotal: 100,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });
    assetStore.replaceOptimisticAsset.and.callFake((_tempUuid: string, asset: Asset) => {
      intangibleAssetsSignal.set({
        assets: [asset],
        netTotal: asset.netValue,
        growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
        lastUpdate: new Date(),
      });
    });

    await TestBed.configureTestingModule({
      imports: [AssetAccountsDialog],
      providers: [
        {
          provide: AssetApi,
          useValue: assetApi,
        },
        {
          provide: AssetStore,
          useValue: {
            ...assetStore,
            intangibleAssets: intangibleAssetsSignal,
            physicalAssets: signal({
              assets: [],
              netTotal: 0,
              growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
              lastUpdate: new Date(),
            }),
          },
        },
        {
          provide: FinancialAccountStore,
          useValue: {
            financialAccounts: signal([
              {
                uuid: 'account-1',
                name: 'Conto principale',
                type: 'BANK',
                currency: Currency.EUR,
              },
              {
                uuid: 'account-2',
                name: 'Broker secondario',
                type: 'BANK',
                currency: Currency.USD,
              },
            ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetAccountsDialog);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('asset', createAssetFixture());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit and reset the form after linking an account', async () => {
    assetApi.createAsset.and.returnValue(
      of(
        createAssetFixture({
          positions: [
            ...createAssetFixture().positions,
            {
              uuid: 'position-2',
              accountUuid: 'account-2',
              accountName: 'Broker secondario',
              accountType: 'BANK',
              currency: Currency.USD,
              quantity: 0,
              currentPrice: 100,
              totalValue: 0,
              averageBuyPrice: 0,
              lastMarketUpdate: null,
            },
          ],
        }),
      ),
    );
    const changedSpy = jasmine.createSpy('changed');

    component.assetAccountsChanged.subscribe(changedSpy);
    component.formModel.set({ accountUuid: 'account-2' });

    await component.linkAssetToAccount();

    expect(assetApi.createAsset).toHaveBeenCalledOnceWith({
      assetUuid: 'asset-1',
      accountUuid: 'account-2',
    });
    expect(assetStore.replaceOptimisticAsset).toHaveBeenCalled();
    expect(component.formModel().accountUuid).toBe('');
    expect(changedSpy).toHaveBeenCalled();
  });
});
