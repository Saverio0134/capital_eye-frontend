import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AssetApi } from '../../services/api/asset-api/asset-api';
import { AssetStore } from '../../services/store/asset-store/asset-store';
import { FinancialAccountStore } from '../../services/store/financial-account-store/financial-account-store';
import {
  Asset,
  AssetType,
  Currency,
  MonthlyAssetVariation,
  MonthlyAssetVariationPoint,
} from '../../models/asset.model';

import Assets from './assets';

// Crea un asset completo già allineato al contratto API.
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
        accountUuid: 'account-uuid',
        accountName: 'Fineco',
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

// Crea un punto di variazione mensile compatibile con il grafico.
function createMonthlyVariationPoint(date: string, value: number): MonthlyAssetVariationPoint {
  return {
    date,
    value,
    changeValue: 0,
    changePercentage: 0,
  };
}

// Crea una serie mensile per un singolo asset.
function createMonthlyVariationFixture(
  assetUuid: string,
  monthlyVariations: MonthlyAssetVariationPoint[],
): MonthlyAssetVariation {
  return {
    assetUuid,
    name: `Asset ${assetUuid}`,
    ticker: null,
    type: AssetType.STOCK,
    monthlyVariations,
    dateLastSnapshot: monthlyVariations[monthlyVariations.length - 1]?.date ?? null,
  };
}

describe('Assets', () => {
  let component: Assets;
  let fixture: ComponentFixture<Assets>;
  let assetApi: jasmine.SpyObj<AssetApi>;
  let reloadAssetsSpy: jasmine.Spy;
  let reloadMonthlyVariationsSpy: jasmine.Spy;

  beforeEach(async () => {
    assetApi = jasmine.createSpyObj<AssetApi>('AssetApi', [
      'createAsset',
      'deleteAsset',
      'deleteAssetPosition',
    ]);
    reloadAssetsSpy = jasmine.createSpy('reloadAssets');
    reloadMonthlyVariationsSpy = jasmine.createSpy('reloadMonthlyVariations');
    const assetStoreMock = {
      assetsResource: () => ({ isLoading: () => false } as never),
      monthlyVariationsResource: () => ({ isLoading: () => false } as never),
      intangibleAssets: signal({
        assets: [],
        netTotal: 0,
        growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
        lastUpdate: new Date(),
      }),
      physicalAssets: signal({
        assets: [],
        netTotal: 0,
        growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
        lastUpdate: new Date(),
      }),
      monthlyVariations: signal([]),
      reloadAssets: reloadAssetsSpy,
      reloadMonthlyVariations: reloadMonthlyVariationsSpy,
    } as unknown as AssetStore;

    await TestBed.configureTestingModule({
      imports: [Assets],
      providers: [
        {
          provide: AssetStore,
          useValue: assetStoreMock,
        },
        {
          provide: AssetApi,
          useValue: assetApi,
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

    fixture = TestBed.createComponent(Assets);
    component = fixture.componentInstance;
    assetApi.createAsset.and.returnValue(of(createAssetFixture()));
    assetApi.deleteAsset.and.returnValue(of(void 0));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open edit dialog with selected asset', () => {
    const asset = createAssetFixture();

    component.openEditDialog(asset);

    expect(component.isCreateDialogOpen()).toBeTrue();
    expect(component.selectedAsset()).toBe(asset);
    expect(component.createAssetMode()).toBe('financial');
  });

  it('should open physical edit dialog for cash equivalent assets', () => {
    const asset = createAssetFixture({
      type: AssetType.CASH_EQUIVALENT,
      ticker: null,
      isCustom: true,
    });

    component.openEditDialog(asset);

    expect(component.createAssetMode()).toBe('physical');
  });

  it('should open details dialog with the selected asset', () => {
    const asset = createAssetFixture();

    component.openAssetDetailsDialog(asset);

    expect(component.isAssetDetailsDialogOpen()).toBeTrue();
    expect(component.selectedAssetForDetails()).toBe(asset);
  });

  it('should open accounts dialog with the selected asset', () => {
    const asset = createAssetFixture();

    component.openManageAccountsDialog(asset);

    expect(component.isManageAccountsDialogOpen()).toBeTrue();
    expect(component.selectedAssetForAccounts()).toBe(asset);
  });

  it('should switch from details to edit dialog for the same asset', () => {
    const asset = createAssetFixture();

    component.openAssetDetailsDialog(asset);
    component.onAssetEditRequested(asset);

    expect(component.isAssetDetailsDialogOpen()).toBeFalse();
    expect(component.selectedAssetForDetails()).toBeNull();
    expect(component.isCreateDialogOpen()).toBeTrue();
    expect(component.selectedAsset()).toBe(asset);
  });

  it('should keep the net value returned by the API for each asset row', () => {
    const assetStore = TestBed.inject(AssetStore) as unknown as {
      intangibleAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
      physicalAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
    };

    assetStore.intangibleAssets.set({
      assets: [
        createAssetFixture({
          totalValue: 100,
          netValue: 92.5,
        }),
      ],
      netTotal: 92.5,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });
    assetStore.physicalAssets.set({
      assets: [],
      netTotal: 0,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });

    fixture.detectChanges();

    expect(component.allAssets()[0]?.netValue).toBe(92.5);
  });

  it('should derive performance from the unrealized gain returned by the API', () => {
    const assetStore = TestBed.inject(AssetStore) as unknown as {
      intangibleAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
      physicalAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
    };

    assetStore.intangibleAssets.set({
      assets: [
        createAssetFixture({
          totalValue: 100,
          unrealizedGain: 25,
        }),
      ],
      netTotal: 93.5,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });
    assetStore.physicalAssets.set({
      assets: [],
      netTotal: 0,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });

    fixture.detectChanges();

    expect(component.allAssets()[0]?.performance).toBeCloseTo(33.33, 2);
  });

  it('should render the performance column with explicit sign', () => {
    const assetStore = TestBed.inject(AssetStore) as unknown as {
      intangibleAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
      physicalAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
    };

    assetStore.intangibleAssets.set({
      assets: [
        createAssetFixture({
          uuid: 'asset-positive',
          unrealizedGain: 25,
        }),
        createAssetFixture({
          uuid: 'asset-negative',
          name: 'Bond',
          unrealizedGain: -15,
          totalValue: 100,
        }),
      ],
      netTotal: 185,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });
    assetStore.physicalAssets.set({
      assets: [],
      netTotal: 0,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });

    fixture.detectChanges();

    const tableText = fixture.nativeElement.textContent as string;

    expect(tableText).toContain('Performance');
    expect(tableText).toMatch(/\+\s*33,33%|\+\s*33.33%/);
    expect(tableText).toMatch(/-\s*13,04%|-\s*13.04%/);
  });

  it('should not reload assets after saving an asset', () => {
    component.onAssetSaved();

    expect(reloadAssetsSpy).not.toHaveBeenCalled();
    expect(reloadMonthlyVariationsSpy).toHaveBeenCalledTimes(1);
  });

  it('should not reload assets after changing linked accounts', () => {
    component.onAssetAccountsChanged();

    expect(reloadAssetsSpy).not.toHaveBeenCalled();
    expect(reloadMonthlyVariationsSpy).toHaveBeenCalledTimes(1);
  });

  it('should only reload monthly variations after deleting an asset from details', () => {
    component.onAssetDeleted();

    expect(reloadAssetsSpy).not.toHaveBeenCalled();
    expect(reloadMonthlyVariationsSpy).toHaveBeenCalledTimes(1);
  });

  it('should aggregate only the months returned by the backend for the trend', () => {
    const january = '2026-01-15T12:00:00.000Z';
    const march = '2026-03-15T12:00:00.000Z';
    const assetStore = TestBed.inject(AssetStore) as unknown as {
      monthlyVariations: ReturnType<typeof signal<MonthlyAssetVariation[]>>;
      intangibleAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
      physicalAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
    };
    const stockAsset = createAssetFixture({
      uuid: 'asset-stock',
      totalValue: 300,
      taxRate: 0,
    });

    assetStore.intangibleAssets.set({
      assets: [stockAsset],
      netTotal: 300,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });
    assetStore.physicalAssets.set({
      assets: [],
      netTotal: 0,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });
    assetStore.monthlyVariations.set([
      createMonthlyVariationFixture('asset-stock', [
        createMonthlyVariationPoint(january, 150),
        createMonthlyVariationPoint(march, 300),
      ]),
    ]);

    fixture.detectChanges();

    expect(component.filteredAssetsMonthlyNetWorth()).toEqual([
      {
        date: new Date(2026, 0, 1),
        value: 150,
      },
      {
        date: new Date(2026, 2, 1),
        value: 300,
      },
    ]);
  });

  it('should compute growth from the last two aggregated monthly totals', () => {
    const april = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 30)
      .toISOString()
      .slice(0, 10);
    const may = new Date(new Date().getFullYear(), new Date().getMonth(), 15)
      .toISOString()
      .slice(0, 10);
    const assetStore = TestBed.inject(AssetStore) as unknown as {
      monthlyVariations: ReturnType<typeof signal<MonthlyAssetVariation[]>>;
      intangibleAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
      physicalAssets: ReturnType<
        typeof signal<{
          assets: Asset[];
          netTotal: number;
          growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
          lastUpdate: Date;
        }>
      >;
    };
    const stockAsset = createAssetFixture({
      uuid: 'asset-stock',
      totalValue: 200,
      taxRate: 0,
    });
    const cashAsset = createAssetFixture({
      uuid: 'asset-cash',
      name: 'Cash',
      type: AssetType.CASH_EQUIVALENT,
      ticker: null,
      isCustom: true,
      totalValue: 130,
      taxRate: 0,
    });

    assetStore.intangibleAssets.set({
      assets: [stockAsset],
      netTotal: 200,
      growth: { oneMonth: 99, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });
    assetStore.physicalAssets.set({
      assets: [cashAsset],
      netTotal: 130,
      growth: { oneMonth: -99, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });
    assetStore.monthlyVariations.set([
      createMonthlyVariationFixture('asset-stock', [
        createMonthlyVariationPoint(april, 200),
        createMonthlyVariationPoint(may, 200),
      ]),
      createMonthlyVariationFixture('asset-cash', [
        createMonthlyVariationPoint(april, 100),
        createMonthlyVariationPoint(may, 130),
      ]),
    ]);

    fixture.detectChanges();

    expect(component.growthAssets()).toBeCloseTo(10, 5);
  });
});
