"use client";

import { useState, useTransition } from "react";
import { setBudgetItemAction } from "@/lib/actions/budget";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Props = {
  categoryId: string;
  categoryName: string;
  year: number;
  month: number;
  members: { id: string; name: string }[];
  initialOwnerMemberId: string | null;
  initialPlannedAmount: number;
};

export function BudgetItemRow({
  categoryId,
  categoryName,
  year,
  month,
  members,
  initialOwnerMemberId,
  initialPlannedAmount,
}: Props) {
  const [owner, setOwner] = useState(initialOwnerMemberId ?? "shared");
  const [amount, setAmount] = useState(
    initialPlannedAmount != null ? String(initialPlannedAmount) : "",
  );
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      await setBudgetItemAction({
        year,
        month,
        categoryId,
        ownerMemberId: owner === "shared" ? null : owner,
        plannedAmount: Number(amount) || 0,
      });
    });

  return (
    <div className="grid grid-cols-3 items-center gap-2 py-2">
      <span className="text-sm">{categoryName}</span>
      <Select value={owner} onValueChange={(v) => setOwner(v)}>
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
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
