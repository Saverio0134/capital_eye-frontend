export interface TimeSeriesPoint {
  date: Date | string;
  value: number;
}

export interface TransactionFlow {
  date: Date | string;
  type: 'BUY' | 'SELL';
  totalAmount: number;
}

export interface PeriodicPerformanceItem {
  id: string;
  label: string;
  subLabel: string;
  startDate: Date;
  endDate: Date;
  startValue: number;
  endValue: number;
  netInflows: number;
  deltaValue: number;
  deltaPercent: number;
  isPositive: boolean;
  isNegative: boolean;
}

export type PeriodicInterval = 1 | 3 | 6 | 12;

const MONTH_NAMES_SHORT = [
  'Gen',
  'Feb',
  'Mar',
  'Apr',
  'Mag',
  'Giu',
  'Lug',
  'Ago',
  'Set',
  'Ott',
  'Nov',
  'Dic',
];

interface PeriodGroup {
  key: string;
  year: number;
  periodIndex: number;
  label: string;
  subLabel: string;
  points: Array<{ date: Date; value: number }>;
}

function normalizeDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

function toMonthKey(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

export function calculatePeriodicPerformance(
  rawPoints: TimeSeriesPoint[],
  periodMonths: PeriodicInterval,
  rawTransactions: TransactionFlow[] = [],
): PeriodicPerformanceItem[] {
  if (!rawPoints || rawPoints.length < 2) {
    return [];
  }

  // Normalizza e ordina i punti per data crescente
  const points = rawPoints
    .map((p) => ({
      date: normalizeDate(p.date),
      value: typeof p.value === 'number' && Number.isFinite(p.value) ? p.value : 0,
    }))
    .filter((p) => !isNaN(p.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (points.length < 2) {
    return [];
  }

  // Normalizza le transazioni
  const transactions = (rawTransactions ?? [])
    .map((tx) => ({
      date: normalizeDate(tx.date),
      type: tx.type,
      totalAmount:
        typeof tx.totalAmount === 'number' && Number.isFinite(tx.totalAmount)
          ? tx.totalAmount
          : 0,
    }))
    .filter((tx) => !isNaN(tx.date.getTime()) && tx.totalAmount > 0);

  // 1 Mese: ogni punto è confrontato con il mese precedente
  if (periodMonths === 1) {
    const items: PeriodicPerformanceItem[] = [];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const monthIndex = curr.date.getMonth();
      const year = curr.date.getFullYear();
      const label = `${MONTH_NAMES_SHORT[monthIndex]} ${year}`;

      const startMonthKey = toMonthKey(prev.date);
      const endMonthKey = toMonthKey(curr.date);

      // Include solo transazioni avvenute strettamente tra lo snapshot iniziale e finale
      const periodTxs = transactions.filter((tx) => {
        const txMonthKey = toMonthKey(tx.date);
        return txMonthKey > startMonthKey && txMonthKey <= endMonthKey;
      });

      const periodDuration = Math.max(1, curr.date.getTime() - prev.date.getTime());
      let buyAmount = 0;
      let sellAmount = 0;
      let weightedInflow = 0;

      for (const tx of periodTxs) {
        const inflow = tx.type === 'BUY' ? tx.totalAmount : -tx.totalAmount;
        if (tx.type === 'BUY') {
          buyAmount += tx.totalAmount;
        } else {
          sellAmount += tx.totalAmount;
        }

        const remainingTime = Math.max(0, curr.date.getTime() - tx.date.getTime());
        const weight = Math.min(1, Math.max(0, remainingTime / periodDuration));
        weightedInflow += inflow * weight;
      }

      const netInflows = Number((buyAmount - sellAmount).toFixed(2));
      const deltaValue = Number((curr.value - prev.value - netInflows).toFixed(2));

      const effectiveCapital = prev.value + weightedInflow;
      const denominator =
        effectiveCapital > 0 ? effectiveCapital : prev.value > 0 ? prev.value : 0;

      const deltaPercent =
        denominator > 0 ? Number(((deltaValue / denominator) * 100).toFixed(2)) : 0;

      items.push({
        id: `m-${year}-${monthIndex}`,
        label,
        subLabel: 'Mensile',
        startDate: prev.date,
        endDate: curr.date,
        startValue: prev.value,
        endValue: curr.value,
        netInflows,
        deltaValue,
        deltaPercent,
        isPositive: deltaValue > 0.001,
        isNegative: deltaValue < -0.001,
      });
    }

    return items;
  }

  // 3, 6, 12 Mesi: raggruppamento per finestre di calendario
  const groupsMap = new Map<string, PeriodGroup>();

  for (const point of points) {
    const year = point.date.getFullYear();
    const month = point.date.getMonth();
    let groupKey = '';
    let periodIndex = 1;
    let label = '';
    let subLabel = '';

    if (periodMonths === 3) {
      periodIndex = Math.floor(month / 3) + 1;
      groupKey = `${year}-Q${periodIndex}`;
      label = `Q${periodIndex} ${year}`;
      switch (periodIndex) {
        case 1:
          subLabel = 'Gen - Mar';
          break;
        case 2:
          subLabel = 'Apr - Giu';
          break;
        case 3:
          subLabel = 'Lug - Set';
          break;
        case 4:
          subLabel = 'Ott - Dic';
          break;
      }
    } else if (periodMonths === 6) {
      periodIndex = Math.floor(month / 6) + 1;
      groupKey = `${year}-S${periodIndex}`;
      label = `S${periodIndex} ${year}`;
      subLabel = periodIndex === 1 ? 'Gen - Giu' : 'Lug - Dic';
    } else {
      periodIndex = 1;
      groupKey = `${year}`;
      label = `${year}`;
      subLabel = 'Gen - Dic';
    }

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        key: groupKey,
        year,
        periodIndex,
        label,
        subLabel,
        points: [],
      });
    }

    groupsMap.get(groupKey)!.points.push(point);
  }

  const groups = Array.from(groupsMap.values());
  const items: PeriodicPerformanceItem[] = [];

  for (let i = 0; i < groups.length; i++) {
    const currentGroup = groups[i];
    const groupPoints = currentGroup.points;
    const endPoint = groupPoints[groupPoints.length - 1];

    let startPoint: { date: Date; value: number } | null = null;

    if (i > 0) {
      const prevGroup = groups[i - 1];
      startPoint = prevGroup.points[prevGroup.points.length - 1];
    } else if (groupPoints.length >= 2) {
      startPoint = groupPoints[0];
    }

    if (!startPoint || startPoint.date.getTime() === endPoint.date.getTime()) {
      continue;
    }

    const startMonthKey = toMonthKey(startPoint.date);
    const endMonthKey = toMonthKey(endPoint.date);

    // Considera solo transazioni avvenute DOPO lo snapshot iniziale e FINO allo snapshot finale.
    // In questo modo, le transazioni antecedenti all'inizio dello storico degli snapshot
    // non vengono erroneamente conteggiate come versamenti del periodo.
    const periodTxs = transactions.filter((tx) => {
      const txMonthKey = toMonthKey(tx.date);
      return txMonthKey > startMonthKey && txMonthKey <= endMonthKey;
    });

    const periodDuration = Math.max(1, endPoint.date.getTime() - startPoint.date.getTime());
    let buyAmount = 0;
    let sellAmount = 0;
    let weightedInflow = 0;

    for (const tx of periodTxs) {
      const inflow = tx.type === 'BUY' ? tx.totalAmount : -tx.totalAmount;
      if (tx.type === 'BUY') {
        buyAmount += tx.totalAmount;
      } else {
        sellAmount += tx.totalAmount;
      }

      const remainingTime = Math.max(0, endPoint.date.getTime() - tx.date.getTime());
      const weight = Math.min(1, Math.max(0, remainingTime / periodDuration));
      weightedInflow += inflow * weight;
    }

    const netInflows = Number((buyAmount - sellAmount).toFixed(2));
    const deltaValue = Number((endPoint.value - startPoint.value - netInflows).toFixed(2));

    const effectiveCapital = startPoint.value + weightedInflow;
    const denominator =
      effectiveCapital > 0 ? effectiveCapital : startPoint.value > 0 ? startPoint.value : 0;

    const deltaPercent =
      denominator > 0 ? Number(((deltaValue / denominator) * 100).toFixed(2)) : 0;

    // Se è il primo gruppo e parte dopo l'inizio teorico del periodo, evidenzia che è parziale
    let subLabel = currentGroup.subLabel;
    const expectedStartMonth =
      periodMonths === 3
        ? (currentGroup.periodIndex - 1) * 3
        : periodMonths === 6
          ? (currentGroup.periodIndex - 1) * 6
          : 0;

    const actualStartMonth = startPoint.date.getMonth();
    if (i === 0 && actualStartMonth > expectedStartMonth) {
      const fromMonth =
        MONTH_NAMES_SHORT[Math.min(actualStartMonth + 1, endPoint.date.getMonth())];
      const toMonth = MONTH_NAMES_SHORT[endPoint.date.getMonth()];
      subLabel =
        fromMonth === toMonth
          ? `${fromMonth} (Parziale)`
          : `${fromMonth} - ${toMonth} (Parziale)`;
    }

    items.push({
      id: currentGroup.key,
      label: currentGroup.label,
      subLabel,
      startDate: startPoint.date,
      endDate: endPoint.date,
      startValue: startPoint.value,
      endValue: endPoint.value,
      netInflows,
      deltaValue,
      deltaPercent,
      isPositive: deltaValue > 0.001,
      isNegative: deltaValue < -0.001,
    });
  }

  return items;
}
