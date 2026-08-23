"use client";

import { useState } from "react";

import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { type ExpenseRow, useExpenseTableColumns } from "@/modules/expenses/hooks/useExpenseTableColumns";

const PAGE_SIZE = 10;

export function TransactionsTable({ realMemberId, rows }: { realMemberId: string; rows: ExpenseRow[] }) {
  const [page, setPage] = useState(1);
  const columns = useExpenseTableColumns(realMemberId);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Recent Transactions</h2>
          <p className="text-sm text-muted-foreground">Your latest activity across all accounts</p>
        </div>
        <Link className="flex items-center gap-1 text-sm font-medium text-primary" href="/expenses">
          View all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <DataTable columns={columns} emptyMessage="No transactions in this range." rowKey={(r) => r.id} rows={pageRows} />

      {rows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length}{" "}
            expenses
          </p>
          <div className="flex items-center gap-1">
            <Button disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)} size="icon" type="button" variant="outline">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">
              {currentPage} / {pageCount}
            </span>
            <Button
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
