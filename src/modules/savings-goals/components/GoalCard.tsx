"use client";

import { Calendar, PiggyBank, Target, User, Users } from "lucide-react";

import { RowActionsMenu } from "@/components/RowActionsMenu";
import { TONE_BADGE_CLASSES, TONE_BAR_CLASSES } from "@/components/ToneIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/date-format";
import type { DateFormat } from "@/lib/date-format-cookie";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { type MemberRole, memberTone, roleForOwner } from "@/modules/expenses/lib/member-tone";
import type { GoalStatus } from "@/modules/savings-goals/lib/savings-stats";

export type GoalCardData = {
  createdAt: Date;
  description: null | string;
  id: string;
  image: null | string;
  name: string;
  ownerMemberId: null | string;
  ownerName: null | string;
  pct: number;
  saved: number;
  status: GoalStatus;
  targetAmount: number;
  targetDate: null | string;
};

const STATUS_LABEL: Record<GoalStatus, string> = { "at-risk": "At Risk", behind: "Behind", "on-track": "On Track" };
const STATUS_BOX_CLASSES: Record<GoalStatus, string> = {
  "at-risk": "bg-destructive/10 text-destructive",
  behind: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "on-track": "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
};

function displayLabel(role: MemberRole, name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

function formatTargetDate(dateStr: string, format: DateFormat) {
  return formatDate(dateStr, format);
}

type Props = {
  dateFormat: DateFormat;
  goal: GoalCardData;
  onAddContribution: (goal: GoalCardData) => void;
  onDelete: (id: string) => void;
  onEdit: (goal: GoalCardData) => void;
  realMemberId: string;
};

export function GoalCard({ dateFormat, goal, onAddContribution, onDelete, onEdit, realMemberId }: Props) {
  const role = roleForOwner(goal.ownerMemberId, realMemberId);
  const tone = memberTone(role);

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
          {goal.image ? (
            <img alt="" className="h-full w-full object-cover" src={goal.image} />
          ) : (
            <div className={`flex h-full w-full items-center justify-center ${TONE_BADGE_CLASSES[tone]}`}>
              <Target className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{goal.name}</p>
              <span
                className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONE_BADGE_CLASSES[tone]}`}
              >
                {role === "shared" ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {displayLabel(role, goal.ownerName)}
              </span>
              {goal.description && <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{formatNPR(goal.saved)}</span>
              <span className="text-sm text-muted-foreground">{goal.pct}%</span>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${TONE_BAR_CLASSES[tone]}`} style={{ width: `${Math.min(100, goal.pct)}%` }} />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatNPR(goal.saved)} saved</span>
            <span>{formatNPR(goal.targetAmount)} target</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-44">
          <div className={`rounded-lg px-3 py-2 text-xs ${STATUS_BOX_CLASSES[goal.status]}`}>
            <p className="flex items-center gap-1 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              {goal.targetDate ? formatTargetDate(goal.targetDate, dateFormat) : "No target date"}
            </p>
            <p className="mt-0.5">{STATUS_LABEL[goal.status]}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="flex-1" onClick={() => onAddContribution(goal)} size="sm" type="button">
              <PiggyBank className="h-3.5 w-3.5" />
              Add money
            </Button>
            <RowActionsMenu>
              <DropdownMenuItem onClick={() => onEdit(goal)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(goal.id)} variant="destructive">
                Delete
              </DropdownMenuItem>
            </RowActionsMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
