"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setIncomeAction } from "@/modules/budget/api/budget.actions";

type Props = {
  initialAmount: number;
  memberId: string;
  memberName: string;
  month: number;
  year: number;
};

export function IncomeForm({ memberId, memberName, year, month, initialAmount }: Props) {
  const [amount, setAmount] = useState(initialAmount != null ? String(initialAmount) : "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground" htmlFor={`income-${memberId}`}>
        {memberName} income
      </Label>
      <div className="flex gap-2">
        <Input
          id={`income-${memberId}`}
          min={0}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          type="number"
          value={amount}
        />
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await setIncomeAction({
                  memberId,
                  year,
                  month,
                  amount: Number(amount) || 0,
                });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to save");
              }
            })
          }
          type="button"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
