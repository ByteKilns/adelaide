import { PiggyBank } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/modules/dashboard/lib/format";

type Props = { averageProgress: number; monthlyContribution: number; totalGoals: number };

export function DashboardSavingsCard({ averageProgress, monthlyContribution, totalGoals }: Props) {
  return (
    <Card className="border-0 bg-surface-secondary shadow-[0_2px_12px_rgba(102,45,145,0.06)] ring-0">
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Savings Goals</CardTitle>
        <Link className="text-sm text-primary underline" href="/savings-goals">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {totalGoals === 0 ? (
          <p className="text-sm text-muted-foreground">
            No savings goals yet. <Link className="text-primary underline" href="/savings-goals">Create one</Link> to start
            tracking progress.
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <PiggyBank className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm">
                Saved <span className="font-semibold">{formatNPR(monthlyContribution)}</span> this month across{" "}
                {totalGoals} goal{totalGoals === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-muted-foreground">{averageProgress}% average progress</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
