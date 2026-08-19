"use client";

import { TextField } from "@/components/TextField";

type Props = {
  memberId: string;
  memberName: string;
  onChange: (value: string) => void;
  value: string;
};

export function IncomeForm({ memberId, memberName, onChange, value }: Props) {
  return (
    <TextField
      id={`income-${memberId}`}
      label={`${memberName} income`}
      labelClassName="text-muted-foreground"
      min={0}
      onChange={(e) => onChange(e.target.value)}
      step="0.01"
      type="number"
      value={value}
    />
  );
}
