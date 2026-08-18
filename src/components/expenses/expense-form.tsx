"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createExpenseAction, updateExpenseAction } from "@/lib/actions/expenses";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = { id: string; name: string };
type Category = { id: string; name: string };

type Props = {
  currentMemberId: string;
  members: Member[];
  categories: Category[];
  expenseId?: string;
  initial?: {
    amount: number;
    categoryId: string;
    ownerMemberId: string | null;
    paidByMemberId: string;
    date: string;
    note: string | null;
  };
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({
  currentMemberId,
  members,
  categories,
  expenseId,
  initial,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [owner, setOwner] = useState<string>(initial?.ownerMemberId ?? currentMemberId);
  const [paidBy, setPaidBy] = useState<string>(initial?.paidByMemberId ?? currentMemberId);
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [note, setNote] = useState(initial?.note ?? "");
  const [submitting, setSubmitting] = useState(false);

  function handleOwnerChange(value: string) {
    setOwner(value);
    // Owner = Me or Partner auto-defaults Paid by to the same member.
    // Owner = Shared leaves the payer for the user to choose explicitly.
    if (value !== "shared") {
      setPaidBy(value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      amount: Number(amount),
      categoryId,
      ownerMemberId: owner === "shared" ? null : owner,
      paidByMemberId: paidBy,
      date,
      note: note.trim() || undefined,
    };
    try {
      if (expenseId) {
        await updateExpenseAction(expenseId, payload);
      } else {
        await createExpenseAction(payload);
      }
      router.push("/expenses");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4 p-4">
      <div className="space-y-1">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          min={0}
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>For</Label>
        <Select value={owner} onValueChange={handleOwnerChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shared">Shared</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === currentMemberId ? "Me" : m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Paid by</Label>
        <Select value={paidBy} onValueChange={setPaidBy} disabled={owner !== "shared"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === currentMemberId ? "Me" : m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving..." : expenseId ? "Save changes" : "Add Expense"}
      </Button>
    </form>
  );
}
