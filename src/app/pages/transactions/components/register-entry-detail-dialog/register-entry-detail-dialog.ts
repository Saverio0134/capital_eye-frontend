import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import type { RegisterEntry } from '../../transactions.types';

@Component({
  selector: 'app-register-entry-detail-dialog',
  imports: [ButtonModule, CurrencyPipe, DatePipe, DecimalPipe, DialogModule],
  templateUrl: './register-entry-detail-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterEntryDetailDialog {
  readonly entry = input<RegisterEntry | null>(null);

  readonly close = output<void>();
  readonly delete = output<RegisterEntry>();
}
