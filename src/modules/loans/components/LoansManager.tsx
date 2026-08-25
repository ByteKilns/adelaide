"use client";

import { useMemo, useState } from "react";

import { Grid3x3, List, Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/DataTable";
import { TabSwitcher } from "@/components/TabSwitcher";
import { Button } from "@/components/ui/button";
import type { DateFormat } from "@/lib/date-format-cookie";
import { deleteLoanAction } from "@/modules/loans/api/loans.actions";
import { LoanCard } from "@/modules/loans/components/LoanCard";
import { type LoanEditing, LoanForm } from "@/modules/loans/components/LoanForm";
import { LoanPaymentForm } from "@/modules/loans/components/LoanPaymentForm";
import { useLoanTableColumns } from "@/modules/loans/hooks/useLoanTableColumns";
import type { LoanCardData } from "@/modules/loans/lib/loan-stats";

type Tab = "all" | "given" | "taken";

type Member = { id: string; name: string };

type Props = {
  currentMemberId: string;
  dateFormat: DateFormat;
  loans: LoanCardData[];
  members: Member[];
  realMemberId: string;
};

export function LoansManager({ currentMemberId, dateFormat, loans, members, realMemberId }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoanEditing | null>(null);
  const [paymentLoan, setPaymentLoan] = useState<LoanCardData | null>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(loan: LoanCardData) {
    setEditing({
      counterpartyName: loan.counterpartyName,
      date: loan.date,
      direction: loan.direction,
      dueDate: loan.dueDate,
      id: loan.id,
      installmentAmount: loan.installmentAmount,
      installmentFrequency: loan.installmentFrequency,
      nextInstallmentDate: loan.nextInstallmentDate,
      note: loan.note ?? "",
      ownerMemberId: loan.ownerMemberId,
      principalAmount: loan.principalAmount,
    });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this loan? Its payment history will be removed too.")) return;
    try {
      await deleteLoanAction(id);
      toast.success("Loan deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const filtered = useMemo(() => {
    if (tab === "all") return loans;
    return loans.filter((l) => l.direction === tab);
  }, [loans, tab]);

  const columns = useLoanTableColumns(realMemberId, setPaymentLoan, openEdit, handleDelete);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabSwitcher
          onValueChange={(v) => setTab(v as Tab)}
          tabs={[
            { label: "All", value: "all" },
            { label: "Lent Out", value: "given" },
            { label: "Borrowed", value: "taken" },
          ]}
          value={tab}
        />

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5">
            <Button
              className="h-8 w-8"
              onClick={() => setView("grid")}
              size="icon"
              type="button"
              variant={view === "grid" ? "default" : "ghost"}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8"
              onClick={() => setView("list")}
              size="icon"
              type="button"
              variant={view === "list" ? "default" : "ghost"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={openAdd} type="button">
            <Plus className="h-4 w-4" />
            Add Loan
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="space-y-3">
          {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No loans in this view.</p>}
          {filtered.map((loan) => (
            <LoanCard
              dateFormat={dateFormat}
              key={loan.id}
              loan={loan}
              onAddPayment={setPaymentLoan}
              onDelete={handleDelete}
              onEdit={openEdit}
              realMemberId={realMemberId}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} emptyMessage="No loans in this view." itemLabel="loans" rowKey={(l) => l.id} rows={filtered} />
      )}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 text-sm font-medium text-primary hover:bg-primary/5"
        onClick={openAdd}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Add a Loan
      </button>

      <LoanForm
        currentMemberId={currentMemberId}
        editing={editing}
        key={editing?.id ?? "new"}
        members={members}
        onOpenChange={setFormOpen}
        open={formOpen}
      />

      <LoanPaymentForm
        counterpartyName={paymentLoan?.counterpartyName ?? ""}
        currentMemberId={currentMemberId}
        key={paymentLoan?.id ?? "none"}
        loanId={paymentLoan?.id ?? null}
        members={members}
        onOpenChange={(open) => !open && setPaymentLoan(null)}
        open={paymentLoan !== null}
      />
    </div>
  );
}
