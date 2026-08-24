"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { PacePoint } from "@/modules/reports/lib/reports-stats";

type Props = { points: PacePoint[]; totalPlanned: number };

export function SpendingPaceCard({ points, totalPlanned }: Props) {
  const hasBudget = totalPlanned > 0;

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Spending Pace</CardTitle>
        <p className="text-sm text-muted-foreground">
          {hasBudget
            ? "Cumulative spend this month vs. an even daily pace against your budget"
            : "Cumulative spend this month — set a budget to see how your pace compares"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-pink-500" />
            Actual
          </span>
          {hasBudget && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border-2 border-muted-foreground bg-transparent" />
              Even pace
            </span>
          )}
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={points} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
              <XAxis axisLine={false} dataKey="day" fontSize={11} tickLine={false} />
              <Tooltip formatter={(value) => (value === null ? "—" : formatNPR(Number(value)))} labelFormatter={(day) => `Day ${day}`} />
              <Line dataKey="actual" dot={false} name="Actual" stroke="#ec4899" strokeWidth={2} type="monotone" />
              {hasBudget && (
                <Line
                  dataKey="pace"
                  dot={false}
                  name="Even pace"
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  type="monotone"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
