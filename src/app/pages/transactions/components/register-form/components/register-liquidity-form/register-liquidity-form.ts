import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { FormField, FormRoot } from '@angular/forms/signals';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { Currency } from '../../../../../../models/asset.model';
import { SelectOption } from '../../../../../../shared/config/select-options.config';
import { LiquidityRegisterFormValue } from '../../../../transactions.types';
import { DatePickerComponent } from '../../../../../../shared/components/date-picker/date-picker';

@Component({
  selector: 'app-register-liquidity-form',
  imports: [
    ButtonModule,
    DatePickerComponent,
    FormField,
    FormRoot,
    InputNumberModule,
    SelectModule,
  ],
  templateUrl: './register-liquidity-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterLiquidityForm {
  readonly liquidityForm = input.required<FieldTree<LiquidityRegisterFormValue>>();
  readonly accountOptions = input.required<Array<SelectOption<string>>>();
  readonly selectedCurrency = input<Currency>(Currency.EUR);
  readonly canSave = input(false);
  readonly isSaving = input(false);
  readonly invalidRegisterField = input.required<<T>(field: FieldTree<T>) => boolean>();
}
