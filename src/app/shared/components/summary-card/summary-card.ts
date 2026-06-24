import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './summary-card.html',
})
export class SummaryCardComponent {
  label = input.required<string>();
  value = input.required<number | undefined | null>();
  lastUpdate = input<Date | string | undefined | null>();
  growth = input<number>(0);
  isLoading = input<boolean>(false);
  randomNumber = input<number>(0);
}
