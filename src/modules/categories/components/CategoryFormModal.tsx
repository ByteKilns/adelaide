"use client";

import { useState, useTransition } from "react";

import { List } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@/components/Modal";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

        <div className="space-y-1">
          <Label htmlFor="category-group">Group</Label>
          <Select onValueChange={(v) => setForm((f) => ({ ...f, groupName: v }))} value={form.groupName}>
            <SelectTrigger className="w-full" id="category-group">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="category-type">Type</Label>
          <Select
            onValueChange={(v) => setForm((f) => ({ ...f, budgetType: v as CategoryInput["budgetType"] }))}
            value={form.budgetType}
          >
            <SelectTrigger className="w-full" id="category-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flexible">Flexible</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>
    </Modal>
  );
}
