"use client";

import { useState, useTransition } from "react";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { TabSwitcher } from "@/components/TabSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { deleteExpenseAction } from "@/modules/expenses/api/expenses.actions";
import { OwnerAvatar } from "@/modules/expenses/components/OwnerAvatar";
import { type MemberRole, roleForOwner } from "@/modules/expenses/lib/member-tone";

export type ExpenseRow = {
  amount: number;
  categoryGroupName: string;
  categoryName: string;
  date: string;
  id: string;
  note: string | null;
  ownerMemberId: string | null;
  ownerName: string | null;
  paidByMemberId: string;
  paidByName: string;
};

type Props = {
  partnerName: string | null;
  realMemberId: string;
  rows: ExpenseRow[];
};

type Tab = "all" | "me" | "partner" | "shared";

function displayLabel(role: MemberRole, name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

export function ExpenseTable({ partnerName, realMemberId, rows }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [pendingId, setPendingId] = useState<null | string>(null);
  const [, startTransition] = useTransition();

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    if (tab === "me") return r.ownerMemberId === realMemberId;
    if (tab === "shared") return r.ownerMemberId === null;
    return r.ownerMemberId !== null && r.ownerMemberId !== realMemberId;
  });

  function handleDelete(id: string) {
    if (!window.confirm("Delete this expense?")) return;
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteExpenseAction(id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setPendingId(null);
      }
    });
  }

  const columns: DataTableColumn<ExpenseRow>[] = [
    { header: "Date", key: "date", render: (r) => r.date },
    {
      className: "whitespace-normal",
      header: "Category",
      key: "category",
      render: (r) => (
        <>
          <p className="font-medium">{r.categoryName}</p>
          {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
        </>
      ),
    },
    {
      header: "Owner",
      key: "owner",
      render: (r) => {
        const role = roleForOwner(r.ownerMemberId, realMemberId);
        return (
          <div className="flex items-center gap-2">
            <OwnerAvatar name={r.ownerName ?? ""} role={role} />
            <span>{displayLabel(role, r.ownerName)}</span>
          </div>
        );
      },
    },
    {
      header: "Paid by",
      key: "paidBy",
      render: (r) => {
        const role: MemberRole = r.paidByMemberId === realMemberId ? "me" : "partner";
        return (
          <div className="flex items-center gap-2">
            <OwnerAvatar name={r.paidByName} role={role} />
            <span>{role === "me" ? "Me" : r.paidByName}</span>
          </div>
        );
      },
    },
    {
      align: "right",
      className: "font-semibold",
      header: "Amount",
      key: "amount",
      render: (r) => `-${formatNPR(r.amount)}`,
    },
    {
      align: "right",
      header: "",
      key: "actions",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md p-1 text-muted-foreground hover:bg-accent" type="button">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/expenses/${r.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={pendingId === r.id} onClick={() => handleDelete(r.id)} variant="destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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

      <DataTable
        columns={columns}
        emptyMessage="No expenses in this view."
        rowKey={(r) => r.id}
        rows={filtered}
      />

      <p className="text-sm text-muted-foreground">
        Showing all {filtered.length} expense{filtered.length === 1 ? "" : "s"} this month.
      </p>
    </div>
  );
}
