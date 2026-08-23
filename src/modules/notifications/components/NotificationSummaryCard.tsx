"use client";

import { Bell, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { alertCount: number; onReviewAlerts: () => void; paymentCount: number };

export function NotificationSummaryCard({ alertCount, onReviewAlerts, paymentCount }: Props) {
  const total = alertCount + paymentCount;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Notification summary</CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">
          {total} alert{total === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          You have {alertCount} budget alert{alertCount === 1 ? "" : "s"} and {paymentCount} payment reminder
          {paymentCount === 1 ? "" : "s"} waiting for you.
        </p>
        <Button className="mt-3 w-full" onClick={onReviewAlerts} type="button" variant="outline">
          Review alerts
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
