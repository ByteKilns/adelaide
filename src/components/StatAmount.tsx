import type { ReactNode } from "react";

// The primary figure inside a StatCardGrid card — every page's stat cards
// (Dashboard, Budget, Recurring, Savings Goals, Notifications) render this
// exact style for their headline number, so it lives here once instead of
// each page repeating the className.
export function StatAmount({ children }: { children: ReactNode }) {
  return <p className="text-md font-extrabold">{children}</p>;
}
