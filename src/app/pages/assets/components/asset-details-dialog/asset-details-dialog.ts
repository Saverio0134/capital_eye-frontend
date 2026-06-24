import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { firstValueFrom } from 'rxjs';
import { Asset, AssetType } from '../../../../models/asset.model';
import { AssetApi } from '../../../../services/api/asset-api/asset-api';
import { AssetStore } from '../../../../services/store/asset-store/asset-store';
import { ASSET_TYPE_LABELS } from '../../../../shared/config/select-options.config';
import { AssetDetailCard, buildAssetDetailCards } from './asset-details-dialog.helpers';

@Component({
  selector: 'app-asset-details-dialog',
  imports: [ButtonModule, CurrencyPipe, DatePipe, DecimalPipe, DialogModule],
  templateUrl: './asset-details-dialog.html',
})
export class AssetDetailsDialog {
  readonly visible = input(false);
  readonly asset = input<Asset | null>(null);
  readonly visibleChange = output<boolean>();
  readonly editRequested = output<Asset>();
  readonly assetDeleted = output<void>();

  private readonly assetApi = inject(AssetApi);
  private readonly assetStore = inject(AssetStore);

  readonly isDeletingAsset = signal(false);
  readonly currentAsset = computed(() => {
    const selectedAsset = this.asset();

    if (!selectedAsset) {
      return null;
    }

    const storeAssets = [
      ...(this.assetStore.intangibleAssets()?.assets ?? []),
      ...(this.assetStore.physicalAssets()?.assets ?? []),
    ];

    return storeAssets.find((asset) => asset.uuid === selectedAsset.uuid) ?? selectedAsset;
  });
  readonly canDeleteAsset = computed(() => {
    const asset = this.currentAsset();

    if (!asset) {
      return false;
    }

    return asset.quantity <= 1e-8 && !this.isDeletingAsset();
  });
  readonly detailCards = computed<AssetDetailCard[]>(() => {
    const asset = this.currentAsset();

    if (!asset) {
      return [];
    }

    return buildAssetDetailCards(asset, this.getAssetPerformance(asset));
  });

  // Chiude il dialog dettagli quando non ci sono operazioni distruttive in corso.
  closeDialog(): void {
    if (this.isDeletingAsset()) {
      return;
    }

    this.visibleChange.emit(false);
  }

  // Propaga alla pagina la richiesta di apertura del dialog modifica.
  openEditAsset(): void {
    const asset = this.currentAsset();

    if (!asset || this.isDeletingAsset()) {
      return;
    }

    this.editRequested.emit(asset);
  }

  // Elimina l'asset con update ottimistico e chiude il dialog a operazione conclusa.
  async deleteCurrentAsset(): Promise<void> {
    const asset = this.currentAsset();

    if (!asset || !this.canDeleteAsset()) {
      return;
    }

    this.isDeletingAsset.set(true);
    this.assetStore.markOptimisticAssetDeleted(asset.uuid);

    try {
      await firstValueFrom(this.assetApi.deleteAsset(asset.uuid));
      this.assetDeleted.emit();
      this.visibleChange.emit(false);
    } catch {
      this.assetStore.restoreOptimisticDeletedAsset(asset.uuid);
    } finally {
      this.isDeletingAsset.set(false);
    }
  }

  // Restituisce la label leggibile del tipo asset.
  getAssetTypeLabel(type: AssetType): string {
    return ASSET_TYPE_LABELS[type] ?? type;
  }

  // Calcola la performance percentuale partendo dal guadagno non realizzato.
  getAssetPerformance(asset: Asset): number {
    const costBasis = asset.totalValue - asset.unrealizedGain;

    if (costBasis <= 0) {
      return 0;
    }

    return (asset.unrealizedGain / costBasis) * 100;
  }
}
