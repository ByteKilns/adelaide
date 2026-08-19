"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import type { DataTableColumn } from "@/components/DataTable";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { ToneIcon } from "@/components/ToneIcon";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { archiveCategoryAction, restoreCategoryAction } from "@/modules/categories/api/categories.actions";
import { getCategoryIcon, getCategoryTone } from "@/modules/categories/lib/category-icons";

export type Category = {
  archived: boolean;
  budgetType: "fixed" | "flexible";
  groupName: string;
  id: string;
  name: string;
};

export function useCategoryTableColumns(onEdit: (category: Category) => void): DataTableColumn<Category>[] {
  const [pendingId, setPendingId] = useState<null | string>(null);
  const [, startTransition] = useTransition();

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

  return [
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
        <RowActionsMenu>
          <DropdownMenuItem onClick={() => onEdit(c)}>Edit</DropdownMenuItem>
          {c.archived ? (
            <DropdownMenuItem disabled={pendingId === c.id} onClick={() => handleRestore(c.id)}>
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={pendingId === c.id} onClick={() => handleArchive(c.id)} variant="destructive">
              Archive
            </DropdownMenuItem>
          )}
        </RowActionsMenu>
      ),
    },
  ];
}
