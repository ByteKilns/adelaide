"use client";

import { Target } from "lucide-react";

import type { DataTableColumn } from "@/components/DataTable";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { TONE_BAR_CLASSES } from "@/components/ToneIcon";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { type MemberRole, memberTone, roleForOwner } from "@/modules/expenses/lib/member-tone";
import type { GoalCardData } from "@/modules/savings-goals/components/GoalCard";

function displayLabel(role: MemberRole, name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

export function useGoalTableColumns(
  realMemberId: string,
  onAddContribution: (goal: GoalCardData) => void,
  onEdit: (goal: GoalCardData) => void,
  onDelete: (id: string) => void,
): DataTableColumn<GoalCardData>[] {
  return [
    {
      className: "whitespace-normal",
      header: "Goal",
      key: "goal",
      render: (g) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
            {g.image ? (
              <img alt="" className="h-full w-full object-cover" src={g.image} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Target className="h-4 w-4" />
              </div>
            )}
          </div>
          <p className="font-medium">{g.name}</p>
        </div>
      ),
    },
    {
      header: "Owner",
      key: "owner",
      render: (g) => displayLabel(roleForOwner(g.ownerMemberId, realMemberId), g.ownerName),
    },
    {
      className: "min-w-40",
      header: "Progress",
      key: "progress",
      render: (g) => {
        const tone = memberTone(roleForOwner(g.ownerMemberId, realMemberId));
        return (
          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${TONE_BAR_CLASSES[tone]}`} style={{ width: `${Math.min(100, g.pct)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{g.pct}%</p>
          </div>
        );
      },
    },
    {
      align: "right",
      header: "Saved / Target",
      key: "amounts",
      render: (g) => (
        <span>
          {formatNPR(g.saved)} <span className="text-muted-foreground">/ {formatNPR(g.targetAmount)}</span>
        </span>
      ),
    },
    {
      align: "right",
      header: "",
      key: "actions",
      render: (g) => (
        <RowActionsMenu>
          <DropdownMenuItem onClick={() => onAddContribution(g)}>Add money</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(g)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(g.id)} variant="destructive">
            Delete
          </DropdownMenuItem>
        </RowActionsMenu>
      ),
    },
  ];
}
