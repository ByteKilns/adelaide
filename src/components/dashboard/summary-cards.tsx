import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { combinedIncome: number; totalExpenses: number; unallocated: number };

export function SummaryCards({ combinedIncome, totalExpenses, unallocated }: Props) {
  const items = [
    { label: "Combined Income", value: combinedIncome },
    { label: "Expenses", value: totalExpenses },
    { label: "Unallocated", value: unallocated },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            NPR {item.value.toLocaleString()}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
