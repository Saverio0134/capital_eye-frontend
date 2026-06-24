import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { FormField } from '@angular/forms/signals';
import { MetalType } from '../../../../../../models/asset.model';
import type {
  CreateAssetFormValue,
  PreciousMetalQuantityMode,
} from '../../save-asset.types';
import type { SaveAssetPhysicalFormConfig } from '../../save-asset.helpers';
import type { SelectOption } from '../../../../../../shared/config/select-options.config';
import { invalidField } from '../../../../../../utils/form-field.utils';
import { SaveAssetInitialPositionForm } from '../save-asset-initial-position-form/save-asset-initial-position-form';

@Component({
  selector: 'app-save-asset-physical-form',
  imports: [
    FormField,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    SaveAssetInitialPositionForm,
  ],
  templateUrl: './save-asset-physical-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveAssetPhysicalForm {
  readonly form = input.required<FieldTree<CreateAssetFormValue>>();
  readonly showInitialPositionFields = input(true);
  readonly config = input.required<SaveAssetPhysicalFormConfig>();
  readonly metalTypeOptions = input.required<SelectOption<MetalType>[]>();
  readonly preciousMetalPriceModeChange = output<boolean>();
  readonly preciousMetalQuantityModeChange = output<PreciousMetalQuantityMode>();

  readonly invalidField = invalidField;
}
