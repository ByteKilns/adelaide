import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function SmartInsightCard({ message }: { message: string }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Smart insights</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
