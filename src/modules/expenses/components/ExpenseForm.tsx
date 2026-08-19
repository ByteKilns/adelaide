"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { SelectField } from "@/components/SelectField";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { createExpenseAction, updateExpenseAction } from "@/modules/expenses/api/expenses.actions";
import { type ExpenseInput, expenseSchema } from "@/modules/expenses/schemas/expense.schema";

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

export function ExpenseForm({ categories, currentMemberId, expenseId, initial, members }: Props) {
  const router = useRouter();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<ExpenseInput>({
    defaultValues: {
      amount: initial?.amount ?? 0,
      categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
      date: initial?.date ?? todayISO(),
      note: initial?.note ?? "",
      ownerMemberId: initial?.ownerMemberId ?? currentMemberId,
      paidByMemberId: initial?.paidByMemberId ?? currentMemberId,
    },
    resolver: zodResolver(expenseSchema),
  });

  const owner = watch("ownerMemberId");

  function handleOwnerChange(value: string) {
    setValue("ownerMemberId", value === "shared" ? null : value);
    // Owner = Me or Partner auto-defaults Paid by to the same member.
    // Owner = Shared leaves the payer for the user to choose explicitly.
    if (value !== "shared") {
      setValue("paidByMemberId", value);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = { ...values, note: values.note?.trim() || undefined };
    try {
      if (expenseId) {
        await updateExpenseAction(expenseId, payload);
      } else {
        await createExpenseAction(payload);
      }
      router.push("/expenses");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  });

  return (
    <form className="mx-auto max-w-sm space-y-4 p-4" onSubmit={onSubmit}>
      <TextField
        error={errors.amount?.message}
        id="amount"
        label="Amount"
        min={0}
        step="0.01"
        type="number"
        {...register("amount", { valueAsNumber: true })}
      />

      <Controller
        control={control}
        name="categoryId"
        render={({ field }) => (
          <SelectField
            error={errors.categoryId?.message}
            label="Category"
            onValueChange={field.onChange}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
            value={field.value}
          />
        )}
      />

      <SelectField
        label="For"
        onValueChange={handleOwnerChange}
        options={[
          { label: "Shared", value: "shared" },
          ...members.map((m) => ({ label: m.id === currentMemberId ? "Me" : m.name, value: m.id })),
        ]}
        value={owner ?? "shared"}
      />

      <Controller
        control={control}
        name="paidByMemberId"
        render={({ field }) => (
          <SelectField
            disabled={owner !== null}
            error={errors.paidByMemberId?.message}
            label="Paid by"
            onValueChange={field.onChange}
            options={members.map((m) => ({ label: m.id === currentMemberId ? "Me" : m.name, value: m.id }))}
            value={field.value}
          />
        )}
      />

      <TextField error={errors.date?.message} id="date" label="Date" type="date" {...register("date")} />

      <TextField id="note" label="Note (optional)" {...register("note")} />

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Saving..." : expenseId ? "Save changes" : "Add Expense"}
      </Button>
    </form>
  );
}
