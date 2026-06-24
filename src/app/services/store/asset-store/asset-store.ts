import { httpResource } from '@angular/common/http';
import { computed, effect, inject, Injectable } from '@angular/core';
import {
  AllAssetsWithNet,
  AssetGroup,
  Asset,
  MonthlyAssetVariation,
} from '../../../models/asset.model';
import { AssetApi } from '../../api/asset-api/asset-api';
import {
  normalizeAllAssetsWithNet,
  normalizeMonthlyAssetVariations,
} from '../../api/asset-api/asset-api.utils';
import { AuthStore } from '../auth-store/auth-store';
import { createOptimisticCollectionState } from '../../../utils/optimistic-collection.utils';
import { isPhysicalAssetType } from '../../../utils/asset.utils';
import { readResourceValueOr } from '../../../utils/resource.utils';

const EMPTY_ASSET_GROUPS: AllAssetsWithNet = {
  intangibleAssets: {
    assets: [],
    netTotal: 0,
    growth: {
      oneMonth: 0,
      threeMonths: 0,
      sixMonths: 0,
      year: 0,
    },
    lastUpdate: undefined,
  },
  physicalAssets: {
    assets: [],
    netTotal: 0,
    growth: {
      oneMonth: 0,
      threeMonths: 0,
      sixMonths: 0,
      year: 0,
    },
    lastUpdate: undefined,
  },
};

@Injectable({
  providedIn: 'root',
})
export class AssetStore {
  private api = inject(AssetApi);
  private authStore = inject(AuthStore);
  private readonly monthlyVariationsLimit = 12;
  private readonly optimisticAssets = createOptimisticCollectionState<Asset, string>(
    (asset) => asset.uuid,
  );
  private wasLoadingAssets = false;
  private httpAssetsResource = httpResource<AllAssetsWithNet>(
    () => {
      const token = this.authStore.authToken();
      if (!token) return undefined;
      return this.api.base;
    },
    {
      defaultValue: EMPTY_ASSET_GROUPS,
      parse: (resp) => normalizeAllAssetsWithNet(resp as AllAssetsWithNet),
    },
  );
  private readonly httpMonthlyVariationsResource = httpResource<MonthlyAssetVariation[]>(
    () => {
      const token = this.authStore.authToken();
      if (!token) return undefined;
      return this.api.getMonthlyVariations(this.monthlyVariationsLimit);
    },
    {
      defaultValue: [],
      parse: (resp) => normalizeMonthlyAssetVariations(resp as MonthlyAssetVariation[]),
    },
  );

  readonly assetsResource = computed(() => this.httpAssetsResource.asReadonly());
  readonly monthlyVariationsResource = computed(() =>
    this.httpMonthlyVariationsResource.asReadonly(),
  );

  private readonly mergedAssets = computed<AllAssetsWithNet>(() => {
    const baseAssets = readResourceValueOr(this.assetsResource(), EMPTY_ASSET_GROUPS);
    const allAssets = this.optimisticAssets.applyTo([
      ...(baseAssets.intangibleAssets.assets ?? []),
      ...(baseAssets.physicalAssets.assets ?? []),
    ]);
    const intangibleAssets = allAssets.filter((asset) => !isPhysicalAssetType(asset.type));
    const physicalAssets = allAssets.filter((asset) => isPhysicalAssetType(asset.type));

    return {
      intangibleAssets: {
        ...baseAssets.intangibleAssets,
        assets: intangibleAssets,
        netTotal: this.calculateNetTotal(intangibleAssets),
        lastUpdate: this.resolveLastUpdate(
          baseAssets.intangibleAssets.lastUpdate,
          intangibleAssets,
        ),
      },
      physicalAssets: {
        ...baseAssets.physicalAssets,
        assets: physicalAssets,
        netTotal: this.calculateNetTotal(physicalAssets),
        lastUpdate: this.resolveLastUpdate(baseAssets.physicalAssets.lastUpdate, physicalAssets),
      },
    };
  });

  readonly intangibleAssets = computed<AssetGroup | undefined>(() => {
    return this.mergedAssets().intangibleAssets;
  });
  readonly physicalAssets = computed<AssetGroup | undefined>(() => {
    return this.mergedAssets().physicalAssets;
  });
  readonly monthlyVariations = computed(() =>
    readResourceValueOr(this.monthlyVariationsResource(), []),
  );

  constructor() {
    effect(() => {
      const isLoading = this.assetsResource().isLoading();

      if (this.wasLoadingAssets && !isLoading) {
        const resolvedAssets = readResourceValueOr(this.assetsResource(), EMPTY_ASSET_GROUPS);
        const resolvedAssetIds = new Set(
          [
            ...(resolvedAssets.intangibleAssets.assets ?? []),
            ...(resolvedAssets.physicalAssets.assets ?? []),
          ].map((asset) => asset.uuid),
        );
        this.optimisticAssets.reconcileWithResolvedIds(resolvedAssetIds);
      }

      this.wasLoadingAssets = isLoading;
    });
  }

  upsertOptimisticAsset(asset: Asset): void {
    this.optimisticAssets.upsert(asset);
  }

  replaceOptimisticAsset(tempUuid: string, asset: Asset): void {
    this.optimisticAssets.replace(tempUuid, asset);
  }

  removeOptimisticAsset(uuid: string): void {
    this.optimisticAssets.remove(uuid);
  }

  markOptimisticAssetDeleted(uuid: string): void {
    this.optimisticAssets.markDeleted(uuid);
  }

  restoreOptimisticDeletedAsset(uuid: string): void {
    this.optimisticAssets.restoreDeleted(uuid);
  }

  reloadAssets(): void {
    this.httpAssetsResource.reload();
    this.httpMonthlyVariationsResource.reload();
  }

  reloadMonthlyVariations(): void {
    this.httpMonthlyVariationsResource.reload();
  }

  // Deriva il totale netto del gruppo sommando i netti già calcolati dal backend.
  private calculateNetTotal(assets: Asset[]): number {
    return assets.reduce((total, asset) => total + asset.netValue, 0);
  }

  // Propaga la data di aggiornamento più recente tra gruppo e asset inclusi.
  private resolveLastUpdate(lastUpdate: Date | undefined, assets: Asset[]): Date | undefined {
    const dates = [
      ...assets.map((asset) => asset.updatedAt).filter((date): date is Date => Boolean(date)),
      ...(lastUpdate ? [lastUpdate] : []),
    ];

    if (dates.length === 0) {
      return lastUpdate;
    }

    return new Date(Math.max(...dates.map((date) => new Date(date).getTime())));
  }
}
