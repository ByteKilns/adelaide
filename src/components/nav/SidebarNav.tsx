"use client";

import { useState } from "react";

import {
  BarChart3,
  Bell,
  ChevronDown,
  Home,
  List,
  LogOut,
  type LucideIcon,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { AddExpenseModal } from "@/modules/expenses/components/AddExpenseModal";

import { ViewingAsSwitcher } from "./ViewingAsSwitcher";

type NavItem = { enabled: boolean; href: string; icon: LucideIcon; label: string; };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, enabled: true },
  { href: "/expenses", label: "Expenses", icon: Receipt, enabled: true },
  { href: "/budget", label: "Budget", icon: Wallet, enabled: true },
  { href: "/recurring", label: "Recurring", icon: Repeat, enabled: false },
  { href: "/savings-goals", label: "Savings Goals", icon: PiggyBank, enabled: false },
  { href: "/reports", label: "Reports", icon: BarChart3, enabled: false },
  { href: "/categories", label: "Categories", icon: List, enabled: true },
  { href: "/notifications", label: "Notifications", icon: Bell, enabled: false },
  { href: "/settings", label: "Settings", icon: Settings, enabled: true },
];

type Member = { id: string; image: null | string; name: string };
type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  currentMemberId: string;
  members: Member[];
  realMemberId: string;
  viewingAsMemberId: string;
};

export function SidebarNav({ categories, currentMemberId, members, realMemberId, viewingAsMemberId }: Props) {
  const pathname = usePathname();
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const realMember = members.find((m) => m.id === realMemberId);
  const realMemberName = realMember?.name ?? "Me";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto p-4 md:flex">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/60" />
        <div>
          <p className="text-base leading-tight font-semibold">Adelaide</p>
          <p className="text-xs text-muted-foreground">
            Plan together, grow together
          </p>
        </div>
      </div>

      <Button className="mb-4" onClick={() => setAddExpenseOpen(true)} size={"lg"}>
        + Add Expense
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-accent"
              type="button"
            >
              <Avatar className="size-8" size="sm">
                {realMember?.image && (
                  <AvatarImage alt={realMemberName} src={realMember.image} />
                )}
                <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                  {realMemberName.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">{realMemberName}</p>
                <p className="text-xs text-muted-foreground">Account</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logoutAction()} variant="destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ViewingAsSwitcher
          members={members}
          realMemberId={realMemberId}
          viewingAsMemberId={viewingAsMemberId}
        />
      </div>

      <AddExpenseModal
        categories={categories}
        currentMemberId={currentMemberId}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        onOpenChange={setAddExpenseOpen}
        open={addExpenseOpen}
      />
    </aside>
  );
}
