import { SlidersHorizontal } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function NotificationsTipCard() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Keep your finances on track</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Notifications help you catch budget limits, upcoming payments, and shared activity before they become
            surprises.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
