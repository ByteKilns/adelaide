import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { type Tone, ToneIcon } from "@/components/ToneIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type StatCard = { content: ReactNode; icon: LucideIcon; title: string; tone: Tone };

export function StatCardGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card className="py-1 px-0" key={card.title}>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-normal text-muted-foreground">
              {card.title}
            </CardTitle>
            <ToneIcon icon={card.icon} tone={card.tone} />
          </CardHeader>
          <CardContent className="-mt-4">{card.content}</CardContent>
        </Card>
      ))}
    </div>
  );
}
