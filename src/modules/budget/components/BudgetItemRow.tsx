"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  amount: string;
  categoryId: string;
  categoryName: string;
  members: { id: string; name: string }[];
  onAmountChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  owner: string;
};

export function BudgetItemRow({ amount, categoryId, categoryName, members, onAmountChange, onOwnerChange, owner }: Props) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 py-2">
      <span className="text-sm text-muted-foreground">{categoryName}</span>
      <Select onValueChange={onOwnerChange} value={owner}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="shared">Shared</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
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
