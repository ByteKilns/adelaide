import { Lightbulb } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickTipsCard() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Lightbulb className="h-4 w-4 text-primary" />
          Quick Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Set up recurring expenses once and never miss important payments again.
        </p>
      </CardContent>
    </Card>
  );
}
