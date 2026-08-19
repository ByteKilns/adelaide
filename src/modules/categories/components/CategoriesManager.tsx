"use client";

import { useState, useTransition } from "react";

import { MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { TabSwitcher } from "@/components/TabSwitcher";
import { ToneIcon } from "@/components/ToneIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveCategoryAction, restoreCategoryAction } from "@/modules/categories/api/categories.actions";
import { CategoryFormModal } from "@/modules/categories/components/CategoryFormModal";
import { getCategoryIcon, getCategoryTone } from "@/modules/categories/lib/category-icons";

export type Category = {
  archived: boolean;
  budgetType: "fixed" | "flexible";
  groupName: string;
  id: string;
  name: string;
};

type Tab = "active" | "archived";

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [tab, setTab] = useState<Tab>("active");
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingId, setPendingId] = useState<null | string>(null);
  const [, startTransition] = useTransition();

  const visible = categories.filter((c) => (tab === "active" ? !c.archived : c.archived));

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  function handleArchive(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await archiveCategoryAction(id);
        toast.success("Category archived");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to archive category");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleRestore(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await restoreCategoryAction(id);
        toast.success("Category restored");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to restore category");
      } finally {
        setPendingId(null);
      }
    });
  }

  const columns: DataTableColumn<Category>[] = [
    {
      header: "Category",
      key: "name",
      render: (c) => (
        <div className="flex items-center gap-2">
          <ToneIcon className="h-8 w-8" icon={getCategoryIcon(c.groupName)} tone={getCategoryTone(c.groupName)} />
          <span className="font-medium">{c.name}</span>
        </div>
      ),
    },
    { className: "text-muted-foreground", header: "Group", key: "group", render: (c) => c.groupName },
    {
      header: "Type",
      key: "type",
      render: (c) => (
        <Badge variant={c.budgetType === "fixed" ? "secondary" : "outline"}>
          {c.budgetType === "fixed" ? "Fixed" : "Flexible"}
        </Badge>
      ),
    },
    {
      align: "right",
      header: "",
      key: "actions",
      render: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md p-1 text-muted-foreground hover:bg-accent" type="button">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(c)}>Edit</DropdownMenuItem>
            {c.archived ? (
              <DropdownMenuItem disabled={pendingId === c.id} onClick={() => handleRestore(c.id)}>
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled={pendingId === c.id} onClick={() => handleArchive(c.id)} variant="destructive">
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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

      <CategoryFormModal category={editing} onOpenChange={setFormOpen} open={formOpen} />
    </div>
  );
}
