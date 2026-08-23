import { TONE_BAR_CLASSES } from "@/components/ToneIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { CategoryGroupTotal } from "@/modules/recurring/lib/recurring-stats";

export function ByCategoryCard({ totals }: { totals: CategoryGroupTotal[] }) {
  const max = Math.max(1, ...totals.map((t) => t.amount));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          By Category <span className="font-normal text-muted-foreground">(Monthly Total)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {totals.length === 0 && <p className="text-sm text-muted-foreground">No active recurring expenses yet.</p>}
        {totals.map((t) => (
          <div className="space-y-1" key={t.groupName}>
            <div className="flex items-center justify-between text-sm">
              <span>{t.groupName}</span>
              <span className="font-medium">{formatNPR(t.amount)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${TONE_BAR_CLASSES[t.tone]}`}
                style={{ width: `${Math.max(4, Math.round((t.amount / max) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
