import { ToneIcon } from "@/components/ToneIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryTone } from "@/modules/categories/lib/category-icons";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { getRecurringIcon } from "@/modules/recurring/lib/recurring-icons";
import { daysUntil } from "@/modules/recurring/lib/recurring-stats";

export type UpcomingItem = {
  amount: number;
  categoryGroupName: string;
  icon: string;
  id: string;
  name: string;
  nextDueDate: string;
  ownerLabel: string;
};

function dueBadgeClass(days: number) {
  if (days <= 3) return "bg-destructive/10 text-destructive";
  if (days <= 7) return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
  return "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400";
}

export function UpcomingThisMonthCard({ items }: { items: UpcomingItem[] }) {
  const sorted = [...items].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Upcoming This Month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">Nothing upcoming this month.</p>}
        {sorted.map((item) => {
          const days = daysUntil(item.nextDueDate);
          return (
            <div className="flex items-center gap-3" key={item.id}>
              <ToneIcon icon={getRecurringIcon(item.icon)} tone={getCategoryTone(item.categoryGroupName)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNPR(item.amount)} · {item.ownerLabel}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${dueBadgeClass(days)}`}>
                {days <= 0 ? "Due" : `In ${days} day${days === 1 ? "" : "s"}`}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
