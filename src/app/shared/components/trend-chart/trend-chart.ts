import {
  Component,
  computed,
  ElementRef,
  effect,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { MonthlyNetWorth } from '../../../models/networth.model';
import { getMonthNames } from '../../../utils/month.utils';
import { optionsTrendChart } from './config/option.config';

type TrendChartData = ChartData<'line', Array<number | null>, string>;
type TrendChartOptions = ReturnType<typeof optionsTrendChart>;

@Component({
  selector: 'app-trend-chart',
  imports: [ChartModule],
  templateUrl: './trend-chart.html',
  styleUrl: './trend-chart.css',
  encapsulation: ViewEncapsulation.None,
})
export class TrendChart {
  data = signal<TrendChartData | null>(null);
  options = signal<TrendChartOptions | null>(null);
  monthlyNetWort = input<MonthlyNetWorth[]>([]);
  container = viewChild<ElementRef<HTMLElement>>('chartContainer');

  // Mantiene solo gli ultimi sei punti reali già ordinati per data.
  private readonly visibleMonthlyNetWorth = computed(() =>
    [...this.monthlyNetWort()]
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
      .slice(-6),
  );

  private readonly labels = computed(() =>
    this.visibleMonthlyNetWorth().map((point) => getMonthNames(new Date(point.date))),
  );
  private readonly viewReady = signal(false);

  readonly items = computed(() => {
    const map = new Map<Date, number>();

    for (const point of this.visibleMonthlyNetWorth()) {
      map.set(new Date(point.date), point.value);
    }

    return map;
  });
  private resizeObserver!: ResizeObserver;

  constructor() {
    effect(() => {
      if (!this.viewReady()) {
        return;
      }

      this.renderChart();
    });
  }

  ngAfterViewInit() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateLegendPosition();
      });

      const container = this.container();
      if (container) {
        this.resizeObserver.observe(container.nativeElement);
      }
    }
    this.viewReady.set(true);
  }

  private updateLegendPosition() {
    this.options.update((o) => (o ? { ...o } : o));
  }

  // Renderizza il grafico riusando esclusivamente i punti mensili ricevuti in input.
  private renderChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    const values = [...this.items().values()];
    const hasAnyValue = values.some((v) => v !== 0);
    this.data.set({
      labels: this.labels(),
      datasets: [
        {
          label: 'Patrimonio',
          data: hasAnyValue ? values : values.map(() => null),
          fill: true,
          borderColor: documentStyle.getPropertyValue('--color-primary'),
          tension: 0,
        },
      ],
    });

    this.options.set(optionsTrendChart(this.items(), textColorSecondary, surfaceBorder));
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
