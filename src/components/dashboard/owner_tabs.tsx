"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OwnerView = { key: string; label: string; income: number; expenses: number; remaining: number };

export function OwnerTabs({ views }: { views: OwnerView[] }) {
  return (
    <Tabs defaultValue={views[0]?.key}>
      <TabsList className="w-full justify-start gap-4 rounded-none border-b bg-transparent p-0">
        {views.map((v) => (
          <TabsTrigger
            key={v.key}
            value={v.key}
            className="rounded-none border-b-2 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {v.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {views.map((v) => (
        <TabsContent key={v.key} value={v.key} className="space-y-2 pt-4">
          {v.income > 0 && <p>Income: NPR {v.income.toLocaleString()}</p>}
          <p>Expenses: NPR {v.expenses.toLocaleString()}</p>
          <p>Remaining: NPR {v.remaining.toLocaleString()}</p>
        </TabsContent>
      ))}
    </Tabs>
  );
}
