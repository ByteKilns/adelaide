"use client";

import {
  BarChart3,
  Bell,
  ChevronDown,
  Home,
  List,
  type LucideIcon,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ViewingAsSwitcher } from "./ViewingAsSwitcher";

type NavItem = { enabled: boolean; href: string; icon: LucideIcon; label: string; };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, enabled: true },
  { href: "/expenses", label: "Expenses", icon: Receipt, enabled: true },
  { href: "/budget", label: "Budget", icon: Wallet, enabled: true },
  { href: "/recurring", label: "Recurring", icon: Repeat, enabled: false },
  { href: "/savings-goals", label: "Savings Goals", icon: PiggyBank, enabled: false },
  { href: "/reports", label: "Reports", icon: BarChart3, enabled: false },
  { href: "/categories", label: "Categories", icon: List, enabled: false },
  { href: "/notifications", label: "Notifications", icon: Bell, enabled: false },
  { href: "/settings", label: "Settings", icon: Settings, enabled: true },
];

type Member = { id: string; name: string };

type Props = {
  members: Member[];
  realMemberId: string;
  viewingAsMemberId: string;
};

export function SidebarNav({ members, realMemberId, viewingAsMemberId }: Props) {
  const pathname = usePathname();
  const realMemberName = members.find((m) => m.id === realMemberId)?.name ?? "Me";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto p-4 md:flex">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/60" />
        <div>
          <p className="text-base leading-tight font-semibold">Couple Budget</p>
          <p className="text-xs text-muted-foreground">
            Plan together, grow together
          </p>
        </div>
      </div>

      <Button asChild className="mb-4" size={"lg"}>
        <Link href="/expenses/new">+ Add Expense</Link>
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          if (!item.enabled) {
            return (
              <div
                aria-disabled="true"
                className="flex cursor-default items-center gap-3  px-3 py-2 text-sm text-muted-foreground"
                key={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </div>
            );
          }
          const active = pathname.startsWith(item.href);
          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-r-lg border-l-3 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:bg-accent",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-1 border-t pt-4">
        <div className="flex items-center gap-2 rounded-lg px-1 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {realMemberName.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{realMemberName}</p>
            <p className="text-xs text-muted-foreground">View profile</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>

        <ViewingAsSwitcher
          members={members}
          realMemberId={realMemberId}
          viewingAsMemberId={viewingAsMemberId}
        />
      </div>
    </aside>
  );
}
