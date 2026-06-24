import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { FormField } from '@angular/forms/signals';
import { InputNumberModule } from 'primeng/inputnumber';
import type { CreateAssetFormValue } from '../../save-asset.types';
import { invalidField } from '../../../../../../utils/form-field.utils';

@Component({
  selector: 'app-save-asset-initial-position-form',
  imports: [FormField, InputNumberModule],
  templateUrl: './save-asset-initial-position-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveAssetInitialPositionForm {
  readonly form = input.required<FieldTree<CreateAssetFormValue>>();
  readonly quantityLabel = input('QUANTITA INIZIALE');
  readonly quantityHint = input('Quantita iniziale associata al conto selezionato.');

  readonly invalidField = invalidField;
}
