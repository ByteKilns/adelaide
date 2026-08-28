"use client";

import { ErrorState } from "@/components/ErrorState";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState error={error} reset={reset} />
    </div>
  );
}
