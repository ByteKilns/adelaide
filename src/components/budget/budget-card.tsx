import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type Props = { categoryName: string; planned: number; actual: number };

export function BudgetCard({ categoryName, planned, actual }: Props) {
  const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
  const remaining = planned - actual;
  const status = pct >= 100 ? "Over budget" : pct >= 80 ? "Approaching limit" : "Healthy";
  const variant = pct >= 100 ? "destructive" : pct >= 80 ? "secondary" : "default";

  return (
    <div className="space-y-1 rounded border p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{categoryName}</span>
        <Badge variant={variant as "default" | "secondary" | "destructive"}>{status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        NPR {actual.toLocaleString()} / NPR {planned.toLocaleString()}
      </p>
      <Progress value={Math.min(pct, 100)} />
      <p className="text-sm text-muted-foreground">
        {remaining >= 0
          ? `NPR ${remaining.toLocaleString()} remaining`
          : `NPR ${Math.abs(remaining).toLocaleString()} over`}
      </p>
    </div>
  );
}
