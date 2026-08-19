"use client";

import { useState } from "react";

import { ChevronDown, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { BudgetGroup } from "@/modules/budget/lib/budget-groups";
import { computeBudgetStatus } from "@/modules/budget/lib/budget-status";
import { ToneIcon } from "@/modules/dashboard/components/ToneIcon";
import { formatNPR } from "@/modules/dashboard/lib/format";

const VISIBLE_ROWS = 4;

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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 font-normal">Category</th>
                <th className="py-2 font-normal">Type</th>
                <th className="py-2 text-right font-normal">Budget</th>
                <th className="py-2 text-right font-normal">Spent</th>
                <th className="py-2 text-right font-normal">Remaining</th>
                <th className="py-2 font-normal">Progress</th>
                <th className="py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = computeBudgetStatus(r.planned, r.actual);
                return (
                  <tr className="border-b last:border-0" key={r.categoryId}>
                    <td className="py-2 pr-2">{r.categoryName}</td>
                    <td className="py-2 pr-2">
                      <Badge variant={r.budgetType === "fixed" ? "secondary" : "outline"}>
                        {r.budgetType === "fixed" ? "Fixed" : "Flexible"}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">{formatNPR(r.planned)}</td>
                    <td className="py-2 text-right">{formatNPR(r.actual)}</td>
                    <td className="py-2 text-right">{formatNPR(r.planned - r.actual)}</td>
                    <td className="py-2 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              status.variant === "destructive"
                                ? "bg-destructive"
                                : status.variant === "secondary"
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(status.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{status.pct}%</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
