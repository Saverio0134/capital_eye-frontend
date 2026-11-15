import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';
import {
  calculatePeriodicPerformance,
  PeriodicInterval,
  PeriodicPerformanceItem,
  TimeSeriesPoint,
  TransactionFlow,
} from './periodic-performance.helpers';

@Component({
  selector: 'app-periodic-performance',
  imports: [ButtonModule, ChartModule, CurrencyPipe, DecimalPipe],
  templateUrl: './periodic-performance.html',
})
export class PeriodicPerformance {
  readonly data = input<TimeSeriesPoint[]>([]);
  readonly transactions = input<TransactionFlow[]>([]);
  readonly currency = input<string>('EUR');
  readonly title = input<string>('Rendimento Periodico');

  readonly selectedPeriod = signal<PeriodicInterval>(3);
  readonly selectedMetric = signal<'currency' | 'percent'>('currency');

  readonly items = computed<PeriodicPerformanceItem[]>(() => {
    return calculatePeriodicPerformance(this.data(), this.selectedPeriod(), this.transactions());
  });

  readonly chartData = computed<ChartData<'bar', number[], string>>(() => {
    const items = this.items();
    const isCurrency = this.selectedMetric() === 'currency';

    return {
      labels: items.map((i) => i.label),
      datasets: [
        {
          label: isCurrency ? `Interesse (${this.currency()})` : 'Rendimento (%)',
          data: items.map((i) => (isCurrency ? i.deltaValue : i.deltaPercent)),
          backgroundColor: items.map((i) => (i.deltaValue >= 0 ? '#14532d' : '#7f1d1d')),
        },
      ],
    };
  });

  readonly chartOptions = computed<ChartOptions<'bar'>>(() => {
    const isCurrency = this.selectedMetric() === 'currency';
    const curr = this.currency();
    const items = this.items();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const item = items[ctx.dataIndex];
              if (!item) return '';
              const sign = item.deltaValue > 0 ? '+' : '';
              const valStr = `${sign}${item.deltaValue.toLocaleString('it-IT', {
                style: 'currency',
                currency: curr,
              })}`;
              const pctStr = `${item.deltaPercent > 0 ? '+' : ''}${item.deltaPercent}%`;
              const inflowStr =
                item.netInflows !== 0
                  ? ` (Versamenti: ${item.netInflows > 0 ? '+' : ''}${item.netInflows.toLocaleString(
                      'it-IT',
                      {
                        style: 'currency',
                        currency: curr,
                      },
                    )})`
                  : '';
              return isCurrency
                ? `Interesse: ${valStr} [${pctStr}]${inflowStr}`
                : `Rendimento: ${pctStr} [${valStr}]${inflowStr}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.08)',
          },
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.08)',
          },
          ticks: {
            callback: (val) => {
              const num = Number(val);
              if (isCurrency) {
                return num.toLocaleString('it-IT', {
                  style: 'currency',
                  currency: curr,
                  maximumFractionDigits: 0,
                });
              }
              return `${num}%`;
            },
          },
        },
      },
    };
  });
}
