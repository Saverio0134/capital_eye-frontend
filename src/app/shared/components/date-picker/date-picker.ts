import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DeviceService } from '../../../services/device/device.service';

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Component({
  selector: 'app-date-picker',
  imports: [DatePickerModule, FormsModule],
  templateUrl: './date-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: DatePickerComponent, multi: true }],
})
export class DatePickerComponent implements ControlValueAccessor {
  readonly inputId = input<string>('');
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly invalid = input(false);

  private readonly deviceService = inject(DeviceService);
  readonly isMobile = this.deviceService.isMobile;

  protected readonly value = signal<Date | null>(null);
  protected readonly isDisabled = signal(false);

  protected readonly valueAsString = computed(() => {
    const d = this.value();
    return d ? formatDateForInput(d) : '';
  });

  protected readonly minDateAsString = computed(() => {
    const d = this.minDate();
    return d ? formatDateForInput(d) : '';
  });

  protected readonly maxDateAsString = computed(() => {
    const d = this.maxDate();
    return d ? formatDateForInput(d) : '';
  });

  private onChangeFn: (v: Date | null) => void = () => {};
  protected onTouchedFn: () => void = () => {};

  writeValue(v: Date | null): void {
    this.value.set(v ?? null);
  }

  registerOnChange(fn: (v: Date | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected onDesktopChange(date: Date | null): void {
    this.value.set(date);
    this.onChangeFn(date);
  }

  protected onNativeChange(event: Event): void {
    const str = (event.target as HTMLInputElement).value;
    // Il native input restituisce YYYY-MM-DD oppure stringa vuota
    const date = str ? new Date(`${str}T00:00:00`) : null;
    this.value.set(date);
    this.onChangeFn(date);
  }
}
