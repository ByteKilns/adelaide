import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeBudgetStatus } from "@/modules/budget/lib/budget-status";

// `categoryId` is combined with `ownerMemberId` (defaulting to "shared" when
// null) to form the React key below. A category can have more than one
// budget-item row per month — one per owner (e.g. "Groceries" owned by each
// member plus a separate shared "Groceries" line), all sharing the same
// categoryName — so categoryName alone is not a unique key here.
type Row = {
  actual: number;
  categoryId: string;
  categoryName: string;
  difference: number;
  ownerMemberId: string | null;
  planned: number;
};

export function BudgetVsActualTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Difference</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const status = computeBudgetStatus(r.planned, r.actual);
            return (
              <TableRow key={`${r.categoryId}-${r.ownerMemberId ?? "shared"}`}>
                <TableCell>{r.categoryName}</TableCell>
                <TableCell className="text-right">{r.planned.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.actual.toLocaleString()}</TableCell>
                <TableCell
                  className={`text-right ${r.difference < 0 ? "text-red-600" : "text-green-700"}`}
                >
                  {r.difference >= 0 ? "+" : ""}
                  {r.difference.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
