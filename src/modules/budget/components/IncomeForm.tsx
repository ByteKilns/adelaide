"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  memberId: string;
  memberName: string;
  onChange: (value: string) => void;
  value: string;
};

export function IncomeForm({ memberId, memberName, onChange, value }: Props) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground" htmlFor={`income-${memberId}`}>
        {memberName} income
      </Label>
      <Input
        id={`income-${memberId}`}
        min={0}
        onChange={(e) => onChange(e.target.value)}
        step="0.01"
        type="number"
        value={value}
      />
    </div>
  );
}
