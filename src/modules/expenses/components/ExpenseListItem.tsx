"use client";

import { useTransition } from "react";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteExpenseAction } from "@/modules/expenses/api/expenses.actions";

type Props = {
  amount: number;
  categoryName: string;
  date: string;
  id: string;
  note: string | null;
  ownerLabel: string;
};

export function ExpenseListItem({ id, categoryName, amount, ownerLabel, date, note }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between border-b py-3">
      <div>
        <p className="font-medium">{categoryName}</p>
        <p className="text-sm text-muted-foreground">
          {ownerLabel} · {date}
          {note ? ` · ${note}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">-NPR {amount.toLocaleString()}</span>
        <Link className="text-sm underline" href={`/expenses/${id}/edit`}>
          Edit
        </Link>
        <Button
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Delete this expense?")) return;
            startTransition(async () => {
              try {
                await deleteExpenseAction(id);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to delete");
              }
            });
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
