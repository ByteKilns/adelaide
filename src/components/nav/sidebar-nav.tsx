"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Receipt,
  Wallet,
  Repeat,
  PiggyBank,
  BarChart3,
  Tags,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewingAsSwitcher } from "./viewing-as-switcher";

type NavItem = { href: string; label: string; icon: LucideIcon; enabled: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, enabled: true },
  { href: "/expenses", label: "Expenses", icon: Receipt, enabled: true },
  { href: "/budget", label: "Budget", icon: Wallet, enabled: true },
  { href: "/recurring", label: "Recurring", icon: Repeat, enabled: false },
  { href: "/savings-goals", label: "Savings Goals", icon: PiggyBank, enabled: false },
  { href: "/reports", label: "Reports", icon: BarChart3, enabled: false },
  { href: "/categories", label: "Categories", icon: Tags, enabled: false },
  { href: "/notifications", label: "Notifications", icon: Bell, enabled: false },
  { href: "/settings", label: "Settings", icon: Settings, enabled: false },
];

type Member = { id: string; name: string };

type Props = {
  members: Member[];
  realMemberId: string;
  viewingAsMemberId: string;
};

export function SidebarNav({ members, realMemberId, viewingAsMemberId }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r p-4 md:flex">
      <div className="mb-6">
        <p className="text-lg font-semibold">Couple Budget</p>
        <p className="text-xs text-muted-foreground">Plan together, grow together</p>
      </div>

      <Button asChild className="mb-4 rounded-full">
        <Link href="/expenses/new">+ Add Expense</Link>
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          if (!item.enabled) {
            return (
              <div
                key={item.href}
                aria-disabled="true"
                className="flex items-center justify-between rounded px-3 py-2 text-sm text-muted-foreground/50"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Soon
                </Badge>
              </div>
            );
          }
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded px-3 py-2 text-sm",
                active ? "bg-accent font-semibold" : "text-muted-foreground hover:bg-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t pt-4">
        <ViewingAsSwitcher
          members={members}
          realMemberId={realMemberId}
          viewingAsMemberId={viewingAsMemberId}
        />
      </div>
    </aside>
  );
}
