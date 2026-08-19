import { TONE_BAR_CLASSES, ToneIcon } from "@/components/ToneIcon";
import { Badge } from "@/components/ui/badge";
import { computeBudgetStatus } from "@/modules/budget/lib/budget-status";
import { getCategoryIcon, getCategoryTone } from "@/modules/categories/lib/category-icons";

type Props = {
  actual: number;
  categoryGroupName: string;
  categoryName: string;
  ownerLabel: string;
  planned: number;
};

export function BudgetCard({
  categoryName,
  categoryGroupName,
  ownerLabel,
  planned,
  actual,
}: Props) {
  const status = computeBudgetStatus(planned, actual);
  const remaining = planned - actual;
  const tone = getCategoryTone(categoryGroupName);

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ToneIcon icon={getCategoryIcon(categoryGroupName)} tone={tone} />
          <div>
            <p className="font-medium leading-tight">{categoryName}</p>
            <p className="text-xs text-muted-foreground">{ownerLabel}</p>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        NPR {actual.toLocaleString()} / NPR {planned.toLocaleString()}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${TONE_BAR_CLASSES[tone]}`}
          style={{ width: `${Math.min(status.pct, 100)}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {remaining >= 0
          ? `NPR ${remaining.toLocaleString()} remaining`
          : `NPR ${Math.abs(remaining).toLocaleString()} over`}
      </p>
    </div>
  );
}
