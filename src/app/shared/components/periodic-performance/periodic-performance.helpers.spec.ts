import {
  calculatePeriodicPerformance,
  TimeSeriesPoint,
  TransactionFlow,
} from './periodic-performance.helpers';

describe('calculatePeriodicPerformance', () => {
  it('should return an empty array if rawPoints is empty or has less than 2 points', () => {
    expect(calculatePeriodicPerformance([], 3)).toEqual([]);
    expect(
      calculatePeriodicPerformance([{ date: new Date(2025, 0, 1), value: 100 }], 3),
    ).toEqual([]);
  });

  it('should calculate 1-month period variations correctly without transactions', () => {
    const points: TimeSeriesPoint[] = [
      { date: new Date(2025, 0, 1), value: 1000 },
      { date: new Date(2025, 1, 1), value: 1200 },
      { date: new Date(2025, 2, 1), value: 1100 },
    ];

    const result = calculatePeriodicPerformance(points, 1);

    expect(result.length).toBe(2);

    expect(result[0].label).toBe('Feb 2025');
    expect(result[0].netInflows).toBe(0);
    expect(result[0].deltaValue).toBe(200);
    expect(result[0].deltaPercent).toBe(20);
    expect(result[0].isPositive).toBeTrue();
    expect(result[0].isNegative).toBeFalse();

    expect(result[1].label).toBe('Mar 2025');
    expect(result[1].netInflows).toBe(0);
    expect(result[1].deltaValue).toBe(-100);
    expect(result[1].deltaPercent).toBe(-8.33);
    expect(result[1].isPositive).toBeFalse();
    expect(result[1].isNegative).toBeTrue();
  });

  it('should ignore transactions that occurred BEFORE the snapshot history started', () => {
    // Supponiamo che l'account esista da Giugno 2026 e i punti partano da Maggio (baseline) e Giugno
    const points: TimeSeriesPoint[] = [
      { date: new Date(2026, 4, 31), value: 1250 }, // Fine Maggio: 1250 €
      { date: new Date(2026, 5, 30), value: 1530 }, // Fine Giugno: 1530 €
    ];

    // L'utente ha inserito transazioni pregresse per Gen, Feb, Mar, Apr (250 ciascuna)
    // e una sola transazione a Giugno (250)
    const transactions: TransactionFlow[] = [
      { date: new Date(2026, 0, 15), type: 'BUY', totalAmount: 250 }, // Gen
      { date: new Date(2026, 1, 15), type: 'BUY', totalAmount: 250 }, // Feb
      { date: new Date(2026, 2, 15), type: 'BUY', totalAmount: 250 }, // Mar
      { date: new Date(2026, 3, 15), type: 'BUY', totalAmount: 250 }, // Apr
      { date: new Date(2026, 4, 15), type: 'BUY', totalAmount: 250 }, // Mag (baseline)
      { date: new Date(2026, 5, 15), type: 'BUY', totalAmount: 250 }, // Giu (incluso!)
    ];

    // Test in 1-Mese (GIU 2026)
    const result1M = calculatePeriodicPerformance(points, 1, transactions);
    expect(result1M.length).toBe(1);
    expect(result1M[0].label).toBe('Giu 2026');
    // Deve includere SOLO il versamento di Giugno (250 €)
    expect(result1M[0].netInflows).toBe(250);
    // Delta reale: 1530 - 1250 - 250 = +30 €
    expect(result1M[0].deltaValue).toBe(30);
    expect(result1M[0].isPositive).toBeTrue();

    // Test in 6-Mesi (S1 2026)
    const result6M = calculatePeriodicPerformance(points, 6, transactions);
    expect(result6M.length).toBe(1);
    expect(result6M[0].label).toBe('S1 2026');
    expect(result6M[0].subLabel).toContain('Parziale');
    // Non deve includere i 1500 € di versamenti antecedenti, ma solo i 250 € di Giugno!
    expect(result6M[0].netInflows).toBe(250);
    expect(result6M[0].deltaValue).toBe(30);
    expect(result6M[0].isPositive).toBeTrue();
  });

  it('should deduct BUY deposits from deltaValue to show real interest/gain', () => {
    const points: TimeSeriesPoint[] = [
      { date: new Date(2025, 0, 31), value: 1000 }, // Jan: 1000 €
      { date: new Date(2025, 1, 28), value: 2000 }, // Feb: 2000 €
    ];

    // L'utente versa/compra 800 € a febbraio
    const transactions: TransactionFlow[] = [
      {
        date: new Date(2025, 1, 15),
        type: 'BUY',
        totalAmount: 800,
      },
    ];

    const result = calculatePeriodicPerformance(points, 1, transactions);

    expect(result.length).toBe(1);
    expect(result[0].label).toBe('Feb 2025');
    expect(result[0].netInflows).toBe(800);
    // Delta reale = 2000 - 1000 - 800 = +200 €
    expect(result[0].deltaValue).toBe(200);
    expect(result[0].isPositive).toBeTrue();
  });

  it('should account for SELL transactions (capital withdrawals)', () => {
    const points: TimeSeriesPoint[] = [
      { date: new Date(2025, 0, 31), value: 2000 }, // Jan: 2000 €
      { date: new Date(2025, 1, 28), value: 1600 }, // Feb: 1600 €
    ];

    // L'utente disinveste/vende 500 € a febbraio
    const transactions: TransactionFlow[] = [
      {
        date: new Date(2025, 1, 15),
        type: 'SELL',
        totalAmount: 500,
      },
    ];

    const result = calculatePeriodicPerformance(points, 1, transactions);

    expect(result.length).toBe(1);
    expect(result[0].netInflows).toBe(-500);
    // Delta reale = (1600 - 2000) - (-500) = -400 + 500 = +100 €
    expect(result[0].deltaValue).toBe(100);
    expect(result[0].isPositive).toBeTrue();
  });

  it('should account for transactions in quarterly calculations (Q1 2025) with full history', () => {
    const points: TimeSeriesPoint[] = [
      { date: new Date(2024, 11, 31), value: 10000 }, // Dec 2024 (baseline)
      { date: new Date(2025, 0, 31), value: 10500 }, // Jan (Q1)
      { date: new Date(2025, 1, 28), value: 11000 }, // Feb (Q1)
      { date: new Date(2025, 2, 31), value: 13000 }, // Mar (Q1)
    ];

    // Versamento di 2000 € a febbraio
    const transactions: TransactionFlow[] = [
      {
        date: new Date(2025, 1, 10),
        type: 'BUY',
        totalAmount: 2000,
      },
    ];

    const result = calculatePeriodicPerformance(points, 3, transactions);

    expect(result.length).toBe(1);
    expect(result[0].label).toBe('Q1 2025');
    expect(result[0].netInflows).toBe(2000);
    // Delta reale = (13000 - 10000) - 2000 = +1000 €
    expect(result[0].deltaValue).toBe(1000);
    expect(result[0].isPositive).toBeTrue();
  });

  it('should calculate 12-month annual variations', () => {
    const points: TimeSeriesPoint[] = [
      { date: new Date(2024, 11, 31), value: 10000 },
      { date: new Date(2025, 11, 31), value: 12000 },
    ];

    const result = calculatePeriodicPerformance(points, 12);

    expect(result.length).toBe(1);
    expect(result[0].label).toBe('2025');
    expect(result[0].deltaValue).toBe(2000);
    expect(result[0].deltaPercent).toBe(20);
  });
});
