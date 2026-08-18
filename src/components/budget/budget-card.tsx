import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { computeBudgetStatus } from "@/lib/budget-status";
import type { LucideIcon } from "lucide-react";

type Props = { categoryName: string; planned: number; actual: number; icon: LucideIcon };

export function BudgetCard({ categoryName, planned, actual, icon: Icon }: Props) {
  const status = computeBudgetStatus(planned, actual);
  const remaining = planned - actual;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {categoryName}
        </span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        NPR {actual.toLocaleString()} / NPR {planned.toLocaleString()}
      </p>
      <Progress value={Math.min(status.pct, 100)} />
      <p className="text-sm text-muted-foreground">
        {remaining >= 0
          ? `NPR ${remaining.toLocaleString()} remaining`
          : `NPR ${Math.abs(remaining).toLocaleString()} over`}
      </p>
    </div>
  );
}
