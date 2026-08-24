"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { toast } from "sonner";

import type { DataTableColumn } from "@/components/DataTable";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatShortDate } from "@/lib/date-format";
import type { DateFormat } from "@/lib/date-format-cookie";
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

function displayLabel(role: MemberRole, name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

export function useExpenseTableColumns(realMemberId: string, dateFormat: DateFormat): DataTableColumn<ExpenseRow>[] {
  const [pendingId, setPendingId] = useState<null | string>(null);
  const [, startTransition] = useTransition();

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

  return [
    { header: "Date", key: "date", render: (r) => formatShortDate(r.date, dateFormat) },
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
        <RowActionsMenu>
          <DropdownMenuItem asChild>
            <Link href={`/expenses/${r.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pendingId === r.id} onClick={() => handleDelete(r.id)} variant="destructive">
            Delete
          </DropdownMenuItem>
        </RowActionsMenu>
      ),
    },
  ];
}
