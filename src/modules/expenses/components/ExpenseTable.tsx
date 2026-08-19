"use client";

import { useState, useTransition } from "react";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { deleteExpenseAction } from "@/modules/expenses/api/expenses.actions";
import { OwnerAvatar } from "@/modules/expenses/components/OwnerAvatar";
import { type MemberRole, roleForOwner } from "@/modules/expenses/lib/member-tone";

export type ExpenseRow = {
  amount: number;
  categoryGroupName: string;
  categoryName: string;
  date: string;
  id: string;
  note: string | null;
  ownerMemberId: string | null;
  ownerName: string | null;
  paidByMemberId: string;
  paidByName: string;
};

type Props = {
  partnerName: string | null;
  realMemberId: string;
  rows: ExpenseRow[];
};

type Tab = "all" | "me" | "partner" | "shared";

function displayLabel(role: MemberRole, name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

const TAB_TRIGGER_CLASS =
  "rounded-none border-b-2 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export function ExpenseTable({ partnerName, realMemberId, rows }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [pendingId, setPendingId] = useState<null | string>(null);
  const [, startTransition] = useTransition();

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    if (tab === "me") return r.ownerMemberId === realMemberId;
    if (tab === "shared") return r.ownerMemberId === null;
    return r.ownerMemberId !== null && r.ownerMemberId !== realMemberId;
  });

  function handleDelete(id: string) {
    if (!window.confirm("Delete this expense?")) return;
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteExpenseAction(id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Tabs onValueChange={(v) => setTab(v as Tab)} value={tab}>
        <TabsList className="w-full justify-start gap-4 rounded-none border-b bg-transparent p-0">
          <TabsTrigger className={TAB_TRIGGER_CLASS} value="all">
            All
          </TabsTrigger>
          <TabsTrigger className={TAB_TRIGGER_CLASS} value="me">
            Me
          </TabsTrigger>
          {partnerName && (
            <TabsTrigger className={TAB_TRIGGER_CLASS} value="partner">
              {partnerName}
            </TabsTrigger>
          )}
          <TabsTrigger className={TAB_TRIGGER_CLASS} value="shared">
            Shared
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-normal">Date</th>
              <th className="p-3 font-normal">Category</th>
              <th className="p-3 font-normal">Owner</th>
              <th className="p-3 font-normal">Paid by</th>
              <th className="p-3 text-right font-normal">Amount</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  No expenses in this view.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const ownerRole = roleForOwner(r.ownerMemberId, realMemberId);
              const paidByRole: MemberRole = r.paidByMemberId === realMemberId ? "me" : "partner";
              return (
                <tr className="border-b last:border-0" key={r.id}>
                  <td className="p-3 whitespace-nowrap">{r.date}</td>
                  <td className="p-3">
                    <p className="font-medium">{r.categoryName}</p>
                    {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <OwnerAvatar name={r.ownerName ?? ""} role={ownerRole} />
                      <span>{displayLabel(ownerRole, r.ownerName)}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <OwnerAvatar name={r.paidByName} role={paidByRole} />
                      <span>{paidByRole === "me" ? "Me" : r.paidByName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-semibold">-{formatNPR(r.amount)}</td>
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-md p-1 text-muted-foreground hover:bg-accent" type="button">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/expenses/${r.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={pendingId === r.id}
                          onClick={() => handleDelete(r.id)}
                          variant="destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing all {filtered.length} expense{filtered.length === 1 ? "" : "s"} this month.
      </p>
    </div>
  );
}
