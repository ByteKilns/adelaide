"use client";

import { Calendar, User, Users } from "lucide-react";

import { RowActionsMenu } from "@/components/RowActionsMenu";
import { TONE_BADGE_CLASSES, TONE_BAR_CLASSES } from "@/components/ToneIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/date-format";
import type { DateFormat } from "@/lib/date-format-cookie";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { DhukuCardData } from "@/modules/dhuku/lib/dhuku-stats";
import { type MemberRole, memberTone, roleForOwner } from "@/modules/expenses/lib/member-tone";

const STATUS_LABEL = { active: "Active", completed: "Completed" } as const;
const STATUS_BOX_CLASSES = {
  active: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
} as const;

function displayLabel(role: MemberRole, name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

type Props = {
  dateFormat: DateFormat;
  dhuku: DhukuCardData;
  onAddEntry: (dhuku: DhukuCardData) => void;
  onDelete: (id: string) => void;
  onEdit: (dhuku: DhukuCardData) => void;
  realMemberId: string;
};

export function DhukuCard({ dateFormat, dhuku, onAddEntry, onDelete, onEdit, realMemberId }: Props) {
  const role = roleForOwner(dhuku.ownerMemberId, realMemberId);
  const tone = memberTone(role);
  const pct = Math.round((dhuku.monthsLogged / dhuku.totalMembers) * 100);

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${TONE_BADGE_CLASSES[tone]}`}>
          <Users className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{dhuku.name}</p>
              <span
                className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONE_BADGE_CLASSES[tone]}`}
              >
                {role === "shared" ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {displayLabel(role, dhuku.ownerName)}
              </span>
              {dhuku.hasTaken && (
                <span className="mt-0.5 ml-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                  Payout taken
                </span>
              )}
              {dhuku.note && <p className="mt-1 text-sm text-muted-foreground">{dhuku.note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{formatNPR(dhuku.totalContributed)}</span>
              <span className="text-sm text-muted-foreground">{pct}%</span>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${TONE_BAR_CLASSES[tone]}`} style={{ width: `${Math.min(100, pct)}%` }} />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Month {dhuku.monthsLogged} of {dhuku.totalMembers}
            </span>
            <span>{formatNPR(dhuku.monthlyContribution)}/month</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-44">
          <div className={`rounded-lg px-3 py-2 text-xs ${STATUS_BOX_CLASSES[dhuku.status]}`}>
            {dhuku.status === "active" && dhuku.nextDueDate ? (
              <>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  Next: {formatDate(dhuku.nextDueDate, dateFormat)}
                </p>
                <p className="mt-0.5">{formatNPR(dhuku.expectedNextAmount)} due</p>
              </>
            ) : (
              <p className="flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                {STATUS_LABEL[dhuku.status]}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="flex-1"
              disabled={dhuku.status === "completed"}
              onClick={() => onAddEntry(dhuku)}
              size="sm"
              type="button"
            >
              <Users className="h-3.5 w-3.5" />
              Log entry
            </Button>
            <RowActionsMenu>
              <DropdownMenuItem onClick={() => onEdit(dhuku)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(dhuku.id)} variant="destructive">
                Delete
              </DropdownMenuItem>
            </RowActionsMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
