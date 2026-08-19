import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopBudgetCategory } from "@/modules/budget/lib/budget-groups";
import { formatNPR } from "@/modules/dashboard/lib/format";

export function TopBudgetCategoriesCard({ categories }: { categories: TopBudgetCategory[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Top Budget Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 && <p className="text-sm text-muted-foreground">No budget set yet.</p>}
        {categories.map((c) => (
          <div className="space-y-1.5" key={c.categoryId}>
            <div className="flex items-center justify-between text-sm">
              <span>{c.name}</span>
              <span className="text-muted-foreground">
                {formatNPR(c.actual)} / {formatNPR(c.planned)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${c.pct >= 100 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min(c.pct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{c.pct}%</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
