import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Asset, AssetType, Currency, MetalType } from '../../../../models/asset.model';
import { AssetApi } from '../../../../services/api/asset-api/asset-api';
import { AssetStore } from '../../../../services/store/asset-store/asset-store';
import { FinancialAccountStore } from '../../../../services/store/financial-account-store/financial-account-store';
import { SaveAsset } from './save-asset';

// Crea un asset di test allineato al contratto API con netto incluso.
function createAssetFixture(overrides: Partial<Asset> = {}): Asset {
  return {
    uuid: 'asset-uuid',
    userId: 'user-uuid',
    name: 'VWCE',
    type: AssetType.STOCK,
    baseCurrency: Currency.EUR,
    ticker: 'VWCE',
    isCustom: false,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 2,
    currentPrice: 100,
    totalValue: 200,
    valuationCurrency: Currency.EUR,
    positions: [
      {
        uuid: 'position-uuid',
        accountUuid: 'account-uuid',
        accountName: 'Fineco',
        accountType: 'BANK',
        currency: Currency.EUR,
        quantity: 2,
        currentPrice: 100,
        totalValue: 200,
        averageBuyPrice: 90,
        lastMarketUpdate: null,
      },
    ],
    lastMarketUpdate: null,
    averageBuyPrice: 90,
    taxRate: 26,
    netValue: 200,
    unrealizedGain: 20,
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('SaveAsset', () => {
  let component: SaveAsset;
  let fixture: ComponentFixture<SaveAsset>;
  let assetApi: jasmine.SpyObj<AssetApi>;
  let assetStore: jasmine.SpyObj<AssetStore>;

  beforeEach(async () => {
    assetApi = jasmine.createSpyObj<AssetApi>('AssetApi', ['createAsset', 'updateAsset']);
    assetStore = jasmine.createSpyObj<AssetStore>('AssetStore', [
      'upsertOptimisticAsset',
      'replaceOptimisticAsset',
      'removeOptimisticAsset',
    ]);
    assetApi.createAsset.and.returnValue(of(createAssetFixture()));

    await TestBed.configureTestingModule({
      imports: [SaveAsset],
      providers: [
        {
          provide: AssetApi,
          useValue: assetApi,
        },
        {
          provide: AssetStore,
          useValue: assetStore,
        },
        {
          provide: FinancialAccountStore,
          useValue: {
            financialAccounts: signal([
              {
                uuid: 'account-uuid',
                name: 'Fineco',
                type: 'BANK',
                currency: Currency.EUR,
              },
            ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveAsset);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should preload form values when editing an asset', () => {
    const assetToEdit = createAssetFixture({
      name: 'Bitcoin',
      type: AssetType.CRYPTO,
      ticker: 'BTC',
      isCustom: false,
      quantity: 2,
      currentPrice: 45000,
      totalValue: 90000,
      valuationCurrency: Currency.EUR,
      averageBuyPrice: 30000,
      positions: [
        {
          uuid: 'position-uuid',
          accountUuid: 'account-uuid',
          accountName: 'Fineco',
          accountType: 'BANK',
          currency: Currency.EUR,
          quantity: 2,
          currentPrice: 45000,
          totalValue: 90000,
          averageBuyPrice: 30000,
          lastMarketUpdate: null,
        },
      ],
    });

    fixture.componentRef.setInput('asset', assetToEdit);
    fixture.detectChanges();

    expect(component.createAssetFormModel()).toEqual({
      accountUuid: 'account-uuid',
      name: 'Bitcoin',
      type: AssetType.CRYPTO,
      baseCurrency: Currency.EUR,
      ticker: 'BTC',
      isCustom: false,
      metalType: null,
      purity: null,
      weightGrams: null,
      preciousMetalQuantityMode: 'byPiece',
      quantity: 2,
      averageBuyPrice: 30000,
      currentPrice: 45000,
      taxRate: 26,
    });
  });

  it('should default financial assets to stock type', () => {
    expect(component.createAssetFormModel().type).toBe(AssetType.STOCK);
  });

  it('should default physical assets to precious metal type with automatic price mode', () => {
    fixture.componentRef.setInput('mode', 'physical');
    fixture.detectChanges();

    expect(component.createAssetFormModel().type).toBe(AssetType.PRECIOUS_METAL);
    expect(component.createAssetFormModel().isCustom).toBeFalse();
    expect(component.createAssetFormModel().metalType).toBe(MetalType.GOLD);
  });

  it('should show the generic physical form without ticker or metal fields', () => {
    fixture.componentRef.setInput('mode', 'physical');
    fixture.detectChanges();
    component.createAssetFormModel.set({
      accountUuid: 'account-uuid',
      name: 'Casa Milano',
      type: AssetType.REAL_ESTATE,
      baseCurrency: Currency.EUR,
      ticker: '',
      isCustom: true,
      metalType: null,
      purity: null,
      weightGrams: null,
      preciousMetalQuantityMode: 'byPiece',
      quantity: 1,
      averageBuyPrice: 250000,
      currentPrice: 300000,
      taxRate: 26,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#asset-ticker')).toBeNull();
    expect(fixture.nativeElement.querySelector('#asset-current-price')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#asset-metal-type')).toBeNull();
  });

  it('should submit a typed create asset payload for financial assets', async () => {
    // Stessa istanza per mock e assert: due fixture separate avrebbero updatedAt diversi.
    const savedAsset = createAssetFixture();
    assetApi.createAsset.and.returnValue(of(savedAsset));

    component.createAssetFormModel.set({
      accountUuid: 'account-uuid',
      name: ' VWCE ',
      type: AssetType.STOCK,
      baseCurrency: Currency.EUR,
      ticker: 'vwce',
      isCustom: false,
      metalType: null,
      purity: null,
      weightGrams: null,
      preciousMetalQuantityMode: 'byPiece',
      quantity: 2,
      averageBuyPrice: 90,
      currentPrice: 100,
      taxRate: 26,
    });

    await component.createAsset();

    expect(assetApi.createAsset).toHaveBeenCalledOnceWith({
      accountUuid: 'account-uuid',
      name: 'VWCE',
      type: AssetType.STOCK,
      baseCurrency: Currency.EUR,
      isCustom: false,
      quantity: 2,
      averageBuyPrice: 90,
      ticker: 'VWCE',
      taxRate: 26,
    });
    expect(assetStore.upsertOptimisticAsset).toHaveBeenCalledOnceWith(savedAsset);
    expect(assetStore.replaceOptimisticAsset).not.toHaveBeenCalled();
  });

  it('should submit a standalone asset payload without account or initial position', async () => {
    fixture.componentRef.setInput('mode', 'physical');
    fixture.detectChanges();
    assetApi.createAsset.and.returnValue(
      of(
        createAssetFixture({
          uuid: 'standalone-asset-uuid',
          name: 'Rolex',
          type: AssetType.COLLECTIBLE,
          ticker: null,
          isCustom: true,
          quantity: 0,
          totalValue: 0,
          positions: [],
          averageBuyPrice: 0,
          currentPrice: 900,
        }),
      ),
    );

    component.setCreationFlow('standalone');
    component.createAssetFormModel.set({
      accountUuid: 'account-uuid',
      name: ' Rolex ',
      type: AssetType.COLLECTIBLE,
      baseCurrency: Currency.EUR,
      ticker: '',
      isCustom: true,
      metalType: null,
      purity: null,
      weightGrams: null,
      preciousMetalQuantityMode: 'byPiece',
      quantity: 3,
      averageBuyPrice: 250,
      currentPrice: 900,
      taxRate: 26,
    });
    fixture.detectChanges();

    await component.createAsset();

    expect(assetApi.createAsset).toHaveBeenCalledOnceWith({
      name: 'Rolex',
      type: AssetType.COLLECTIBLE,
      baseCurrency: Currency.EUR,
      isCustom: true,
      quantity: 0,
      averageBuyPrice: 0,
      ticker: null,
      currentPrice: 900,
      taxRate: 26,
    });
  });

  it('should submit a physical generic create payload with initial position data', async () => {
    fixture.componentRef.setInput('mode', 'physical');
    fixture.detectChanges();
    component.createAssetFormModel.set({
      accountUuid: 'account-uuid',
      name: 'Casa Milano',
      type: AssetType.REAL_ESTATE,
      baseCurrency: Currency.EUR,
      ticker: '',
      isCustom: false,
      metalType: null,
      purity: null,
      weightGrams: null,
      preciousMetalQuantityMode: 'byPiece',
      quantity: 1,
      averageBuyPrice: 250000,
      currentPrice: 300000,
      taxRate: 26,
    });
    fixture.detectChanges();

    await component.createAsset();

    expect(assetApi.createAsset).toHaveBeenCalledOnceWith({
      accountUuid: 'account-uuid',
      name: 'Casa Milano',
      type: AssetType.REAL_ESTATE,
      baseCurrency: Currency.EUR,
      isCustom: true,
      quantity: 1,
      averageBuyPrice: 250000,
      ticker: null,
      taxRate: 26,
      currentPrice: 300000,
    });
  });

  it('should submit a precious metal payload with automatic price provider', async () => {
    fixture.componentRef.setInput('mode', 'physical');
    fixture.detectChanges();
    component.createAssetFormModel.set({
      accountUuid: 'account-uuid',
      name: 'Lingotto Oro 1 oz',
      type: AssetType.PRECIOUS_METAL,
      baseCurrency: Currency.EUR,
      ticker: '',
      isCustom: false,
      metalType: MetalType.GOLD,
      purity: 0.999,
      weightGrams: 31.1,
      preciousMetalQuantityMode: 'byPiece',
      quantity: 2,
      averageBuyPrice: 1866,
      currentPrice: 0,
      taxRate: 0,
    });
    fixture.detectChanges();

    await component.createAsset();

    expect(assetApi.createAsset).toHaveBeenCalledOnceWith({
      accountUuid: 'account-uuid',
      name: 'Lingotto Oro 1 oz',
      type: AssetType.PRECIOUS_METAL,
      baseCurrency: Currency.EUR,
      isCustom: false,
      quantity: 2,
      averageBuyPrice: 1866,
      ticker: null,
      metalType: MetalType.GOLD,
      weightGrams: 31.1,
      purity: 0.999,
      taxRate: 0,
    });
  });

  it('should submit a precious metal manual payload by weight', async () => {
    fixture.componentRef.setInput('mode', 'physical');
    fixture.detectChanges();
    component.createAssetFormModel.set({
      accountUuid: 'account-uuid',
      name: 'Oro fisico sfuso',
      type: AssetType.PRECIOUS_METAL,
      baseCurrency: Currency.EUR,
      ticker: '',
      isCustom: true,
      metalType: MetalType.GOLD,
      purity: 0.999,
      weightGrams: 12,
      preciousMetalQuantityMode: 'byWeight',
      quantity: 62.2,
      averageBuyPrice: 0,
      currentPrice: 68.4,
      taxRate: 0,
    });
    fixture.detectChanges();

    await component.createAsset();

    expect(assetApi.createAsset).toHaveBeenCalledOnceWith({
      accountUuid: 'account-uuid',
      name: 'Oro fisico sfuso',
      type: AssetType.PRECIOUS_METAL,
      baseCurrency: Currency.EUR,
      isCustom: true,
      quantity: 62.2,
      averageBuyPrice: 0,
      ticker: null,
      currentPrice: 68.4,
      metalType: MetalType.GOLD,
      weightGrams: null,
      purity: 0.999,
      taxRate: 0,
    });
  });

  it('should submit update asset payload when editing a precious metal asset', async () => {
    const assetToEdit = createAssetFixture({
      name: 'Oro 100g',
      type: AssetType.PRECIOUS_METAL,
      ticker: null,
      isCustom: true,
      metalType: MetalType.GOLD,
      purity: 0.999,
      weightGrams: 100,
      quantity: 1,
      averageBuyPrice: 6500,
      currentPrice: 7000,
      totalValue: 6993,
    });
    assetApi.updateAsset.and.returnValue(
      of({
        ...assetToEdit,
        name: 'Oro 50g',
        weightGrams: 50,
        currentPrice: 3600,
        updatedAt: new Date(),
      }),
    );

    fixture.componentRef.setInput('asset', assetToEdit);
    fixture.detectChanges();
    component.createAssetFormModel.update((value) => ({
      ...value,
      name: ' Oro 50g ',
      weightGrams: 50,
      currentPrice: 3600,
    }));

    await component.createAsset();

    expect(assetApi.updateAsset).toHaveBeenCalledOnceWith('asset-uuid', {
      name: 'Oro 50g',
      type: AssetType.PRECIOUS_METAL,
      baseCurrency: Currency.EUR,
      isCustom: true,
      ticker: null,
      currentPrice: 3600,
      metalType: MetalType.GOLD,
      weightGrams: 50,
      purity: 0.999,
      taxRate: 26,
    });
  });

  it('should prevent automatic stock creation without ticker', async () => {
    component.createAssetFormModel.set({
      accountUuid: 'account-uuid',
      name: 'VWCE',
      type: AssetType.STOCK,
      baseCurrency: Currency.EUR,
      ticker: ' ',
      isCustom: false,
      metalType: null,
      purity: null,
      weightGrams: null,
      preciousMetalQuantityMode: 'byPiece',
      quantity: 2,
      averageBuyPrice: 90,
      currentPrice: 100,
      taxRate: 26,
    });

    await component.createAsset();

    expect(assetApi.createAsset).not.toHaveBeenCalled();
  });

  it('should prevent manual precious metal creation without current price', async () => {
    fixture.componentRef.setInput('mode', 'physical');
    fixture.detectChanges();
    component.createAssetFormModel.set({
      accountUuid: 'account-uuid',
      name: 'Oro manuale',
      type: AssetType.PRECIOUS_METAL,
      baseCurrency: Currency.EUR,
      ticker: '',
      isCustom: true,
      metalType: MetalType.GOLD,
      purity: 0.999,
      weightGrams: null,
      preciousMetalQuantityMode: 'byWeight',
      quantity: 10,
      averageBuyPrice: 0,
      currentPrice: 0,
      taxRate: 0,
    });
    fixture.detectChanges();

    await component.createAsset();

    expect(assetApi.createAsset).not.toHaveBeenCalled();
  });

  it('should force quantity and average buy price to zero in standalone mode', () => {
    fixture.componentRef.setInput('mode', 'physical');
    fixture.detectChanges();
    component.createAssetFormModel.set({
      accountUuid: 'account-uuid',
      name: 'Standalone',
      type: AssetType.COLLECTIBLE,
      baseCurrency: Currency.EUR,
      ticker: '',
      isCustom: true,
      metalType: null,
      purity: null,
      weightGrams: null,
      preciousMetalQuantityMode: 'byPiece',
      quantity: 3,
      averageBuyPrice: 250,
      currentPrice: 900,
      taxRate: 26,
    });

    component.setCreationFlow('standalone');
    fixture.detectChanges();

    expect(component.createAssetFormModel().accountUuid).toBe('');
    expect(component.createAssetFormModel().quantity).toBe(0);
    expect(component.createAssetFormModel().averageBuyPrice).toBe(0);
  });
});
