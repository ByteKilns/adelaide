import type { ReactNode } from "react";

import Link from "next/link";

type Props = {
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
  title: string;
};

export function DashboardPanel({ title, actionLabel, actionHref, children }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        {actionLabel && actionHref && (
          <Link className="text-sm text-primary underline" href={actionHref}>
            {actionLabel}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
