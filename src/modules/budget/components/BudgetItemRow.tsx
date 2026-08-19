"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setBudgetItemAction } from "@/modules/budget/api/budget.actions";

type Props = {
  categoryId: string;
  categoryName: string;
  initialOwnerMemberId: string | null;
  initialPlannedAmount: number;
  members: { id: string; name: string }[];
  month: number;
  year: number;
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
      try {
        await setBudgetItemAction({
          year,
          month,
          categoryId,
          ownerMemberId: owner === "shared" ? null : owner,
          plannedAmount: Number(amount) || 0,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });

  return (
    <div className="grid grid-cols-3 items-center gap-2 py-2">
      <span className="text-sm">{categoryName}</span>
      <Select onValueChange={(v) => setOwner(v)} value={owner}>
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
          min={0}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          type="number"
          value={amount}
        />
        <Button disabled={pending} onClick={save} size="sm" type="button">
          Save
        </Button>
      </div>
    </div>
  );
}
