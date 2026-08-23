// Shared by every page that supports "?year=&month=" URL-based month
// navigation (Budget, Dashboard) so the parsing/adjacent-month logic can't
// drift between them.
export function previousMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function nextMonth(year: number, month: number) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function parseMonthParam(value: string | string[] | undefined, fallback: number, max: number) {
  const num = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(num) && num >= 1 && num <= max ? num : fallback;
}
