import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
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

const COLUMNS: DataTableColumn<Row>[] = [
  { header: "Category", key: "category", render: (r) => r.categoryName },
  { align: "right", header: "Budget", key: "planned", render: (r) => r.planned.toLocaleString() },
  { align: "right", header: "Actual", key: "actual", render: (r) => r.actual.toLocaleString() },
  {
    align: "right",
    header: "Difference",
    key: "difference",
    render: (r) => (
      <span className={r.difference < 0 ? "text-red-600" : "text-green-700"}>
        {r.difference >= 0 ? "+" : ""}
        {r.difference.toLocaleString()}
      </span>
    ),
  },
  {
    align: "right",
    header: "Status",
    key: "status",
    render: (r) => {
      const status = computeBudgetStatus(r.planned, r.actual);
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
  },
];

export function BudgetVsActualTable({ rows }: { rows: Row[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      containerClassName="rounded-xl"
      rowKey={(r) => `${r.categoryId}-${r.ownerMemberId ?? "shared"}`}
      rows={rows}
    />
  );
}
