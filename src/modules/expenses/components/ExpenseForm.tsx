"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { SelectField } from "@/components/SelectField";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { createExpenseAction, updateExpenseAction } from "@/modules/expenses/api/expenses.actions";

type Member = { id: string; name: string };
type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  currentMemberId: string;
  expenseId?: string;
  initial?: {
    amount: number;
    categoryId: string;
    date: string;
    note: string | null;
    ownerMemberId: string | null;
    paidByMemberId: string;
  };
  members: Member[];
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
    <form className="mx-auto max-w-sm space-y-4 p-4" onSubmit={handleSubmit}>
      <TextField
        id="amount"
        label="Amount"
        min={0}
        onChange={(e) => setAmount(e.target.value)}
        required
        step="0.01"
        type="number"
        value={amount}
      />

      <SelectField
        label="Category"
        onValueChange={setCategoryId}
        options={categories.map((c) => ({ label: c.name, value: c.id }))}
        value={categoryId}
      />

      <SelectField
        label="For"
        onValueChange={handleOwnerChange}
        options={[
          { label: "Shared", value: "shared" },
          ...members.map((m) => ({ label: m.id === currentMemberId ? "Me" : m.name, value: m.id })),
        ]}
        value={owner}
      />

      <SelectField
        disabled={owner !== "shared"}
        label="Paid by"
        onValueChange={setPaidBy}
        options={members.map((m) => ({ label: m.id === currentMemberId ? "Me" : m.name, value: m.id }))}
        value={paidBy}
      />

      <TextField id="date" label="Date" onChange={(e) => setDate(e.target.value)} required type="date" value={date} />

      <TextField id="note" label="Note (optional)" onChange={(e) => setNote(e.target.value)} value={note} />

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? "Saving..." : expenseId ? "Save changes" : "Add Expense"}
      </Button>
    </form>
  );
}
