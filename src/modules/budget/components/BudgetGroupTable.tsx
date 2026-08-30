"use client";

import { useState } from "react";

import { ChevronDown, Users } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { ToneIcon } from "@/components/ToneIcon";
import { Badge } from "@/components/ui/badge";
import type { BudgetGroup, BudgetRow } from "@/modules/budget/lib/budget-groups";
import { computeBudgetStatus } from "@/modules/budget/lib/budget-status";
import { formatNPR } from "@/modules/dashboard/lib/format";

const VISIBLE_ROWS = 4;

const COLUMNS: DataTableColumn<BudgetRow>[] = [
  { header: "Category", key: "category", render: (r) => r.categoryName },
  {
    header: "Type",
    key: "type",
    render: (r) => (
      <Badge variant={r.budgetType === "fixed" ? "secondary" : "outline"}>
        {r.budgetType === "fixed" ? "Fixed" : "Flexible"}
      </Badge>
    ),
  },
  { align: "right", header: "Budget", key: "planned", render: (r) => formatNPR(r.planned) },
  { align: "right", header: "Spent", key: "actual", render: (r) => formatNPR(r.actual) },
  { align: "right", header: "Remaining", key: "remaining", render: (r) => formatNPR(r.planned - r.actual) },
  {
    header: "Progress",
    key: "progress",
    render: (r) => {
      const status = computeBudgetStatus(r.planned, r.actual);
      return (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${
                status.variant === "destructive"
                  ? "bg-destructive"
                  : status.variant === "secondary"
                    ? "bg-amber-500"
                    : status.variant === "outline"
                      ? "bg-muted-foreground"
                      : "bg-green-500"
              }`}
              style={{ width: `${Math.min(status.pct, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{status.variant === "outline" ? "—" : `${status.pct}%`}</span>
        </div>
      );
    },
  },
  {
    header: "Status",
    key: "status",
    render: (r) => {
      const status = computeBudgetStatus(r.planned, r.actual);
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
  },
];

export function BudgetGroupTable({ group }: { group: BudgetGroup }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? group.rows : group.rows.slice(0, VISIBLE_ROWS);
  const hasMore = group.rows.length > VISIBLE_ROWS;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ToneIcon icon={Users} tone={group.tone} />
          <h2 className="text-base font-semibold">{group.label}</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatNPR(group.totalActual)} / {formatNPR(group.totalPlanned)}
        </span>
      </div>

      {group.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No budget set for this group yet.</p>
      ) : (
        <DataTable columns={COLUMNS} containerClassName="rounded-xl" paginate={false} rowKey={(r) => r.categoryId} rows={rows} />
      )}

      {hasMore && (
        <button
          className="mt-2 flex items-center gap-1 text-sm text-primary underline"
          onClick={() => setExpanded((v) => !v)}
          type="button"
        >
          View all ({group.rows.length})
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
