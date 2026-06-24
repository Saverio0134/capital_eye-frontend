import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Asset, AssetType, Currency } from '../../../models/asset.model';
import { AssetApi } from '../../api/asset-api/asset-api';
import { AssetStore } from './asset-store';
import { AuthStore } from '../auth-store/auth-store';

// Crea un asset di test conforme al payload backend corrente.
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
    positions: [],
    lastMarketUpdate: null,
    averageBuyPrice: 90,
    taxRate: 26,
    netValue: 100,
    unrealizedGain: 10,
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AssetStore', () => {
  let service: AssetStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AssetApi,
          useValue: {
            base: '/assets',
            getMonthlyVariations: () => '/assets/monthly-variations',
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
    service = TestBed.inject(AssetStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose an empty monthly variations list by default', () => {
    expect(service.monthlyVariations()).toEqual([]);
  });

  it('should hide an optimistically deleted asset from derived data', () => {
    const asset = createAssetFixture();

    service.upsertOptimisticAsset(asset);
    expect(service.intangibleAssets()?.assets).toEqual([asset]);

    service.markOptimisticAssetDeleted(asset.uuid);

    expect(service.intangibleAssets()?.assets).toEqual([]);
    expect(service.physicalAssets()?.assets).toEqual([]);
  });

  it('should restore an optimistically deleted asset when requested', () => {
    const asset = createAssetFixture();

    service.upsertOptimisticAsset(asset);
    service.markOptimisticAssetDeleted(asset.uuid);
    service.restoreOptimisticDeletedAsset(asset.uuid);

    expect(service.intangibleAssets()?.assets).toEqual([asset]);
  });

  it('should derive the group net total from asset net values', () => {
    const asset = createAssetFixture({
      netValue: 92.5,
    });

    service.upsertOptimisticAsset(asset);

    expect(service.intangibleAssets()?.netTotal).toBe(92.5);
  });

  it('should classify cash equivalent assets as physical assets', () => {
    const asset = createAssetFixture({
      uuid: 'asset-cash',
      type: AssetType.CASH_EQUIVALENT,
      ticker: null,
      isCustom: true,
    });

    service.upsertOptimisticAsset(asset);

    expect(service.intangibleAssets()?.assets).toEqual([]);
    expect(service.physicalAssets()?.assets).toEqual([asset]);
  });
});
