import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// The recommendations engine doesn't exist yet — this card is a visual
// placeholder, consistent with how other not-yet-built features
// (Financial Health, Safe to Spend Today) are represented elsewhere.
export function RecommendationsCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Need Help Planning?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Use our recommendations to balance your budget and reach your savings goals.
        </p>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg border bg-background py-2 text-sm font-medium text-muted-foreground/50"
          disabled
          type="button"
        >
          <Sparkles className="h-4 w-4" />
          View Recommendations
        </button>
      </CardContent>
    </Card>
  );
}
