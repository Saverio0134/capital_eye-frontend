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
import type { FieldTree } from '@angular/forms/signals';
import { FormField, FormRoot, form, max, min, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Asset, AssetType } from '../../../../models/asset.model';
import { AssetApi } from '../../../../services/api/asset-api/asset-api';
import { AssetStore } from '../../../../services/store/asset-store/asset-store';
import { FinancialAccountStore } from '../../../../services/store/financial-account-store/financial-account-store';
import {
  CURRENCY_OPTIONS,
  FINANCIAL_ASSET_TYPE_OPTIONS,
  METAL_TYPE_OPTIONS,
  PHYSICAL_ASSET_TYPE_OPTIONS,
  SelectOption,
} from '../../../../shared/config/select-options.config';
import {
  isFinancialAssetType,
  isPhysicalAssetType,
  isPreciousMetalAssetType,
  requiresManualCurrentPrice,
} from '../../../../utils/asset.utils';
import { SaveAssetFinancialForm } from './components/save-asset-financial-form/save-asset-financial-form';
import { SaveAssetPhysicalForm } from './components/save-asset-physical-form/save-asset-physical-form';
import {
  areCreateAssetFormValuesEqual,
  buildCreateAssetPayload,
  buildPhysicalFormConfig,
  buildSharedAssetPayload,
  hasValidAssetModeFields,
  normalizeCreateAssetFormValue,
} from './save-asset.helpers';
import {
  AssetCreateMode,
  AssetCreationFlow,
  CreateAssetFormValue,
  PreciousMetalQuantityMode,
  createAssetFormValueFromAsset,
  createDefaultCreateAssetForm,
} from './save-asset.types';

@Component({
  selector: 'app-save-asset',
  imports: [
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    FormField,
    FormRoot,
    SaveAssetFinancialForm,
    SaveAssetPhysicalForm,
  ],
  templateUrl: './save-asset.html',
})
export class SaveAsset {
  readonly visible = input(false);
  readonly mode = input<AssetCreateMode>('financial');
  readonly asset = input<Asset | null>(null);
  readonly visibleChange = output<boolean>();
  readonly assetSaved = output<void>();

  private readonly assetApi = inject(AssetApi);
  private readonly assetStore = inject(AssetStore);
  private readonly financialAccountStore = inject(FinancialAccountStore);
  private wasVisible = false;
  private previousMode: AssetCreateMode = 'financial';
  private previousAssetUuid: string | null = null;

  readonly isSavingAsset = signal(false);
  readonly creationFlow = signal<AssetCreationFlow>('linked');
  readonly createAssetFormModel = signal<CreateAssetFormValue>(
    createDefaultCreateAssetForm(this.mode()),
  );

  readonly createAssetForm = form(
    this.createAssetFormModel,
    (asset) => {
      required(asset.accountUuid, {
        message: 'Conto obbligatorio',
        when: () => !this.isEditMode() && this.isLinkedCreationFlow(),
      });
      required(asset.name, { message: 'Nome asset obbligatorio' });
      required(asset.type, { message: 'Tipo obbligatorio' });
      required(asset.baseCurrency, { message: 'Valuta obbligatoria' });
      min(asset.quantity, 0, { message: 'Quantita iniziale non valida' });
      min(asset.averageBuyPrice, 0, { message: 'PMC iniziale non valido' });
      required(asset.ticker, {
        message: 'Ticker obbligatorio per asset finanziari quotati',
        when: ({ valueOf }) => isFinancialAssetType(valueOf(asset.type)),
      });
      required(asset.metalType, {
        message: 'Metallo obbligatorio',
        when: ({ valueOf }) => isPreciousMetalAssetType(valueOf(asset.type)),
      });
      required(asset.currentPrice, {
        message: 'Prezzo corrente obbligatorio',
        when: ({ valueOf }) =>
          requiresManualCurrentPrice(valueOf(asset.type), valueOf(asset.isCustom)),
      });
      min(
        asset.currentPrice,
        () => (this.physicalFormConfig().showCurrentPriceField ? 0.000001 : 0),
        {
          message: 'Prezzo corrente non valido',
        },
      );
      required(asset.purity, {
        message: 'Purezza obbligatoria',
        when: ({ valueOf }) => isPreciousMetalAssetType(valueOf(asset.type)),
      });
      min(asset.purity, () => (this.physicalFormConfig().showMetalFields ? 0.000001 : 0), {
        message: 'Purezza non valida',
      });
      max(asset.purity, 1, { message: 'Purezza massima 1' });
      min(
        asset.weightGrams,
        () => (this.physicalFormConfig().showMetalWeightField ? 0.000001 : 0),
        {
          message: 'Peso non valido',
        },
      );
      min(asset.taxRate, 0, { message: 'Aliquota non valida' });
      max(asset.taxRate, 100, { message: 'Aliquota massima 100%' });
    },
    {
      submission: {
        action: async () => await this.createAsset(),
      },
    },
  );

  readonly currencyOptions = CURRENCY_OPTIONS;
  readonly metalTypeOptions = METAL_TYPE_OPTIONS;
  readonly isEditMode = computed(() => this.asset() !== null);
  readonly effectiveMode = computed<AssetCreateMode>(() => {
    const asset = this.asset();

    if (!asset) {
      return this.mode();
    }

    return isPhysicalAssetType(asset.type) ? 'physical' : 'financial';
  });
  readonly isPhysicalMode = computed(() => this.effectiveMode() === 'physical');
  readonly isLinkedCreationFlow = computed(
    () => !this.isEditMode() && this.creationFlow() === 'linked',
  );
  readonly isStandaloneCreationFlow = computed(
    () => !this.isEditMode() && this.creationFlow() === 'standalone',
  );
  readonly showCreationFlowSelector = computed(() => !this.isEditMode());
  readonly canCreateLinkedAsset = computed(() => this.accountOptions().length > 0);
  readonly showAccountSelector = computed(() => this.isLinkedCreationFlow());
  readonly showInitialPositionFields = computed(() => this.isLinkedCreationFlow());
  readonly createAssetTypeOptions = computed<SelectOption<AssetType>[]>(() =>
    this.isPhysicalMode() ? PHYSICAL_ASSET_TYPE_OPTIONS : FINANCIAL_ASSET_TYPE_OPTIONS,
  );
  readonly accountOptions = computed<Array<SelectOption<string>>>(() =>
    this.financialAccountStore.financialAccounts().map((account) => ({
      label: `${account.name} • ${account.type} • ${account.currency}`,
      value: account.uuid,
    })),
  );
  readonly formContext = computed(() => ({
    isEditMode: this.isEditMode(),
    isStandaloneCreationFlow: this.isStandaloneCreationFlow(),
    defaultAccountUuid: this.accountOptions()[0]?.value ?? '',
  }));
  readonly physicalFormConfig = computed(() =>
    buildPhysicalFormConfig(this.createAssetFormModel()),
  );
  readonly dialogTitle = computed(() =>
    this.isEditMode()
      ? this.isPhysicalMode()
        ? 'MODIFICA ASSET FISICO'
        : 'MODIFICA ASSET FINANZIARIO'
      : this.isPhysicalMode()
        ? 'NUOVO ASSET FISICO'
        : 'NUOVO ASSET FINANZIARIO',
  );
  readonly dialogSubtitle = computed(() => {
    if (this.isEditMode()) {
      return "Aggiorna i dati globali dell'asset. Le posizioni per conto si gestiscono a parte.";
    }

    if (this.isStandaloneCreationFlow()) {
      return "Crea prima l'anagrafica asset. Potrai collegare una posizione conto in un secondo momento.";
    }

    if (this.physicalFormConfig().showMetalFields) {
      return 'Metallo prezioso con prezzo automatico o manuale e quantita non ambigua.';
    }

    return this.isPhysicalMode()
      ? 'Asset manuale fisico o equivalente cash con valore corrente esplicito.'
      : 'Azioni, ETF o crypto con provider automatico tramite ticker.';
  });
  readonly saveButtonLabel = computed(() =>
    this.isEditMode()
      ? 'SALVA MODIFICHE'
      : this.isPhysicalMode()
        ? 'SALVA ASSET FISICO'
        : 'SALVA ASSET FINANZIARIO',
  );
  readonly canCreateAsset = computed(() => {
    return (
      this.createAssetForm().valid() &&
      hasValidAssetModeFields(this.createAssetFormModel(), this.formContext()) &&
      (this.isEditMode() || this.isStandaloneCreationFlow() || this.canCreateLinkedAsset()) &&
      !this.isSavingAsset()
    );
  });

  // Inizializza il dialog e mantiene coerenti i campi dipendenti.
  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const mode = this.mode();
      const assetUuid = this.asset()?.uuid ?? null;

      if (
        isVisible &&
        (!this.wasVisible || this.previousMode !== mode || this.previousAssetUuid !== assetUuid)
      ) {
        this.resetForm();
      }

      this.wasVisible = isVisible;
      this.previousMode = mode;
      this.previousAssetUuid = assetUuid;
    });
    effect(() => {
      const value = this.createAssetFormModel();
      const normalizedValue = normalizeCreateAssetFormValue(value, this.formContext());

      if (!areCreateAssetFormValuesEqual(value, normalizedValue)) {
        this.createAssetFormModel.set(normalizedValue);
      }
    });
  }

  // Controlla lo stato del campo.
  invalidCreateAssetField<T>(field: FieldTree<T>): boolean {
    return field().touched() && field().invalid();
  }

  // Chiude il dialog senza salvare.
  closeCreateDialog(): void {
    if (this.isSavingAsset()) {
      return;
    }

    this.visibleChange.emit(false);
  }

  // Salva o aggiorna l'asset usando direttamente la risposta backend come fonte di verita.
  async createAsset(event?: SubmitEvent): Promise<void> {
    event?.preventDefault();

    if (!this.canCreateAsset()) {
      return;
    }

    this.isSavingAsset.set(true);

    const createPayload = buildCreateAssetPayload(
      this.createAssetFormModel(),
      this.isStandaloneCreationFlow(),
    );
    const updatePayload = buildSharedAssetPayload(this.createAssetFormModel());
    const editedAsset = this.asset();

    try {
      const savedAsset = editedAsset
        ? await firstValueFrom(this.assetApi.updateAsset(editedAsset.uuid, updatePayload))
        : await firstValueFrom(this.assetApi.createAsset(createPayload));
      this.assetStore.upsertOptimisticAsset(savedAsset);
      this.assetSaved.emit();
      this.visibleChange.emit(false);
    } finally {
      this.isSavingAsset.set(false);
    }
  }

  // Cambia il flusso creazione senza toccare direttamente la logica di normalizzazione.
  setCreationFlow(flow: AssetCreationFlow): void {
    if (this.isEditMode() || (flow === 'linked' && !this.canCreateLinkedAsset())) {
      return;
    }

    this.creationFlow.set(flow);
  }

  // Cambia la modalita prezzo del metallo prezioso.
  setPreciousMetalPriceMode(isCustom: boolean): void {
    if (!this.physicalFormConfig().showMetalFields) {
      return;
    }

    this.createAssetFormModel.update((value) => ({
      ...value,
      isCustom,
      currentPrice: isCustom ? value.currentPrice : 0,
    }));
  }

  // Cambia la modalita quantita del metallo prezioso.
  setPreciousMetalQuantityMode(mode: PreciousMetalQuantityMode): void {
    if (!this.physicalFormConfig().showMetalFields) {
      return;
    }

    this.createAssetFormModel.update((value) => ({
      ...value,
      preciousMetalQuantityMode: mode,
      weightGrams: mode === 'byPiece' ? (value.weightGrams ?? 1) : null,
    }));
  }

  // Reimposta il form quando si apre il dialog o cambia il contesto.
  private resetForm(): void {
    const asset = this.asset();

    if (asset) {
      this.creationFlow.set('linked');
      this.createAssetFormModel.set(createAssetFormValueFromAsset(asset));
      return;
    }

    this.creationFlow.set(this.accountOptions().length > 0 ? 'linked' : 'standalone');
    this.createAssetFormModel.set({
      ...createDefaultCreateAssetForm(this.mode()),
      accountUuid: this.accountOptions()[0]?.value ?? '',
    });
  }
}
