import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import type { CreateAssetFormValue } from '../../save-asset.types';
import { AssetType } from '../../../../../../models/asset.model';
import { FormField } from '@angular/forms/signals';
import { invalidField } from '../../../../../../utils/form-field.utils';
import { SaveAssetInitialPositionForm } from '../save-asset-initial-position-form/save-asset-initial-position-form';

@Component({
  selector: 'app-save-asset-financial-form',
  imports: [FormField, InputNumberModule, InputTextModule, SaveAssetInitialPositionForm],
  templateUrl: './save-asset-financial-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveAssetFinancialForm {
  readonly form = input.required<FieldTree<CreateAssetFormValue>>();
  readonly showInitialPositionFields = input(true);

  readonly AssetType = AssetType;
  readonly invalidField = invalidField;
}
