import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  children: ReactNode;
};

export function DashboardPanel({ title, actionLabel, actionHref, children }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        {actionLabel && actionHref && (
          <Link href={actionHref} className="text-sm text-primary underline">
            {actionLabel}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
