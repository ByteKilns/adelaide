"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { DataTable } from "@/components/DataTable";
import type { DateFormat } from "@/lib/date-format-cookie";
import { type ExpenseRow, useExpenseTableColumns } from "@/modules/expenses/hooks/useExpenseTableColumns";

type Props = { dateFormat: DateFormat; realMemberId: string; rows: ExpenseRow[] };

export function TransactionsTable({ dateFormat, realMemberId, rows }: Props) {
  const columns = useExpenseTableColumns(realMemberId, dateFormat);

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

      <DataTable
        columns={columns}
        emptyMessage="No transactions in this range."
        itemLabel="expenses"
        rowKey={(r) => r.id}
        rows={rows}
      />
    </div>
  );
}
