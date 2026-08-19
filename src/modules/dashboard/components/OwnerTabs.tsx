"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OwnerView = { expenses: number; income: number; key: string; label: string; remaining: number };

export function OwnerTabs({ views }: { views: OwnerView[] }) {
  return (
    <Tabs defaultValue={views[0]?.key}>
      <TabsList className="w-full justify-start gap-4 rounded-none border-b bg-transparent p-0">
        {views.map((v) => (
          <TabsTrigger
            className="rounded-none border-b-2 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            key={v.key}
            value={v.key}
          >
            {v.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {views.map((v) => (
        <TabsContent className="space-y-2 pt-4" key={v.key} value={v.key}>
          {v.income > 0 && <p>Income: NPR {v.income.toLocaleString()}</p>}
          <p>Expenses: NPR {v.expenses.toLocaleString()}</p>
          <p>Remaining: NPR {v.remaining.toLocaleString()}</p>
        </TabsContent>
      ))}
    </Tabs>
  );
}
