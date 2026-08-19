import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Receipt, PiggyBank, CreditCard, ArrowUp, ArrowDown } from "lucide-react";

type Props = {
  combinedIncome: number;
  totalExpenses: number;
  unallocated: number;
  incomeTrendPct: number | null;
  expenseTrendPct: number | null;
};

function TrendLine({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const Icon = pct >= 0 ? ArrowUp : ArrowDown;
  const colorClass = pct >= 0 ? "text-green-600" : "text-red-600";
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}% vs last month
    </p>
  );
}

function pctOfIncome(value: number, combinedIncome: number): number | null {
  if (combinedIncome <= 0) return null;
  return Math.round((value / combinedIncome) * 100);
}

export function SummaryCards({
  combinedIncome,
  totalExpenses,
  unallocated,
  incomeTrendPct,
  expenseTrendPct,
}: Props) {
  const expensePct = pctOfIncome(totalExpenses, combinedIncome);
  const unallocatedPct = pctOfIncome(unallocated, combinedIncome);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Combined Income
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
            <Banknote className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">NPR {combinedIncome.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">This month</p>
          <TrendLine pct={incomeTrendPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total Expenses
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400">
            <Receipt className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">NPR {totalExpenses.toLocaleString()}</p>
          {expensePct !== null && (
            <>
              <p className="mt-1 text-xs text-muted-foreground">{expensePct}% of income</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{ width: `${Math.min(expensePct, 100)}%` }}
                />
              </div>
            </>
          )}
          <TrendLine pct={expenseTrendPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total Savings
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PiggyBank className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Unallocated
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <CreditCard className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">NPR {unallocated.toLocaleString()}</p>
          {unallocatedPct !== null && (
            <p className="mt-1 text-xs text-muted-foreground">{unallocatedPct}% of income</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
