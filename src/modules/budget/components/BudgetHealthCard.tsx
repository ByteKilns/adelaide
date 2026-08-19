import { Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/modules/dashboard/lib/format";

type Props = { allocated: number; combinedIncome: number; unallocated: number };

export function BudgetHealthCard({ allocated, combinedIncome, unallocated }: Props) {
  const pct = combinedIncome > 0 ? Math.round((allocated / combinedIncome) * 100) : 0;
  const onTrack = allocated <= combinedIncome;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1 text-base font-medium">Budget Health</CardTitle>
      </CardHeader>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <Badge className="mb-2" variant={onTrack ? "default" : "destructive"}>
            {onTrack ? "On Track" : "Over Allocated"}
          </Badge>
          <p className="text-sm text-muted-foreground">
            You&apos;ve allocated {pct}% of your combined income.{" "}
            {unallocated >= 0
              ? `${formatNPR(unallocated)} remains unallocated. You can allocate it to savings goals or keep it as a buffer.`
              : `You've allocated ${formatNPR(Math.abs(unallocated))} more than your combined income.`}
          </p>
        </div>
        <Target className="h-10 w-10 shrink-0 text-primary" />
      </CardContent>
    </Card>
  );
}
