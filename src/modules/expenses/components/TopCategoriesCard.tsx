import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon, getCategoryTone } from "@/modules/categories/lib/category-icons";
import { TONE_BAR_CLASSES, ToneIcon } from "@/modules/dashboard/components/ToneIcon";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { TopCategory } from "@/modules/expenses/lib/expense-breakdown";

type Props = {
  categories: (TopCategory & { groupName: string })[];
};

export function TopCategoriesCard({ categories }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Top Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No expenses this month yet.</p>
        )}
        {categories.map((c) => {
          const tone = getCategoryTone(c.groupName);
          return (
            <div className="space-y-1.5" key={c.categoryId}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <ToneIcon className="h-6 w-6" icon={getCategoryIcon(c.groupName)} tone={tone} />
                  {c.name}
                </span>
                <span className="text-sm text-muted-foreground">{formatNPR(c.amount)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${TONE_BAR_CLASSES[tone]}`} style={{ width: `${c.barPct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
