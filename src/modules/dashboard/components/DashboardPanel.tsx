import type { ReactNode } from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = { actionHref?: string; actionLabel?: string; children: ReactNode; className?: string; title: string };

export function DashboardPanel({ actionHref, actionLabel, children, className, title }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-6 shadow-[0_2px_12px_rgba(102,45,145,0.08)]",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
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
