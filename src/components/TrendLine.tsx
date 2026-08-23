import { ArrowDown, ArrowUp } from "lucide-react";

// "+12% vs last month" / "-8% vs last month" — used anywhere a figure is
// compared against its value in the previous month.
export function TrendLine({ pct, suffix = "vs last month" }: { pct: null | number; suffix?: string }) {
  if (pct === null) return null;
  const Icon = pct >= 0 ? ArrowUp : ArrowDown;
  const colorClass = pct >= 0 ? "text-green-600" : "text-red-600";
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}% {suffix}
    </p>
  );
}
