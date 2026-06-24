import { optionsTrendChart } from './option.config';

describe('optionsTrendChart', () => {
  // Garantisce un font globale leggibile per la costruzione delle opzioni.
  beforeEach(() => {
    document.body.style.fontFamily = 'sans-serif';
    document.body.style.fontWeight = '400';
  });

  it('does not force the 10k placeholder scale when a single month has data', () => {
    const options = optionsTrendChart(
      new Map<Date, number>([
        [new Date(2026, 0, 1), 0],
        [new Date(2026, 1, 1), 42000],
      ]),
      '#444444',
      '#dddddd',
    );

    const yScale = options.scales?.['y'];

    expect(yScale && 'max' in yScale ? yScale.max : undefined).toBeUndefined();
  });

  it('keeps the placeholder scale when every month is zero', () => {
    const options = optionsTrendChart(
      new Map<Date, number>([
        [new Date(2026, 0, 1), 0],
        [new Date(2026, 1, 1), 0],
      ]),
      '#444444',
      '#dddddd',
    );

    const yScale = options.scales?.['y'];

    expect(yScale && 'max' in yScale ? yScale.max : undefined).toBe(10000);
  });
});
