"use client";

import { useState } from "react";

import { DataTable } from "@/components/DataTable";
import { TabSwitcher } from "@/components/TabSwitcher";
import { type ExpenseRow, useExpenseTableColumns } from "@/modules/expenses/hooks/useExpenseTableColumns";

type Props = {
  partnerName: string | null;
  realMemberId: string;
  rows: ExpenseRow[];
};

type Tab = "all" | "me" | "partner" | "shared";

export function ExpenseTable({ partnerName, realMemberId, rows }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const columns = useExpenseTableColumns(realMemberId);

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    if (tab === "me") return r.ownerMemberId === realMemberId;
    if (tab === "shared") return r.ownerMemberId === null;
    return r.ownerMemberId !== null && r.ownerMemberId !== realMemberId;
  });

  return (
    <div className="space-y-3">
      <TabSwitcher
        className="w-full"
        onValueChange={(v) => setTab(v as Tab)}
        tabs={[
          { label: "All", value: "all" },
          { label: "Me", value: "me" },
          ...(partnerName ? [{ label: partnerName, value: "partner" }] : []),
          { label: "Shared", value: "shared" },
        ]}
        value={tab}
      />

      <DataTable columns={columns} emptyMessage="No expenses in this view." rowKey={(r) => r.id} rows={filtered} />

      <p className="text-sm text-muted-foreground">
        Showing all {filtered.length} expense{filtered.length === 1 ? "" : "s"} this month.
      </p>
    </div>
  );
}
