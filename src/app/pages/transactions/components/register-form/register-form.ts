import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { form, min, required, validate } from '@angular/forms/signals';
import { Asset, Currency } from '../../../../models/asset.model';
import { FinancialAccount } from '../../../../models/financial-account.model';
import {
  CreateLiquiditySnapshotPayload,
  CreateTransactionPayload,
  TransactionType,
} from '../../../../models/transaction.model';
import { SelectOption } from '../../../../shared/config/select-options.config';
import { invalidField } from '../../../../utils/form-field.utils';
import {
  AssetRegisterFormValue,
  LiquidityRegisterFormValue,
  RegisterTab,
} from '../../transactions.types';
import { RegisterAssetForm } from './components/register-asset-form/register-asset-form';
import { RegisterLiquidityForm } from './components/register-liquidity-form/register-liquidity-form';

function dateToApiString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T12:00:00.000Z`;
}

function daysFromToday(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

const DEFAULT_LIQUIDITY_FORM = (): LiquidityRegisterFormValue => ({
  accountUuid: '',
  date: new Date(),
  amount: 0,
});

const DEFAULT_ASSET_FORM = (): AssetRegisterFormValue => ({
  assetUuid: '',
  accountUuid: '',
  type: 'BUY',
  date: new Date(),
  quantity: null,
  totalAmount: 0,
});

@Component({
  selector: 'app-register-form',
  imports: [RegisterAssetForm, RegisterLiquidityForm],
  templateUrl: './register-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterForm {
  readonly activeTab = input.required<RegisterTab>();
  readonly accounts = input.required<FinancialAccount[]>();
  readonly assets = input.required<Asset[]>();
  readonly isSavingLiquidity = input(false);
  readonly isSavingTransaction = input(false);
  readonly liquidityResetToken = input(0);
  readonly assetResetToken = input(0);

  readonly activeTabChange = output<RegisterTab>();
  readonly saveLiquidity = output<CreateLiquiditySnapshotPayload>();
  readonly saveAssetTransaction = output<CreateTransactionPayload>();

  readonly invalidRegisterField = invalidField;

  private readonly lastLoadedFingerprint = signal('');
  private previousLiquidityResetToken = this.liquidityResetToken();
  private previousAssetResetToken = this.assetResetToken();

  readonly liquidityFormModel = signal<LiquidityRegisterFormValue>(DEFAULT_LIQUIDITY_FORM());
  readonly assetFormModel = signal<AssetRegisterFormValue>(DEFAULT_ASSET_FORM());

  readonly liquidityForm = form(
    this.liquidityFormModel,
    (snapshot) => {
      required(snapshot.accountUuid, { message: 'Financial account obbligatorio' });
      required(snapshot.date, { message: 'Data obbligatoria' });
      required(snapshot.amount, { message: 'Importo obbligatorio' });
      min(snapshot.amount, 0, { message: 'Importo non valido' });
    },
    {
      submission: {
        action: async () => this.submitLiquidity(),
      },
    },
  );

  readonly assetForm = form(
    this.assetFormModel,
    (transaction) => {
      required(transaction.assetUuid, { message: 'Asset obbligatorio' });
      required(transaction.accountUuid, { message: 'Conto di appoggio obbligatorio' });
      required(transaction.type, { message: 'Tipo operazione obbligatorio' });
      required(transaction.date, { message: 'Data obbligatoria' });
      validate(transaction.date, ({ value }) => {
        const date = value();
        if (!date) return null;
        if (date < this.minDate) {
          return {
            kind: 'dateMin',
            message: 'Non puoi registrare transazioni più vecchie di 30 giorni',
          };
        }
        if (date > this.maxDate) {
          return { kind: 'dateMax', message: 'La data non può essere nel futuro' };
        }
        return null;
      });
      required(transaction.quantity, { message: 'Quantità obbligatoria' });
      required(transaction.totalAmount, { message: 'Totale operazione obbligatorio' });
      min(transaction.quantity, 0.000001, { message: 'Quantità maggiore di zero' });
      min(transaction.totalAmount, 0.000001, { message: 'Totale maggiore di zero' });
    },
    {
      submission: {
        action: async () => this.submitAssetTransaction(),
      },
    },
  );

  readonly accountOptions = computed<Array<SelectOption<string>>>(() =>
    this.accounts().map((account) => ({
      label: account.name,
      value: account.uuid,
    })),
  );

  readonly assetOptions = computed<Array<SelectOption<string>>>(() =>
    this.assets()
      .filter((asset) => !asset.isCustom)
      .map((asset) => ({
        label: asset.name,
        value: asset.uuid,
      })),
  );

  readonly minDate: Date = daysFromToday(-30);
  readonly maxDate: Date = new Date();

  readonly selectedAsset = computed(() => {
    return this.assets().find((asset) => asset.uuid === this.assetFormModel().assetUuid) ?? null;
  });

  readonly assetAccountOptions = computed<Array<SelectOption<string>>>(() => {
    return this.buildAssetAccountOptions(this.selectedAsset());
  });

  readonly accountMap = computed(
    () => new Map(this.accounts().map((account) => [account.uuid, account])),
  );

  readonly selectedLiquidityCurrency = computed(() => {
    return this.accountMap().get(this.liquidityFormModel().accountUuid)?.currency ?? Currency.EUR;
  });

  readonly selectedAssetCurrency = computed(() => {
    const selectedPosition = this.selectedAsset()?.positions.find(
      (position) => position.accountUuid === this.assetFormModel().accountUuid,
    );
    const selectedAccountCurrency = this.accountMap().get(
      this.assetFormModel().accountUuid,
    )?.currency;
    const selectedAssetCurrency = this.selectedAsset()?.valuationCurrency;

    return (
      selectedPosition?.currency ?? selectedAccountCurrency ?? selectedAssetCurrency ?? Currency.EUR
    );
  });

  readonly canSaveLiquidity = computed(() => {
    return this.liquidityForm().valid() && !this.isSavingLiquidity();
  });

  readonly canSaveAssetTransaction = computed(() => {
    return this.assetForm().valid() && !this.isSavingTransaction();
  });

  constructor() {
    effect(() => {
      const fingerprint = JSON.stringify({
        accounts: this.accountOptions().map((option) => option.value),
        assets: this.assetOptions().map((option) => option.value),
        assetAccounts: this.assetAccountOptions().map((option) => option.value),
      });

      if (fingerprint === this.lastLoadedFingerprint()) {
        return;
      }

      this.lastLoadedFingerprint.set(fingerprint);
      this.ensureDefaultSelections();
    });

    effect(() => {
      const token = this.liquidityResetToken();

      if (token !== this.previousLiquidityResetToken) {
        this.resetLiquidityForm();
      }

      this.previousLiquidityResetToken = token;
    });

    effect(() => {
      const token = this.assetResetToken();

      if (token !== this.previousAssetResetToken) {
        this.resetAssetForm();
      }

      this.previousAssetResetToken = token;
    });
  }

  setActiveTab(tab: RegisterTab): void {
    this.activeTabChange.emit(tab);
  }

  setTransactionType(type: TransactionType): void {
    this.assetFormModel.update((value) => ({
      ...value,
      type,
    }));
  }

  private submitLiquidity(): void {
    if (!this.canSaveLiquidity()) {
      return;
    }

    const value = this.liquidityFormModel();

    this.saveLiquidity.emit({
      accountUuid: value.accountUuid,
      date: dateToApiString(value.date ?? new Date()),
      amount: value.amount ?? 0,
    });
  }

  private submitAssetTransaction(): void {
    if (!this.canSaveAssetTransaction()) {
      return;
    }

    const value = this.assetFormModel();

    this.saveAssetTransaction.emit({
      assetUuid: value.assetUuid,
      accountUuid: value.accountUuid,
      type: value.type,
      date: dateToApiString(value.date ?? new Date()),
      quantity: value.quantity ?? 0,
      totalAmount: value.totalAmount ?? 0,
    });
  }

  private ensureDefaultSelections(): void {
    const defaultAccountUuid = this.accountOptions()[0]?.value ?? '';
    const defaultAssetUuid = this.assetOptions()[0]?.value ?? '';
    const availableAccountUuids = new Set(this.accountOptions().map((option) => option.value));
    const availableAssetUuids = new Set(this.assetOptions().map((option) => option.value));

    this.liquidityFormModel.update((value) => ({
      ...value,
      accountUuid: availableAccountUuids.has(value.accountUuid)
        ? value.accountUuid
        : defaultAccountUuid,
    }));

    this.assetFormModel.update((value) => ({
      ...value,
      assetUuid: this.resolveValidAssetUuid(value.assetUuid, availableAssetUuids, defaultAssetUuid),
      accountUuid: this.resolveValidAssetAccountUuid(
        value.accountUuid,
        this.resolveValidAssetUuid(value.assetUuid, availableAssetUuids, defaultAssetUuid),
        availableAccountUuids,
        defaultAccountUuid,
      ),
    }));
  }

  private resetLiquidityForm(): void {
    this.liquidityForm().reset({
      ...DEFAULT_LIQUIDITY_FORM(),
      accountUuid: this.accountOptions()[0]?.value ?? '',
    });
  }

  private resetAssetForm(): void {
    const defaultAssetUuid = this.assetOptions()[0]?.value ?? '';

    this.assetForm().reset({
      ...DEFAULT_ASSET_FORM(),
      assetUuid: defaultAssetUuid,
      accountUuid: this.resolveDefaultAssetAccountUuid(defaultAssetUuid) ?? '',
    });
  }

  private buildAssetAccountOptions(asset: Asset | null): Array<SelectOption<string>> {
    if (!asset) {
      return [];
    }

    return (asset.positions ?? []).map((position) => ({
      label: `${position.accountName} • ${position.accountType} • ${position.currency}`,
      value: position.accountUuid,
    }));
  }

  private resolveValidAssetUuid(
    currentAssetUuid: string,
    availableAssetUuids: Set<string>,
    defaultAssetUuid: string,
  ): string {
    return availableAssetUuids.has(currentAssetUuid) ? currentAssetUuid : defaultAssetUuid;
  }

  private resolveValidAssetAccountUuid(
    currentAccountUuid: string,
    assetUuid: string,
    availableAccountUuids: Set<string>,
    defaultAccountUuid: string,
  ): string {
    const assetAccountOptions = this.buildAssetAccountOptions(
      this.assets().find((asset) => asset.uuid === assetUuid) ?? null,
    );
    const availableAssetAccountUuids = new Set(assetAccountOptions.map((option) => option.value));

    if (availableAssetAccountUuids.has(currentAccountUuid)) {
      return currentAccountUuid;
    }

    return (
      assetAccountOptions[0]?.value ??
      (availableAccountUuids.has(currentAccountUuid) ? currentAccountUuid : defaultAccountUuid)
    );
  }

  private resolveDefaultAssetAccountUuid(assetUuid: string): string {
    return (
      this.buildAssetAccountOptions(
        this.assets().find((asset) => asset.uuid === assetUuid) ?? null,
      )[0]?.value ?? ''
    );
  }
}
