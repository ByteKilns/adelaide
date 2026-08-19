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
};

const TAB_TRIGGER_CLASS =
  "rounded-none border-t-0 border-r-0 border-b-2 border-l-0 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none";

// The underline-style tab switcher used across the app (Dashboard's
// OwnerTabs, Expenses/Budget's owner tabs, Categories' Active/Archived
// tabs) — every one of those was hand-rolling this same TabsList/
// TabsTrigger markup with an identical className. Works both controlled
// (value/onValueChange, filtering content rendered by the parent outside
// this component) and uncontrolled (defaultValue, with TabsContent passed
// as children).
export function TabSwitcher({ children, className, defaultValue, onValueChange, tabs, value }: Props) {
  return (
    <Tabs defaultValue={defaultValue} onValueChange={onValueChange} value={value}>
      <TabsList className={cn("justify-start gap-4 rounded-none border-b bg-transparent p-0", className)}>
        {tabs.map((tab) => (
          <TabsTrigger className={TAB_TRIGGER_CLASS} key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
