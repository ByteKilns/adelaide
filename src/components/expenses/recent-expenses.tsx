import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatRelativeDate } from "@/lib/format-date";

type Row = {
  id: string;
  categoryName: string;
  categoryGroupName: string;
  ownerLabel: string;
  amount: number;
  date: string;
};

export function RecentExpenses({ rows }: { rows: Row[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Recent Expenses</CardTitle>
        <Link href="/expenses" className="text-sm text-primary underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No expenses yet.</p>
        )}
        {rows.map((r) => {
          const Icon = getCategoryIcon(r.categoryGroupName);
          return (
            <div key={r.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{r.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.ownerLabel} · {formatRelativeDate(r.date)}
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
