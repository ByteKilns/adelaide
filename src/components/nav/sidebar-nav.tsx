"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/expenses", label: "Expenses" },
  { href: "/budget", label: "Budget" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-2 border-r p-4 md:flex">
      <Button asChild className="mb-4">
        <Link href="/expenses/new">+ Add Expense</Link>
      </Button>
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded px-3 py-2 text-sm",
            pathname.startsWith(item.href)
              ? "bg-accent font-semibold"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
