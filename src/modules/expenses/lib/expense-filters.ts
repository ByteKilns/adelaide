import type { ExpenseRow } from "@/modules/expenses/hooks/useExpenseTableColumns";

export type ExpenseTab = "all" | "me" | "partner" | "shared";

export type ExpenseFilters = {
  categoryId: string;
  endDate: string;
  ownerFilter: string;
  paidByMemberId: string;
  query: string;
  realMemberId: string;
  startDate: string;
  tab: ExpenseTab;
};

export function defaultExpenseFilters(realMemberId: string): ExpenseFilters {
  return {
    categoryId: "all",
    endDate: "",
    ownerFilter: "all",
    paidByMemberId: "all",
    query: "",
    realMemberId,
    startDate: "",
    tab: "all",
  };
}

export function filterExpenseRows(rows: ExpenseRow[], filters: ExpenseFilters): ExpenseRow[] {
  const query = filters.query.trim().toLowerCase();

  return rows.filter((r) => {
    if (filters.tab === "me" && r.ownerMemberId !== filters.realMemberId) return false;
    if (filters.tab === "shared" && r.ownerMemberId !== null) return false;
    if (filters.tab === "partner" && (r.ownerMemberId === null || r.ownerMemberId === filters.realMemberId)) {
      return false;
    }
    if (filters.startDate && r.date < filters.startDate) return false;
    if (filters.endDate && r.date > filters.endDate) return false;
    if (filters.categoryId !== "all" && r.categoryId !== filters.categoryId) return false;
    if (filters.ownerFilter === "shared" && r.ownerMemberId !== null) return false;
    if (filters.ownerFilter !== "all" && filters.ownerFilter !== "shared" && r.ownerMemberId !== filters.ownerFilter) {
      return false;
    }
    if (filters.paidByMemberId !== "all" && r.paidByMemberId !== filters.paidByMemberId) return false;
    if (query) {
      const haystack = `${r.categoryName} ${r.note ?? ""} ${r.ownerName ?? ""} ${r.paidByName}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
