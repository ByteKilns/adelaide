"use client";

import { Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/Modal";
import { ExpenseForm } from "@/modules/expenses/components/ExpenseForm";

type Props = {
  categories: { id: string; name: string }[];
  currentMemberId: string;
  members: { id: string; name: string }[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function AddExpenseModal({ categories, currentMemberId, members, onOpenChange, open }: Props) {
  const router = useRouter();

  return (
    <Modal icon={Receipt} onOpenChange={onOpenChange} open={open} title="Add Expense" tone="pink">
      <ExpenseForm
        categories={categories}
        currentMemberId={currentMemberId}
        members={members}
        onSuccess={() => {
          onOpenChange(false);
          router.refresh();
        }}
      />
    </Modal>
  );
}
