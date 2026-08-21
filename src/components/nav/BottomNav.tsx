"use client";

import { useState } from "react";

import { Home, Plus, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { AddExpenseModal } from "@/modules/expenses/components/AddExpenseModal";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budget", label: "Budget", icon: Wallet },
];

type Category = { id: string; name: string };
type Member = { id: string; name: string };

type Props = {
  categories: Category[];
  currentMemberId: string;
  members: Member[];
};

export function BottomNav({ categories, currentMemberId, members }: Props) {
  const pathname = usePathname();
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-background md:hidden">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs",
              active ? "font-semibold text-primary" : "text-muted-foreground",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
      <button
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold text-primary"
        onClick={() => setAddExpenseOpen(true)}
        type="button"
      >
        <Plus className="h-5 w-5" />
        Add
      </button>

      <AddExpenseModal
        categories={categories}
        currentMemberId={currentMemberId}
        members={members}
        onOpenChange={setAddExpenseOpen}
        open={addExpenseOpen}
      />
    </nav>
  );
}
