"use client";

import { Input } from "@/components/ui/input";

type Props = {
  amount: string;
  categoryId: string;
  categoryName: string;
  onAmountChange: (value: string) => void;
};

export function BudgetItemRow({ amount, categoryId, categoryName, onAmountChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-sm text-muted-foreground">{categoryName}</span>
      <Input
        className="w-32"
        id={`budget-item-${categoryId}`}
        min={0}
        onChange={(e) => onAmountChange(e.target.value)}
        step="0.01"
        type="number"
        value={amount}
      />
    </div>
  );
}
