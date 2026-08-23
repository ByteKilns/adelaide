"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GoalStatus } from "@/modules/savings-goals/lib/savings-stats";

const STATUS_HEX: Record<GoalStatus, string> = { "at-risk": "#ef4444", behind: "#f59e0b", "on-track": "#22c55e" };
const STATUS_LABEL: Record<GoalStatus, string> = { "at-risk": "At Risk", behind: "Behind", "on-track": "On Track" };
const STATUS_DOT: Record<GoalStatus, string> = { "at-risk": "bg-red-500", behind: "bg-amber-500", "on-track": "bg-green-500" };

export function GoalProgressOverviewCard({
  averageProgress,
  counts,
}: {
  averageProgress: number;
  counts: Record<GoalStatus, number>;
}) {
  const order: GoalStatus[] = ["on-track", "behind", "at-risk"];
  const chartData = order.filter((s) => counts[s] > 0).map((s) => ({ key: s, value: counts[s] }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Goal Progress Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          {chartData.length > 0 && (
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" innerRadius="65%" nameKey="key" outerRadius="100%" paddingAngle={2}>
                  {chartData.map((d) => (
                    <Cell fill={STATUS_HEX[d.key]} key={d.key} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold">{averageProgress}%</p>
            <p className="text-[11px] text-muted-foreground">Average Progress</p>
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          {order.map((status) => (
            <li className="flex items-center gap-2" key={status}>
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
              {STATUS_LABEL[status]}
              <span className="text-muted-foreground">
                {counts[status]} goal{counts[status] === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
