"use client";

import { HandCoins } from "lucide-react";

import type { DataTableColumn } from "@/components/DataTable";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { TONE_BADGE_CLASSES, TONE_BAR_CLASSES } from "@/components/ToneIcon";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { type MemberRole, memberTone, roleForOwner } from "@/modules/expenses/lib/member-tone";
import type { LoanCardData } from "@/modules/loans/lib/loan-stats";

function displayLabel(role: MemberRole, name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

export function useLoanTableColumns(
  realMemberId: string,
  onAddPayment: (loan: LoanCardData) => void,
  onEdit: (loan: LoanCardData) => void,
  onDelete: (id: string) => void,
): DataTableColumn<LoanCardData>[] {
  return [
    {
      className: "whitespace-normal",
      header: "Counterparty",
      key: "counterparty",
      render: (l) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_BADGE_CLASSES[l.direction === "given" ? "blue" : "amber"]}`}
          >
            <HandCoins className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{l.counterpartyName}</p>
            <p className="text-xs text-muted-foreground">{l.direction === "given" ? "Lent" : "Borrowed"}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Owner",
      key: "owner",
      render: (l) => displayLabel(roleForOwner(l.ownerMemberId, realMemberId), l.ownerName),
    },
    {
      className: "min-w-40",
      header: "Progress",
      key: "progress",
      render: (l) => {
        const tone = memberTone(roleForOwner(l.ownerMemberId, realMemberId));
        return (
          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${TONE_BAR_CLASSES[tone]}`} style={{ width: `${Math.min(100, l.pct)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{l.pct}% paid</p>
          </div>
        );
      },
    },
    {
      align: "right",
      header: "Outstanding / Principal",
      key: "amounts",
      render: (l) => (
        <span>
          {formatNPR(l.outstanding)} <span className="text-muted-foreground">/ {formatNPR(l.principalAmount)}</span>
        </span>
      ),
    },
    {
      align: "right",
      header: "",
      key: "actions",
      render: (l) => (
        <RowActionsMenu>
          <DropdownMenuItem disabled={l.status === "settled"} onClick={() => onAddPayment(l)}>
            Add payment
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(l)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(l.id)} variant="destructive">
            Delete
          </DropdownMenuItem>
        </RowActionsMenu>
      ),
    },
  ];
}
