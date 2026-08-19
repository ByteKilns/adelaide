"use client";

import { useState, useTransition } from "react";

import { List } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@/components/Modal";
import { SelectField } from "@/components/SelectField";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { createCategoryAction, updateCategoryAction } from "@/modules/categories/api/categories.actions";
import { CATEGORY_GROUPS } from "@/modules/categories/lib/category-icons";
import type { CategoryInput } from "@/modules/categories/schemas/category.schema";

type Category = { budgetType: "fixed" | "flexible"; groupName: string; id: string; name: string };

type Props = {
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const EMPTY: CategoryInput = { budgetType: "flexible", groupName: CATEGORY_GROUPS[0], name: "" };

export function CategoryFormModal({ category, onOpenChange, open }: Props) {
  const [form, setForm] = useState<CategoryInput>(category ?? EMPTY);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) setForm(category ?? EMPTY);
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (category) {
          await updateCategoryAction(category.id, form);
        } else {
          await createCategoryAction(form);
        }
        toast.success(category ? "Category updated" : "Category added");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save category");
      }
    });
  }

  return (
    <Modal
      footer={
        <Button disabled={pending} form="category-form" type="submit">
          {pending ? "Saving..." : "Save Category"}
        </Button>
      }
      icon={List}
      onOpenChange={handleOpenChange}
      open={open}
      title={category ? "Edit category" : "Add category"}
      tone="blue"
    >
      <form className="space-y-4" id="category-form" onSubmit={handleSubmit}>
        <TextField
          id="category-name"
          label="Name"
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          value={form.name}
        />

        <SelectField
          id="category-group"
          label="Group"
          onValueChange={(v) => setForm((f) => ({ ...f, groupName: v }))}
          options={CATEGORY_GROUPS.map((g) => ({ label: g, value: g }))}
          value={form.groupName}
        />

        <SelectField
          id="category-type"
          label="Type"
          onValueChange={(v) => setForm((f) => ({ ...f, budgetType: v as CategoryInput["budgetType"] }))}
          options={[
            { label: "Flexible", value: "flexible" },
            { label: "Fixed", value: "fixed" },
          ]}
          value={form.budgetType}
        />
      </form>
    </Modal>
  );
}
