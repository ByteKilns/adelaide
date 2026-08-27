"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { Check, Plus } from "lucide-react";

import { type CategoryMatchInput, hasExactMatch, searchCategories } from "@/components/lib/category-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CategoryFormModal } from "@/modules/categories/components/CategoryFormModal";

type Category = CategoryMatchInput;

type Props = {
  categories: Category[];
  containerClassName?: string;
  error?: string;
  id?: string;
  label: string;
  onCategoriesChange?: (categories: Category[]) => void;
  onValueChange: (value: string) => void;
  value: string;
};

export function CategoryComboboxField({
  categories,
  containerClassName,
  error,
  id,
  label,
  onCategoriesChange,
  onValueChange,
  value,
}: Props) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const selected = categories.find((c) => c.id === value) ?? null;
  const results = useMemo(() => searchCategories(categories, query), [categories, query]);
  const showAddRow = query.trim().length > 0 && !hasExactMatch(categories, query);
  const rowCount = results.length + (showAddRow ? 1 : 0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets highlight when query changes or popover opens (including external close via Radix's onOpenChange), not derivable inline from a single event handler
    setHighlighted(0);
  }, [query, open]);

  function selectCategory(category: Category) {
    onValueChange(category.id);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, Math.max(rowCount - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted < results.length) {
        const category = results[highlighted];
        if (category) selectCategory(category);
      } else if (showAddRow) {
        setCreateOpen(true);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleCreated(category: Category) {
    onCategoriesChange?.([...categories, category]);
    onValueChange(category.id);
    setCreateOpen(false);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className={cn("space-y-1", containerClassName)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverAnchor asChild>
          <Input
            aria-invalid={Boolean(error)}
            autoComplete="off"
            id={fieldId}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search categories..."
            value={open ? query : (selected?.name ?? "")}
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="max-h-64 w-(--radix-popover-trigger-width) overflow-y-auto p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {results.map((category, index) => (
            <button
              className={cn(
                "flex w-full items-center justify-between gap-1.5 rounded-md px-1.5 py-1 text-left text-sm",
                index === highlighted ? "bg-accent text-accent-foreground" : "hover:bg-accent",
              )}
              key={category.id}
              onClick={() => selectCategory(category)}
              onMouseEnter={() => setHighlighted(index)}
              type="button"
            >
              <span>
                {category.name}
                <span className="ml-1.5 text-xs text-muted-foreground">{category.groupName}</span>
              </span>
              {category.id === value && <Check className="h-4 w-4" />}
            </button>
          ))}

          {results.length === 0 && !showAddRow && (
            <p className="px-1.5 py-1 text-sm text-muted-foreground">No categories</p>
          )}

          {showAddRow && (
            <button
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm text-primary",
                highlighted === results.length ? "bg-accent" : "hover:bg-accent",
              )}
              onClick={() => setCreateOpen(true)}
              onMouseEnter={() => setHighlighted(results.length)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add &quot;{query.trim()}&quot; as new category
            </button>
          )}
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <CategoryFormModal
        category={null}
        defaultName={query.trim()}
        onCreated={handleCreated}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />
    </div>
  );
}
