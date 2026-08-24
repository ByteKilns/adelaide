"use client";

import type { ReactNode } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type TabOption = { label: string; value: string };

type Props = {
  children?: ReactNode;
  className?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  tabs: TabOption[];
  value?: string;
  variant?: "default" | "outline";
};

const LIST_CLASS = {
  default: "h-auto w-fit justify-start gap-1 rounded-lg bg-muted p-1",
  outline: "h-auto w-full justify-start gap-4 rounded-none border-b bg-transparent p-0",
};

const TRIGGER_CLASS = {
  default:
    "flex-1 rounded-md border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
  outline:
    "rounded-md border border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none",
};

// The tab switcher used across the app (Dashboard's OwnerTabs, Expenses/
// Budget's owner tabs, Categories' Active/Archived tabs, the page-level
// Expenses/Charts switcher) — every one of those was hand-rolling this same
// TabsList/TabsTrigger markup with an identical className. Works both
// controlled (value/onValueChange, filtering content rendered by the parent
// outside this component) and uncontrolled (defaultValue, with TabsContent
// passed as children).
//
// "outline" (the default) sits on a bottom baseline rule (no container box)
// — the active tab gets its own bordered box, everything else stays flat.
// "default" is the older pill-on-a-muted-track look, kept for call sites
// that opt into it explicitly.
export function TabSwitcher({ children, className, defaultValue, onValueChange, tabs, value, variant = "outline" }: Props) {
  return (
    <Tabs defaultValue={defaultValue} onValueChange={onValueChange} value={value}>
      <TabsList className={cn(LIST_CLASS[variant], className)}>
        {tabs.map((tab) => (
          <TabsTrigger className={TRIGGER_CLASS[variant]} key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
