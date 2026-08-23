"use client";

import { useState, useTransition } from "react";

import { Repeat } from "lucide-react";
import { toast } from "sonner";

import type { DataTableColumn } from "@/components/DataTable";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { ToneIcon } from "@/components/ToneIcon";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { getCategoryTone } from "@/modules/categories/lib/category-icons";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { OwnerAvatar } from "@/modules/expenses/components/OwnerAvatar";
import { type MemberRole, roleForOwner } from "@/modules/expenses/lib/member-tone";
import {
  completeRecurringExpenseAction,
  deleteRecurringExpenseAction,
  markRecurringExpensePaidAction,
  pauseRecurringExpenseAction,
  resumeRecurringExpenseAction,
} from "@/modules/recurring/api/recurring.actions";
import { getRecurringIcon } from "@/modules/recurring/lib/recurring-icons";
import { daysUntil, formatDueDate } from "@/modules/recurring/lib/recurring-stats";

export type RecurringRow = {
  amount: number;
  categoryGroupName: string;
  categoryName: string;
  frequency: "monthly" | "yearly";
  icon: string;
  id: string;
  name: string;
  nextDueDate: string;
  ownerMemberId: null | string;
  ownerName: string | null;
  paidThisMonth: boolean;
  status: "active" | "completed" | "paused";
  vendor: null | string;
};

const STATUS_LABEL: Record<RecurringRow["status"], string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
};

const STATUS_VARIANT: Record<RecurringRow["status"], "default" | "outline" | "secondary"> = {
  active: "default",
  completed: "secondary",
  paused: "outline",
};

function displayLabel(role: MemberRole, name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

export function useRecurringTableColumns(
  realMemberId: string,
  onEdit: (row: RecurringRow) => void,
): DataTableColumn<RecurringRow>[] {
  const [pendingId, setPendingId] = useState<null | string>(null);
  const [, startTransition] = useTransition();

  function run(id: string, action: () => Promise<void>, successMessage: string, errorMessage: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : errorMessage);
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this recurring expense? Expenses it already generated are kept.")) return;
    run(id, () => deleteRecurringExpenseAction(id), "Recurring expense deleted", "Failed to delete");
  }

  return [
    {
      className: "whitespace-normal",
      header: "Item",
      key: "item",
      render: (r) => (
        <div className="flex items-center gap-3">
          <ToneIcon icon={getRecurringIcon(r.icon)} tone={getCategoryTone(r.categoryGroupName)} />
          <div>
            <p className="font-medium">{r.name}</p>
            {r.vendor && <p className="text-xs text-muted-foreground">{r.vendor}</p>}
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      key: "category",
      render: (r) => <Badge variant="outline">{r.categoryName}</Badge>,
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
      header: "Frequency",
      key: "frequency",
      render: (r) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Repeat className="h-3.5 w-3.5" />
          {r.frequency === "monthly" ? "Monthly" : "Yearly"}
        </span>
      ),
    },
    {
      align: "right",
      className: "font-semibold",
      header: "Amount",
      key: "amount",
      render: (r) => formatNPR(r.amount),
    },
    {
      header: "Next Due",
      key: "nextDue",
      render: (r) => {
        const days = daysUntil(r.nextDueDate);
        return (
          <span className={days <= 3 ? "font-medium text-destructive" : days <= 7 ? "font-medium text-amber-600" : ""}>
            {formatDueDate(r.nextDueDate)}
          </span>
        );
      },
    },
    {
      header: "Status",
      key: "status",
      render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
    },
    {
      align: "right",
      header: "",
      key: "actions",
      render: (r) => (
        <RowActionsMenu>
          {r.status === "active" && !r.paidThisMonth && (
            <DropdownMenuItem
              disabled={pendingId === r.id}
              onClick={() =>
                run(r.id, () => markRecurringExpensePaidAction(r.id), "Marked as paid", "Failed to mark as paid")
              }
            >
              Mark paid
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onEdit(r)}>Edit</DropdownMenuItem>
          {r.status === "active" && (
            <DropdownMenuItem
              disabled={pendingId === r.id}
              onClick={() => run(r.id, () => pauseRecurringExpenseAction(r.id), "Paused", "Failed to pause")}
            >
              Pause
            </DropdownMenuItem>
          )}
          {r.status === "paused" && (
            <DropdownMenuItem
              disabled={pendingId === r.id}
              onClick={() => run(r.id, () => resumeRecurringExpenseAction(r.id), "Resumed", "Failed to resume")}
            >
              Resume
            </DropdownMenuItem>
          )}
          {r.status !== "completed" && (
            <DropdownMenuItem
              disabled={pendingId === r.id}
              onClick={() =>
                run(r.id, () => completeRecurringExpenseAction(r.id), "Marked completed", "Failed to update")
              }
            >
              Mark completed
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={pendingId === r.id} onClick={() => handleDelete(r.id)} variant="destructive">
            Delete
          </DropdownMenuItem>
        </RowActionsMenu>
      ),
    },
  ];
}
