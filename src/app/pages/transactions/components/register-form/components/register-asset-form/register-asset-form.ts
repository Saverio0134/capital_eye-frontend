import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { FormField, FormRoot } from '@angular/forms/signals';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { Currency } from '../../../../../../models/asset.model';
import { SelectOption } from '../../../../../../shared/config/select-options.config';
import { AssetRegisterFormValue } from '../../../../transactions.types';
import { NgClass } from '@angular/common';
import { DatePickerComponent } from '../../../../../../shared/components/date-picker/date-picker';

@Component({
  selector: 'app-register-asset-form',
  imports: [
    ButtonModule,
    DatePickerComponent,
    FormField,
    FormRoot,
    InputNumberModule,
    SelectModule,
    NgClass,
  ],
  templateUrl: './register-asset-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterAssetForm {
  readonly assetForm = input.required<FieldTree<AssetRegisterFormValue>>();
  readonly accountOptions = input.required<Array<SelectOption<string>>>();
  readonly assetOptions = input.required<Array<SelectOption<string>>>();
  readonly selectedCurrency = input<Currency>(Currency.EUR);
  readonly canSave = input(false);
  readonly isSaving = input(false);
  readonly invalidRegisterField = input.required<<T>(field: FieldTree<T>) => boolean>();
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);

  readonly transactionTypeChange = output<'BUY' | 'SELL'>();
}
