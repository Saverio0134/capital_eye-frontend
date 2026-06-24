export function getMonthNames(
  date: Date,
  locale: string = 'it-IT',
  format: 'long' | 'short' = 'long'
): string {
  return new Intl.DateTimeFormat(locale, { month: format }).format(new Date(date));
}
export function getLastNMonths(n: number, formated: boolean = true): (Date | string)[] {
  const now = new Date();

  return Array.from({ length: n }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return formated ? getMonthNames(d) : d;
  });
}
