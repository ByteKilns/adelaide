"use client";

import { TabSwitcher } from "@/components/TabSwitcher";
import { TabsContent } from "@/components/ui/tabs";

type OwnerView = { expenses: number; income: number; key: string; label: string; remaining: number };

export function OwnerTabs({ views }: { views: OwnerView[] }) {
  return (
    <TabSwitcher
      className="w-full"
      defaultValue={views[0]?.key}
      tabs={views.map((v) => ({ label: v.label, value: v.key }))}
    >
      {views.map((v) => (
        <TabsContent className="space-y-2 pt-4" key={v.key} value={v.key}>
          {v.income > 0 && <p>Income: NPR {v.income.toLocaleString()}</p>}
          <p>Expenses: NPR {v.expenses.toLocaleString()}</p>
          <p>Remaining: NPR {v.remaining.toLocaleString()}</p>
        </TabsContent>
      ))}
    </TabSwitcher>
  );
}
