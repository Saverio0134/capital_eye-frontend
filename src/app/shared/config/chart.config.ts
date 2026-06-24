import { Chart, Plugin } from 'chart.js';

const noDataPlugin: Plugin = {
  id: 'noData',

  beforeDraw(chart) {
    const { data, chartArea } = chart;
    if (!chartArea) return;

    const dataset = data.datasets?.[0];
    if (!dataset || !Array.isArray(dataset.data)) {
      drawNoDataLabel(chart);
      return;
    }

    const values = dataset.data.filter((v): v is number => typeof v === 'number');

    const chartType = chart.getDatasetMeta(0)?.type;

    const isNoData =
      chartType === 'pie' || chartType === 'doughnut'
        ? values.every((v) => v === 0)
        : values.filter((v) => v != null).length < 2;

    if (!isNoData) return;
    drawNoDataLabel(chart);
  },
};

function drawNoDataLabel(chart: Chart) {
  const { ctx, chartArea } = chart;
  if (!chartArea) return;

  const { left, top, right, bottom } = chartArea;
  const width = right - left;
  const height = bottom - top;

  ctx.save();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim();

  ctx.fillStyle = primaryColor;
  const bodyStyle = getComputedStyle(document.body);

  const fontFamily = bodyStyle.fontFamily;
  const fontSize = '14px';
  const fontWeight = bodyStyle.fontWeight || '400';
  ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;

  ctx.fillText('Dati non sufficenti', left + width / 2, top + height / 2 - 10);

  ctx.restore();
}

Chart.register(noDataPlugin);
