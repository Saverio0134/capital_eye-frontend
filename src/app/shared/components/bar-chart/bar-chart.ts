import {
  Component,
  computed,
  effect,
  input,
  signal,
  ViewChild,
  ViewEncapsulation,
  AfterViewInit,
} from '@angular/core';
import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { BarChartSeries, buildBarChartData, buildBarChartOptions } from './config/bar-chart.config';

@Component({
  selector: 'app-bar-chart',
  imports: [ChartModule],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.css',
  encapsulation: ViewEncapsulation.None,
})
export class BarChartComponent implements AfterViewInit {
  labels = input<string[]>([]);
  series = input<BarChartSeries[]>([]);
  readonly chartPassThrough = {
    // host: {
    //   class: 'h-full w-full',
    // },
    // root: {
    //   class: 'h-full w-full',
    // },
    canvas: {
      class: 'h-full max-h-80 w-full',
    },
  } as const;

  @ViewChild('chartComponent') chartComponent: any;

  readonly data = computed<ChartData<'bar', number[], string>>(() =>
    buildBarChartData(this.labels(), this.series()),
  );
  readonly options = computed(() => buildBarChartOptions(this.series()));

  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      if (this.chartComponent?.chart) {
        setTimeout(() => {
          this.chartComponent.chart.resize();
        }, 100);
      }
    });
  }

  ngAfterViewInit() {
    const container = this.chartComponent?.el?.nativeElement?.parentElement;
    if (container && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chartComponent?.chart) {
          this.chartComponent.chart.resize();
        }
      });
      this.resizeObserver.observe(container);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }
}
