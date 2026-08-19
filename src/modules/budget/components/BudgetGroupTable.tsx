"use client";

import { useState } from "react";

import { ChevronDown, Users } from "lucide-react";

import { ToneIcon } from "@/components/ToneIcon";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BudgetGroup } from "@/modules/budget/lib/budget-groups";
import { computeBudgetStatus } from "@/modules/budget/lib/budget-status";
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
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const status = computeBudgetStatus(r.planned, r.actual);
                return (
                  <TableRow key={r.categoryId}>
                    <TableCell>{r.categoryName}</TableCell>
                    <TableCell>
                      <Badge variant={r.budgetType === "fixed" ? "secondary" : "outline"}>
                        {r.budgetType === "fixed" ? "Fixed" : "Flexible"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNPR(r.planned)}</TableCell>
                    <TableCell className="text-right">{formatNPR(r.actual)}</TableCell>
                    <TableCell className="text-right">{formatNPR(r.planned - r.actual)}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
