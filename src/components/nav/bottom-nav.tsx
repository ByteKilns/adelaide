"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/expenses", label: "Expenses" },
  { href: "/budget", label: "Budget" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-background md:hidden">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex-1 py-3 text-center text-sm",
            pathname.startsWith(item.href) ? "font-semibold text-primary" : "text-muted-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
      <Link
        href="/expenses/new"
        className="flex-1 py-3 text-center text-sm font-semibold text-primary"
      >
        + Add
      </Link>
    </nav>
  );
}
