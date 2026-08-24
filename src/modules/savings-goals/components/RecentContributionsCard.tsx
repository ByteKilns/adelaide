import { Target } from "lucide-react";

import { ToneIcon } from "@/components/ToneIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortDate } from "@/lib/date-format";
import type { DateFormat } from "@/lib/date-format-cookie";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { type MemberRole, memberTone } from "@/modules/expenses/lib/member-tone";

export type ContributionEntry = {
  amount: number;
  date: string;
  goalImage: null | string;
  goalName: string;
  id: string;
  ownerLabel: string;
  role: MemberRole;
};

function formatRelativeDate(dateStr: string, format: DateFormat) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateStr}T00:00:00`);
  const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return formatShortDate(dateStr, format);
}

export function RecentContributionsCard({ dateFormat, items }: { dateFormat: DateFormat; items: ContributionEntry[] }) {
  const recent = items.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Recent Contributions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 && <p className="text-sm text-muted-foreground">No contributions yet.</p>}
        {recent.map((item) => (
          <div className="flex items-center gap-3" key={item.id}>
            {item.goalImage ? (
              <img alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" src={item.goalImage} />
            ) : (
              <ToneIcon icon={Target} tone={memberTone(item.role)} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.goalName}</p>
              <p className="text-xs text-muted-foreground">
                {formatNPR(item.amount)} · {item.ownerLabel}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeDate(item.date, dateFormat)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
