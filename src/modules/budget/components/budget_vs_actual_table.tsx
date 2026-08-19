import { Badge } from "@/components/ui/badge";
import { computeBudgetStatus } from "@/modules/budget/lib/budget-status";

// `categoryId` is combined with `ownerMemberId` (defaulting to "shared" when
// null) to form the React key below. A category can have more than one
// budget-item row per month — one per owner (e.g. "Groceries" owned by each
// member plus a separate shared "Groceries" line), all sharing the same
// categoryName — so categoryName alone is not a unique key here.
type Row = {
  categoryId: string;
  ownerMemberId: string | null;
  categoryName: string;
  planned: number;
  actual: number;
  difference: number;
};

export function BudgetVsActualTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2">Category</th>
            <th className="py-2 text-right">Budget</th>
            <th className="py-2 text-right">Actual</th>
            <th className="py-2 text-right">Difference</th>
            <th className="py-2 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = computeBudgetStatus(r.planned, r.actual);
            return (
              <tr key={`${r.categoryId}-${r.ownerMemberId ?? "shared"}`} className="border-b">
                <td className="py-2">{r.categoryName}</td>
                <td className="py-2 text-right">{r.planned.toLocaleString()}</td>
                <td className="py-2 text-right">{r.actual.toLocaleString()}</td>
                <td
                  className={`py-2 text-right ${r.difference < 0 ? "text-red-600" : "text-green-700"}`}
                >
                  {r.difference >= 0 ? "+" : ""}
                  {r.difference.toLocaleString()}
                </td>
                <td className="py-2 text-right">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
