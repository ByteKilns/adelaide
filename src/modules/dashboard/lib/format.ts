export function formatNPR(value: number) {
  return `NPR ${value.toLocaleString()}`;
}

export function pctOfIncome(value: number, combinedIncome: number): number | null {
  if (combinedIncome <= 0) return null;
  return Math.round((value / combinedIncome) * 100);
}
