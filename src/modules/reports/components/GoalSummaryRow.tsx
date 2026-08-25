import { Target } from "lucide-react";
import Link from "next/link";

import { TONE_BADGE_CLASSES, TONE_BAR_CLASSES } from "@/components/ToneIcon";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { memberTone, roleForOwner } from "@/modules/expenses/lib/member-tone";
import type { GoalCardData } from "@/modules/savings-goals/components/GoalCard";

export function GoalSummaryRow({ goal, realMemberId }: { goal: GoalCardData; realMemberId: string }) {
  const tone = memberTone(roleForOwner(goal.ownerMemberId, realMemberId));

  return (
    <Link className="flex items-center gap-3 rounded-2xl border p-3 hover:bg-accent" href="/savings-goals">
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
        {goal.image ? (
          <img alt="" className="h-full w-full object-cover" src={goal.image} />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${TONE_BADGE_CLASSES[tone]}`}>
            <Target className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{goal.name}</span>
          {goal.pct !== null && <span className="text-muted-foreground">{goal.pct}%</span>}
        </div>
        {goal.pct !== null && (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${TONE_BAR_CLASSES[tone]}`} style={{ width: `${Math.min(100, goal.pct)}%` }} />
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {goal.targetAmount !== null ? `${formatNPR(goal.saved)} of ${formatNPR(goal.targetAmount)}` : `${formatNPR(goal.saved)} saved — ongoing`}
        </p>
      </div>
    </Link>
  );
}
