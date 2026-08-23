import { CircleHelp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/modules/dashboard/lib/format";

export function SafeToSpendCard({ daysLeft, monthLabel, safeToSpend }: { daysLeft: number; monthLabel: string; safeToSpend: number }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Safe to Spend Today</CardTitle>
        <CircleHelp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{formatNPR(safeToSpend)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Based on your remaining budget and {daysLeft} day{daysLeft === 1 ? "" : "s"} left in {monthLabel.split(" ")[0]}
        </p>
      </CardContent>
    </Card>
  );
}
