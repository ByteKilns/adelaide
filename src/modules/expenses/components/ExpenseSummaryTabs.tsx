"use client";

import { TabSwitcher } from "@/components/TabSwitcher";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { ExpenseSummaryContent } from "@/modules/expenses/components/ExpenseSummaryCard";
import type { OwnerSlice } from "@/modules/expenses/lib/expense-breakdown";
import { ExpenseBreakdownContent } from "@/modules/reports/components/ExpenseBreakdownCard";
import type { CategorySlice } from "@/modules/reports/lib/reports-stats";

type Props = {
  categorySlices: CategorySlice[];
  ownerSlices: OwnerSlice[];
  pctOfIncome: null | number;
  total: number;
};

// Combines ExpenseSummaryCard (spend by owner) and ExpenseBreakdownCard
// (spend by category) into one tabbed card for the Expenses page's summary
// slot — the two were competing for the same visual space, so only one is
// shown at a time instead of stacking both.
export function ExpenseSummaryTabs({ categorySlices, ownerSlices, pctOfIncome, total }: Props) {
  return (
    <Card>
      <CardContent>
        <TabSwitcher
          defaultValue="summary"
          tabs={[
            { label: "Summary", value: "summary" },
            { label: "Breakdown", value: "breakdown" },
          ]}
        >
          {/* Both panels are grid-stacked into the same cell (forceMount +
              col/row-start-1) so the grid row's height is always the taller
              of the two — switching tabs never shrinks/grows the card. The
              inactive panel stays in the layout (invisible, not display:none)
              so it keeps contributing to that height. */}
          <div className="grid pt-4">
            <TabsContent
              className="col-start-1 row-start-1 data-[state=inactive]:invisible data-[state=inactive]:pointer-events-none"
              forceMount
              value="summary"
            >
              <ExpenseSummaryContent pctOfIncome={pctOfIncome} slices={ownerSlices} total={total} />
            </TabsContent>
            <TabsContent
              className="col-start-1 row-start-1 data-[state=inactive]:invisible data-[state=inactive]:pointer-events-none"
              forceMount
              value="breakdown"
            >
              <ExpenseBreakdownContent slices={categorySlices} stacked total={total} />
            </TabsContent>
          </div>
        </TabSwitcher>
      </CardContent>
    </Card>
  );
}
