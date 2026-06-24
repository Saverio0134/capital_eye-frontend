import {
  Component,
  ElementRef,
  effect,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ChartModule } from 'primeng/chart';

interface DistributionSeries {
  labels: string[];
  values: number[];
  colors: string[];
  hoverColors: string[] | undefined;
}

@Component({
  selector: 'app-distribution-chart',
  imports: [ChartModule],
  templateUrl: './distribution-chart.html',
  styleUrl: './distribution-chart.css',
  encapsulation: ViewEncapsulation.None,
})
export class DistributionChart {
  labels = input.required<string[]>();
  values = input.required<number[]>();

  container = viewChild<ElementRef<HTMLElement>>('chartContainer');
  data = signal<any>(null);
  options = signal<any>(null);
  private viewReady = signal(false);

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
    this.resizeObserver = new ResizeObserver(() => {
      this.updateLegendPosition(window.innerWidth);
    });

    this.resizeObserver.observe(this.container()!.nativeElement);
    this.viewReady.set(true);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private getSeries(): DistributionSeries {
    const labels = this.labels();
    const values = this.values();
    const size = Math.min(labels.length, values.length);
    const baseColors = this.buildPalette(size);

    return {
      labels: labels.slice(0, size),
      values: values.slice(0, size),
      colors: baseColors,
      hoverColors: baseColors,
    };
  }

  private buildPalette(size: number): string[] {
    const root = document.documentElement;

    // neutri ben distinguibili tra loro, dal quasi nero al quasi bianco
    const palette = [
      this.resolveCssVar(root, '--color-neutral-900'),
      this.resolveCssVar(root, '--color-neutral-200'),
      this.resolveCssVar(root, '--color-neutral-500'),
      this.resolveCssVar(root, '--color-neutral-800'),
      this.resolveCssVar(root, '--color-neutral-300'),
      this.resolveCssVar(root, '--color-neutral-700'),
      this.resolveCssVar(root, '--color-neutral-400'),
      this.resolveCssVar(root, '--color-neutral-600'),
    ].filter((color): color is string => Boolean(color));

    return Array.from({ length: size }, (_, index) => palette[index % palette.length]);
  }

  private resolveCssVar(scope: HTMLElement, variableName: string): string | null {
    const raw = getComputedStyle(scope).getPropertyValue(variableName).trim();
    if (!raw) {
      return null;
    }

    const probe = document.createElement('span');
    probe.style.color = raw;
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    probe.style.top = '-9999px';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);

    const resolved = getComputedStyle(probe).color;
    probe.remove();

    return resolved || null;
  }

  private updateLegendPosition(size: number) {
    this.options.update((o) => ({
      ...o,
      plugins: {
        ...o.plugins,
        legend: {
          ...o.plugins.legend,
          position: size < 1024 ? 'bottom' : 'right',
        },
      },
    }));
  }

  private renderChart() {
    const textColor = getComputedStyle(document.body).color;
    const screenWidth = window.innerWidth;
    const bodyStyle = getComputedStyle(document.body);

    const fontFamily = bodyStyle.fontFamily;
    const fontWeight = bodyStyle.fontWeight || '400';
    const font = {
      family: fontFamily,
      size: 12,
      weight: fontWeight,
    };

    const series = this.getSeries();

    this.data.set({
      labels: series.labels,
      datasets: [
        {
          data: series.values,
          backgroundColor: series.colors,
          hoverBackgroundColor: series.hoverColors ?? series.colors,
          borderColor: textColor,
          borderWidth: 1,
        },
      ],
    });

    this.options.set({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: screenWidth < 1024 ? 'bottom' : 'right',
          labels: {
            usePointStyle: true,
            color: textColor,
            padding: 30,
            font,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) =>
              new Intl.NumberFormat('it-IT', {
                maximumFractionDigits: 2,
              }).format(ctx.parsed),
          },
          bodyFont: font,
          titleFont: {
            ...font,
            weight: '600',
          },
        },
        noData: true,
      },
    });
  }
}
