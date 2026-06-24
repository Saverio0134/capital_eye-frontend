import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import type { FieldTree } from '@angular/forms/signals';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Asset, AssetPosition } from '../../../../models/asset.model';
import { AssetApi } from '../../../../services/api/asset-api/asset-api';
import { AssetStore } from '../../../../services/store/asset-store/asset-store';
import { FinancialAccountStore } from '../../../../services/store/financial-account-store/financial-account-store';
import {
  ACCOUNT_TYPE_OPTIONS,
  SelectOption,
} from '../../../../shared/config/select-options.config';

interface LinkAssetAccountFormValue {
  accountUuid: string;
}

// Valore iniziale del form.
function createDefaultFormValue(): LinkAssetAccountFormValue {
  return {
    accountUuid: '',
  };
}

@Component({
  selector: 'app-asset-accounts-dialog',
  imports: [
    ButtonModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    DialogModule,
    SelectModule,
    TableModule,
    FormField,
    FormRoot,
  ],
  templateUrl: './link-asset-account.html',
})
export class AssetAccountsDialog {
  readonly visible = input(false);
  readonly asset = input<Asset | null>(null);
  readonly visibleChange = output<boolean>();
  readonly assetAccountsChanged = output<void>();

  private readonly assetApi = inject(AssetApi);
  private readonly assetStore = inject(AssetStore);
  private readonly financialAccountStore = inject(FinancialAccountStore);

  private wasVisible = false;
  private previousAssetUuid: string | null = null;

  readonly isLinkingAsset = signal(false);
  readonly removingAccountUuid = signal<string | null>(null);
  readonly formModel = signal<LinkAssetAccountFormValue>(createDefaultFormValue());
  readonly accountTypeLabels = new Map(
    ACCOUNT_TYPE_OPTIONS.map((option) => [option.value, option.label] as const),
  );
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

  readonly linkForm = form(
    this.formModel,
    (value) => {
      required(value.accountUuid, { message: 'Conto obbligatorio' });
    },
    {
      submission: {
        action: async () => await this.linkAssetToAccount(),
      },
    },
  );

  readonly accountOptions = computed<Array<SelectOption<string>>>(() => {
    const linkedAccountUuids = new Set(
      this.currentAsset()?.positions.map((position) => position.accountUuid) ?? [],
    );

    return this.financialAccountStore
      .financialAccounts()
      .filter((account) => !linkedAccountUuids.has(account.uuid))
      .map((account) => ({
        label: `${account.name} • ${account.type} • ${account.currency}`,
        value: account.uuid,
      }));
  });

  readonly canLinkAsset = computed(() => {
    return this.linkForm().valid() && this.accountOptions().length > 0 && !this.isLinkingAsset();
  });

  readonly sortedPositions = computed(() => {
    return [...(this.currentAsset()?.positions ?? [])].sort((left, right) =>
      left.accountName.localeCompare(right.accountName, 'it'),
    );
  });

  // Inizializza il dialog conti.
  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const assetUuid = this.asset()?.uuid ?? null;

      if (isVisible && (!this.wasVisible || this.previousAssetUuid !== assetUuid)) {
        this.resetForm();
      }

      this.wasVisible = isVisible;
      this.previousAssetUuid = assetUuid;
    });
  }

  // Controlla lo stato del campo.
  invalidLinkField<T>(field: FieldTree<T>): boolean {
    return field().touched() && field().invalid();
  }

  // Chiude il dialog conti evitando interruzioni durante il linking.
  closeDialog(): void {
    if (this.isLinkingAsset()) {
      return;
    }

    this.visibleChange.emit(false);
  }

  // Collega un conto all'asset.
  async linkAssetToAccount(event?: SubmitEvent): Promise<void> {
    event?.preventDefault();

    const asset = this.currentAsset();
    if (!asset || !this.canLinkAsset()) {
      return;
    }

    this.isLinkingAsset.set(true);

    const payload = {
      assetUuid: asset.uuid,
      accountUuid: this.formModel().accountUuid,
    };

    const optimisticAsset = this.buildOptimisticAsset(asset, payload.accountUuid);

    try {
      this.assetStore.upsertOptimisticAsset(optimisticAsset);
      const savedAsset = await firstValueFrom(this.assetApi.createAsset(payload));
      this.assetStore.replaceOptimisticAsset(asset.uuid, savedAsset);
      this.resetForm();
      this.assetAccountsChanged.emit();
    } catch {
      this.assetStore.upsertOptimisticAsset(asset);
    } finally {
      this.isLinkingAsset.set(false);
    }
  }

  // Rimuove una posizione vuota.
  async removeAccount(position: AssetPosition): Promise<void> {
    const asset = this.currentAsset();

    if (!asset) {
      return;
    }

    if (position.quantity !== 0) {
      return;
    }

    this.removingAccountUuid.set(position.uuid);

    const optimisticAsset = {
      ...asset,
      positions: asset.positions.filter((item) => item.uuid !== position.uuid),
      updatedAt: new Date(),
    };

    try {
      this.assetStore.upsertOptimisticAsset(optimisticAsset);
      await firstValueFrom(this.assetApi.deleteAssetPosition(asset.uuid, position.uuid));
      this.resetForm();
      this.assetAccountsChanged.emit();
    } catch {
      this.assetStore.upsertOptimisticAsset(asset);
    } finally {
      this.removingAccountUuid.set(null);
    }
  }

  // Restituisce la label conto.
  getAccountTypeLabel(type: AssetPosition['accountType']): string {
    return this.accountTypeLabels.get(type) ?? type;
  }

  // Reimposta il form link.
  private resetForm(): void {
    this.formModel.set({
      accountUuid: this.accountOptions()[0]?.value ?? '',
    });
  }

  // Crea la posizione ottimistica.
  private buildOptimisticAsset(asset: Asset, accountUuid: string): Asset {
    const account = this.financialAccountStore
      .financialAccounts()
      .find((item) => item.uuid === accountUuid);

    if (!account) {
      return asset;
    }

    const optimisticPosition: AssetPosition = {
      uuid: `optimistic-position-${Date.now()}`,
      accountUuid: account.uuid,
      accountName: account.name,
      accountType: account.type,
      currency: account.currency,
      quantity: 0,
      currentPrice: asset.currentPrice,
      totalValue: 0,
      averageBuyPrice: 0,
      lastMarketUpdate: null,
    };

    return {
      ...asset,
      positions: [...asset.positions, optimisticPosition],
      netValue: asset.netValue,
      unrealizedGain: asset.unrealizedGain,
      updatedAt: new Date(),
    };
  }
}
