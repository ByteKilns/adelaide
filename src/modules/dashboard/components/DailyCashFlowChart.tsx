// src/modules/dashboard/components/DailyCashFlowChart.tsx
"use client";

import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortDate } from "@/lib/date-format";
import type { DateFormat } from "@/lib/date-format-cookie";
import type { DayPoint } from "@/modules/dashboard/lib/cash-flow";
import { formatNPR } from "@/modules/dashboard/lib/format";

type Props = { dateFormat: DateFormat; monthLabel: string; points: DayPoint[] };

export function DailyCashFlowChart({ dateFormat, monthLabel, points }: Props) {
  // Each bar is labeled with its own converted date (e.g. "17 Bhadra"), not
  // a bare AD day-of-month number — an AD month spans two BS months most of
  // the time, so a bare day number is ambiguous about which BS month it's
  // actually in.
  const chartData = points.map((p) => ({ in: p.in, label: formatShortDate(p.date, dateFormat), outNeg: -p.out }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Daily Cash Flow</CardTitle>
        <p className="text-sm text-muted-foreground">Money in and out, day by day — {monthLabel}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            In
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-pink-500" />
            Out
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={chartData} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
              <XAxis axisLine={false} dataKey="label" fontSize={11} tickLine={false} />
              <ReferenceLine stroke="#94a3b8" y={0} />
              <Tooltip formatter={(value) => formatNPR(Math.abs(Number(value)))} />
              <Bar dataKey="in" fill="#22c55e" name="In" radius={[2, 2, 0, 0]} />
              <Bar dataKey="outNeg" fill="#ec4899" name="Out" radius={[0, 0, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
