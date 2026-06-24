import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { Asset, AssetType, Currency } from '../../../../models/asset.model';
import { AssetApi } from '../../../../services/api/asset-api/asset-api';
import { AssetStore } from '../../../../services/store/asset-store/asset-store';
import { AssetDetailsDialog } from './asset-details-dialog';

// Crea un asset completo compatibile con il dialog dettagli.
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

// Costruisce il riepilogo asset esposto dallo store con la lista indicata.
function createAssetSummary(assets: Asset[]) {
  return {
    assets,
    netTotal: assets.reduce((total, asset) => total + asset.netValue, 0),
    growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
    lastUpdate: new Date(),
  };
}

describe('AssetDetailsDialog', () => {
  let component: AssetDetailsDialog;
  let fixture: ComponentFixture<AssetDetailsDialog>;
  let assetApi: jasmine.SpyObj<AssetApi>;
  let markOptimisticAssetDeletedSpy: jasmine.Spy;
  let restoreOptimisticDeletedAssetSpy: jasmine.Spy;
  let intangibleAssets: WritableSignal<ReturnType<typeof createAssetSummary>>;

  beforeEach(async () => {
    assetApi = jasmine.createSpyObj<AssetApi>('AssetApi', ['deleteAsset']);
    markOptimisticAssetDeletedSpy = jasmine.createSpy('markOptimisticAssetDeleted');
    restoreOptimisticDeletedAssetSpy = jasmine.createSpy('restoreOptimisticDeletedAsset');
    intangibleAssets = signal(createAssetSummary([createAssetFixture()]));

    await TestBed.configureTestingModule({
      imports: [AssetDetailsDialog],
      providers: [
        {
          provide: AssetApi,
          useValue: assetApi,
        },
        {
          provide: AssetStore,
          useValue: {
            markOptimisticAssetDeleted: markOptimisticAssetDeletedSpy,
            restoreOptimisticDeletedAsset: restoreOptimisticDeletedAssetSpy,
            intangibleAssets,
            physicalAssets: signal(createAssetSummary([])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetDetailsDialog);
    component = fixture.componentInstance;
    assetApi.deleteAsset.and.returnValue(of(void 0));
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('asset', createAssetFixture());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the selected asset when requesting edit from details', () => {
    const editSpy = jasmine.createSpy('edit');

    component.editRequested.subscribe(editSpy);

    component.openEditAsset();

    expect(editSpy).toHaveBeenCalledOnceWith(jasmine.objectContaining({ uuid: 'asset-1' }));
  });

  it('should delete the asset from the details dialog with optimistic update', async () => {
    const deletedSpy = jasmine.createSpy('deleted');
    const visibleChangeSpy = jasmine.createSpy('visibleChange');

    component.assetDeleted.subscribe(deletedSpy);
    component.visibleChange.subscribe(visibleChangeSpy);
    // currentAsset() preferisce la versione dello store: la quantity va azzerata lì.
    intangibleAssets.set(createAssetSummary([createAssetFixture({ quantity: 0 })]));
    fixture.componentRef.setInput(
      'asset',
      createAssetFixture({
        quantity: 0,
      }),
    );
    fixture.detectChanges();

    await component.deleteCurrentAsset();

    expect(markOptimisticAssetDeletedSpy).toHaveBeenCalledOnceWith('asset-1');
    expect(assetApi.deleteAsset).toHaveBeenCalledOnceWith('asset-1');
    expect(deletedSpy).toHaveBeenCalled();
    expect(visibleChangeSpy).toHaveBeenCalledOnceWith(false);
  });

  it('should restore the optimistic delete when deleting the asset fails', async () => {
    assetApi.deleteAsset.and.returnValue(
      new Observable<void>((subscriber) => {
        subscriber.error(new Error('delete failed'));
      }),
    );
    // currentAsset() preferisce la versione dello store: la quantity va azzerata lì.
    intangibleAssets.set(createAssetSummary([createAssetFixture({ quantity: 0 })]));
    fixture.componentRef.setInput(
      'asset',
      createAssetFixture({
        quantity: 0,
      }),
    );
    fixture.detectChanges();

    await component.deleteCurrentAsset();

    expect(markOptimisticAssetDeletedSpy).toHaveBeenCalledOnceWith('asset-1');
    expect(restoreOptimisticDeletedAssetSpy).toHaveBeenCalledOnceWith('asset-1');
  });
});
