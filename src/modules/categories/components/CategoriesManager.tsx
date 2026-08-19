"use client";

import { useState } from "react";

import { Plus } from "lucide-react";

import { DataTable } from "@/components/DataTable";
import { TabSwitcher } from "@/components/TabSwitcher";
import { Button } from "@/components/ui/button";
import { CategoryFormModal } from "@/modules/categories/components/CategoryFormModal";
import { type Category, useCategoryTableColumns } from "@/modules/categories/hooks/useCategoryTableColumns";

type Tab = "active" | "archived";

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [tab, setTab] = useState<Tab>("active");
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const visible = categories.filter((c) => (tab === "active" ? !c.archived : c.archived));

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  const columns = useCategoryTableColumns(openEdit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TabSwitcher
          onValueChange={(v) => setTab(v as Tab)}
          tabs={[
            { label: "Active", value: "active" },
            { label: "Archived", value: "archived" },
          ]}
          value={tab}
        />
        <Button onClick={openAdd} type="button">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        emptyMessage={tab === "active" ? "No categories yet." : "No archived categories."}
        rowKey={(c) => c.id}
        rows={visible}
      />

      <CategoryFormModal category={editing} key={editing?.id ?? "new"} onOpenChange={setFormOpen} open={formOpen} />
    </div>
  );
}
