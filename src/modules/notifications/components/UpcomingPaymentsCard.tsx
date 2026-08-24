import { CreditCard } from "lucide-react";
import Link from "next/link";

import { ToneIcon } from "@/components/ToneIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DateFormat } from "@/lib/date-format-cookie";
import { getCategoryTone } from "@/modules/categories/lib/category-icons";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { formatDueDate } from "@/modules/recurring/lib/recurring-stats";

export type UpcomingPayment = { amount: number; categoryGroupName: string; id: string; name: string; nextDueDate: string; ownerLabel: string };

export function UpcomingPaymentsCard({ dateFormat, items }: { dateFormat: DateFormat; items: UpcomingPayment[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Upcoming Payments</CardTitle>
        <span className="text-xs text-muted-foreground">Next 7 days</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing due in the next 7 days.</p>}
        {items.map((item) => (
          <div className="flex items-center gap-3" key={item.id}>
            <ToneIcon icon={CreditCard} tone={getCategoryTone(item.categoryGroupName)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatNPR(item.amount)} · {item.ownerLabel}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">{formatDueDate(item.nextDueDate, dateFormat)}</span>
          </div>
        ))}
        <Link className="flex items-center justify-center gap-1 pt-1 text-sm font-medium text-primary" href="/recurring">
          View all upcoming
        </Link>
      </CardContent>
    </Card>
  );
}
