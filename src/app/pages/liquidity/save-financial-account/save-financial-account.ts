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
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AccountType } from '../../../enum/account.enum';
import { Currency } from '../../../models/asset.model';
import {
  CreateFinancialAccountPayload,
  FinancialAccount,
} from '../../../models/financial-account.model';
import { FinancialAccountApi } from '../../../services/api/financial-account-api/financial-account-api';
import { FinancialAccountStore } from '../../../services/store/financial-account-store/financial-account-store';
import {
  ACCOUNT_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
} from '../../../shared/config/select-options.config';

interface FinancialAccountFormValue {
  name: string;
  type: AccountType;
  currency: Currency;
}

const EMPTY_FINANCIAL_ACCOUNT_FORM: FinancialAccountFormValue = {
  name: '',
  type: 'BANK',
  currency: Currency.EUR,
};

@Component({
  selector: 'app-save-financial-account',
  imports: [
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    FormField,
    FormRoot,
  ],
  templateUrl: './save-financial-account.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveFinancialAccount {
  readonly visible = input(false);
  readonly financialAccount = input<FinancialAccount | null>(null);
  readonly visibleChange = output<boolean>();
  readonly financialAccountSaved = output<void>();

  private financialAccountApi = inject(FinancialAccountApi);
  private financialAccountStore = inject(FinancialAccountStore);
  private wasVisible = false;
  private previousAccountUuid: string | null = null;

  readonly isSavingFinancialAccount = signal(false);

  readonly financialAccountFormModel = signal<FinancialAccountFormValue>({
    ...EMPTY_FINANCIAL_ACCOUNT_FORM,
  });

  readonly financialAccountForm = form(
    this.financialAccountFormModel,
    (account) => {
      required(account.name, { message: 'Nome obbligatorio' });
      required(account.type, { message: 'Tipo obbligatorio' });
      required(account.currency, { message: 'Valuta obbligatoria' });
    },
    {
      submission: {
        action: async () => await this.saveFinancialAccount(),
      },
    },
  );

  readonly accountTypeOptions = ACCOUNT_TYPE_OPTIONS;
  readonly currencyOptions = CURRENCY_OPTIONS;

  readonly isEditMode = computed(() => this.financialAccount() !== null);

  readonly canSaveFinancialAccount = computed(() => {
    return (
      this.financialAccountForm().valid() &&
      this.financialAccountFormModel().name.trim().length > 0 &&
      !this.isSavingFinancialAccount()
    );
  });

  // Inizializza il form conto.
  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const account = this.financialAccount();
      const accountUuid = account?.uuid ?? null;

      if (isVisible && (!this.wasVisible || this.previousAccountUuid !== accountUuid)) {
        this.setFormValue(account);
      }

      this.wasVisible = isVisible;
      this.previousAccountUuid = accountUuid;
    });
  }

  // Controlla lo stato del campo.
  invalidFinancialAccountField<T>(field: FieldTree<T>): boolean {
    return field().touched() && field().invalid();
  }

  // Chiude il dialog conto.
  closeDialog(): void {
    if (this.isSavingFinancialAccount()) return;
    this.visibleChange.emit(false);
  }

  // Salva o aggiorna il conto.
  async saveFinancialAccount(event?: SubmitEvent): Promise<void> {
    event?.preventDefault();
    if (!this.canSaveFinancialAccount()) return;

    this.isSavingFinancialAccount.set(true);

    const payload = this.toFinancialAccountPayload();
    const optimisticAccount = this.buildOptimisticFinancialAccount(payload);
    const optimisticAccountUuid = optimisticAccount.uuid;

    try {
      const account = this.financialAccount();

      this.financialAccountStore.upsertOptimisticFinancialAccount(optimisticAccount);

      if (account) {
        const savedAccount = await firstValueFrom(
          this.financialAccountApi.updateFinancialAccount(account.uuid, payload),
        );
        this.financialAccountStore.replaceOptimisticFinancialAccount(
          optimisticAccountUuid,
          savedAccount,
        );
      } else {
        const savedAccount = await firstValueFrom(
          this.financialAccountApi.createFinancialAccount(payload),
        );
        this.financialAccountStore.replaceOptimisticFinancialAccount(
          optimisticAccountUuid,
          savedAccount,
        );
      }

      this.financialAccountSaved.emit();
      this.visibleChange.emit(false);
    } catch {
      this.financialAccountStore.removeOptimisticFinancialAccount(optimisticAccountUuid);
    } finally {
      this.isSavingFinancialAccount.set(false);
    }
  }

  // Carica i dati nel form.
  private setFormValue(account: FinancialAccount | null): void {
    this.financialAccountFormModel.set(
      account
        ? {
            name: account.name,
            type: account.type,
            currency: account.currency,
          }
        : {
            ...EMPTY_FINANCIAL_ACCOUNT_FORM,
          },
    );
  }

  // Costruisce il payload conto.
  private toFinancialAccountPayload(): CreateFinancialAccountPayload {
    const value = this.financialAccountFormModel();

    return {
      name: value.name.trim(),
      type: value.type,
      currency: value.currency,
    };
  }

  // Crea il conto ottimistico.
  private buildOptimisticFinancialAccount(
    payload: CreateFinancialAccountPayload,
  ): FinancialAccount {
    const existingAccount = this.financialAccount();
    const now = new Date();

    return {
      uuid: existingAccount?.uuid ?? this.buildOptimisticUuid(),
      userId: existingAccount?.userId,
      name: payload.name,
      type: payload.type,
      currency: payload.currency,
      createdAt: existingAccount?.createdAt ?? now,
      updatedAt: now,
    };
  }

  // Genera l'id temporaneo.
  private buildOptimisticUuid(): string {
    return `optimistic-financial-account-${Date.now()}`;
  }
}
