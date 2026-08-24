import Link from "next/link";

import { ToneIcon } from "@/components/ToneIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DateFormat } from "@/lib/date-format-cookie";
import { formatRelativeDate } from "@/lib/format-date";
import { getCategoryIcon, getCategoryTone } from "@/modules/categories/lib/category-icons";

type Row = {
  amount: number;
  categoryGroupName: string;
  categoryName: string;
  date: string;
  id: string;
  ownerLabel: string;
};

export function RecentExpenses({ dateFormat, rows }: { dateFormat: DateFormat; rows: Row[] }) {
  return (
    <Card className="border-0 bg-surface-secondary shadow-[0_2px_12px_rgba(102,45,145,0.06)] ring-0">
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Recent Expenses</CardTitle>
        <Link className="text-sm text-primary underline" href="/expenses">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No expenses yet.</p>
        )}
        {rows.map((r) => {
          return (
            <div className="flex items-center justify-between" key={r.id}>
              <div className="flex items-center gap-3">
                <ToneIcon
                  className="h-8 w-8"
                  icon={getCategoryIcon(r.categoryGroupName)}
                  tone={getCategoryTone(r.categoryGroupName)}
                />
                <div>
                  <p className="text-sm font-medium">{r.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.ownerLabel} · {formatRelativeDate(r.date, dateFormat)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold">-NPR {r.amount.toLocaleString()}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
