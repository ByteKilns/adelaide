"use client";

import { Home, Plus, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budget", label: "Budget", icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

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
      <Link
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold text-primary"
        href="/expenses/new"
      >
        <Plus className="h-5 w-5" />
        Add
      </Link>
    </nav>
  );
}
