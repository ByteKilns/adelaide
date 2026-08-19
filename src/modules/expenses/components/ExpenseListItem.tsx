"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { deleteExpenseAction } from "@/modules/expenses/api/actions";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  categoryName: string;
  amount: number;
  ownerLabel: string;
  date: string;
  note: string | null;
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
        <Link href={`/expenses/${id}/edit`} className="text-sm underline">
          Edit
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
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
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
