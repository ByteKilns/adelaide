"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/modules/dashboard/lib/format";

type Props = {
  monthlyContribution: number;
  points: { cumulative: number; label: string }[];
  vsLastMonthPct: null | number;
};

export function SavingsOverviewCard({ monthlyContribution, points, vsLastMonthPct }: Props) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Savings Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Total Saved This Month</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold">{formatNPR(monthlyContribution)}</p>
          {vsLastMonthPct !== null && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
              {vsLastMonthPct >= 0 ? "+" : ""}
              {vsLastMonthPct}% vs last month
            </span>
          )}
        </div>

        <div className="mt-4 h-40 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={points} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
              <XAxis axisLine={false} dataKey="label" fontSize={11} tickLine={false} />
              <Tooltip formatter={(value) => formatNPR(Number(value))} />
              <Line dataKey="cumulative" dot={{ r: 3 }} stroke="#22c55e" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
