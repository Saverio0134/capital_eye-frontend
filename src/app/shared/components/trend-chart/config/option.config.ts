import { FontSpec, TooltipItem } from 'chart.js';
import { getMonthNames } from '../../../../utils/month.utils';

// Deriva il font del chart dalla tipografia globale corrente.
function buildFont(): Partial<FontSpec> {
  const bodyStyle = getComputedStyle(document.body);
  const fontWeight: FontSpec['weight'] = Number(bodyStyle.fontWeight) >= 600 ? 'bold' : 'normal';

  return {
    family: bodyStyle.fontFamily,
    size: 12,
    weight: fontWeight,
  };
}

// Formatta i valori monetari mostrati su asse e tooltip.
function formatCurrency(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits,
  }).format(value);
}

// Verifica se la serie contiene almeno un mese con valore reale.
function hasAnyChartValue(items: Map<Date, number>): boolean {
  return [...items.values()].some((value) => value !== 0);
}

// Restituisce il testo finale del tooltip in base al mese selezionato.
function buildTooltipFooter(items: TooltipItem<'line'>[]): string {
  const today = new Date();
  const isThisMonth = getMonthNames(today) === items[0]?.label;
  return isThisMonth ? 'valore odierno' : 'valore finale del mese';
}

// Costruisce le opzioni del trend evitando il placeholder 10k quando esiste almeno un dato reale.
export function optionsTrendChart(
  items: Map<Date, number>,
  textColorSecondary: string,
  surfaceBorder: string,
) {
  const hasAnyValue = hasAnyChartValue(items);
  const font = buildFont();

  const y = hasAnyValue
    ? {
        ticks: {
          color: textColorSecondary,
          font,
          callback: (value: string | number) => formatCurrency(Number(value)),
        },
        grid: {
          color: surfaceBorder,
          drawBorder: false,
        },
      }
    : {
        min: 0,
        max: 10000,
        ticks: {
          stepSize: 1000,
          color: textColorSecondary,
          callback: (value: string | number) => formatCurrency(Number(value)),
          font,
        },
        grid: {
          color: 'transparent',
          drawBorder: false,
        },
      };

  return {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.7,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => formatCurrency(ctx.parsed.y ?? 0, 2),
          footer: (ctx: TooltipItem<'line'>[]) => buildTooltipFooter(ctx),
        },
        bodyFont: font,
        titleFont: {
          ...font,
          weight: 'bold',
        },
        footerFont: {
          ...font,
          size: 10,
        },
      },
      noData: true,
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
          font,
        },
        grid: {
          color: hasAnyValue ? surfaceBorder : 'transparent',
          drawBorder: false,
        },
      },
      y,
    },
  };
}
