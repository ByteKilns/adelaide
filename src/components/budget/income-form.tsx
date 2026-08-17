"use client";

import { useState, useTransition } from "react";
import { setIncomeAction } from "@/lib/actions/income";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  memberId: string;
  memberName: string;
  year: number;
  month: number;
  initialAmount: number;
};

export function IncomeForm({ memberId, memberName, year, month, initialAmount }: Props) {
  const [amount, setAmount] = useState(String(initialAmount || ""));
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <Label htmlFor={`income-${memberId}`}>{memberName} income</Label>
      <div className="flex gap-2">
        <Input
          id={`income-${memberId}`}
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setIncomeAction({
                memberId,
                year,
                month,
                amount: Number(amount) || 0,
              });
            })
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}
