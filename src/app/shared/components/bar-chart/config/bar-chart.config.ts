import { ChartData, ChartDataset, ChartOptions, FontSpec, TooltipItem } from 'chart.js';
import { getLastNMonths, getMonthNames } from '../../../../utils/month.utils';

export interface BarChartSeries {
  label: string;
  values: number[];
}

export type BarChartOptions = ChartOptions<'bar'> & {
  plugins: NonNullable<ChartOptions<'bar'>['plugins']> & { noData: boolean };
};

const palette = ['#000000', '#444444', '#888888', '#BBBBBB', '#666666', '#999999'];
const placeholderLabels = getLastNMonths(6).map((label) =>
  typeof label === 'string' ? label : getMonthNames(label),
);

function buildFont(): Partial<FontSpec> {
  const bodyStyle = getComputedStyle(document.body);
  const fontWeight: FontSpec['weight'] = Number(bodyStyle.fontWeight) >= 600 ? 'bold' : 'normal';

  return {
    family: bodyStyle.fontFamily,
    size: 12,
    weight: fontWeight,
  };
}

function formatCurrency(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Math.min(maximumFractionDigits, 2),
    maximumFractionDigits,
  }).format(value);
}

export function buildBarChartData(
  labels: string[],
  series: BarChartSeries[],
): ChartData<'bar', number[], string> {
  const enoughData = hasEnoughData(series);
  const datasets: ChartDataset<'bar', number[]>[] = series.map((item, index) => ({
    label: item.label,
    data: item.values,
    backgroundColor: palette[index % palette.length],
    borderColor: palette[index % palette.length],
    borderWidth: 0,
    hoverBorderWidth: 0,
    borderRadius: 0,
  }));

  return {
    labels: labels.length > 0 || enoughData ? labels : placeholderLabels,
    datasets,
  };
}

function hasEnoughData(series: BarChartSeries[]): boolean {
  const values = series.flatMap((item) => item.values).filter((value) => value != null);
  return values.length >= 2;
}

export function buildBarChartOptions(series: BarChartSeries[]): BarChartOptions {
  const textColor =
    getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() ||
    '#000000';
  const font = buildFont();
  const enoughData = hasEnoughData(series);

  const y = enoughData
    ? {
        stacked: true,
        ticks: {
          color: textColor,
          font,
          callback: (value: string | number) => formatCurrency(Number(value), 0),
        },
        grid: { color: 'rgba(0,0,0,0.12)' },
      }
    : {
        stacked: true,
        min: 0,
        max: 10000,
        ticks: {
          stepSize: 1000,
          color: textColor,
          font,
          callback: (value: string | number) => formatCurrency(Number(value), 0),
        },
        grid: { color: 'transparent' },
      };

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: enoughData,
        position: 'bottom',
        labels: {
          color: textColor,
          font,
          usePointStyle: false,
          boxWidth: 14,
          boxHeight: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
        },
        titleFont: font,
        bodyFont: font,
      },
      noData: true,
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: textColor, font },
        grid: { color: enoughData ? 'rgba(0,0,0,0.12)' : 'transparent' },
      },
      y,
    },
  };
}
