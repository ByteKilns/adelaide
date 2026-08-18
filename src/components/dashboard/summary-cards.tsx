import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Receipt, PiggyBank, Coins, ArrowUp, ArrowDown } from "lucide-react";

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

export function SummaryCards({
  combinedIncome,
  totalExpenses,
  unallocated,
  incomeTrendPct,
  expenseTrendPct,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Combined Income
          </CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">NPR {combinedIncome.toLocaleString()}</p>
          <TrendLine pct={incomeTrendPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total Expenses
          </CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">NPR {totalExpenses.toLocaleString()}</p>
          <TrendLine pct={expenseTrendPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total Savings
          </CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
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
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">NPR {unallocated.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
