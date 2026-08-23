"use client";

import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";

import { cn } from "@/lib/utils";

type Props = {
  containerClassName?: string;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  // "YYYY-MM-DD" in AD (Gregorian) — the picker shows/lets the user browse
  // in BS, but the value in and out of this field is always AD, matching
  // every date column and zod schema in the app unchanged.
  value: string;
};

// The underlying picker doesn't expose an `id` for its input, so a
// <Label htmlFor> can't be wired to it — this renders a plain label
// instead, matching TextField's look without a broken association.
export function NepaliDateField({ containerClassName, error, label, onChange, value }: Props) {
  return (
    <div className={cn("space-y-1", containerClassName)}>
      <p className="text-sm leading-none font-medium select-none">{label}</p>
      <NepaliDatePicker
        inputClassName={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
          error && "border-destructive",
        )}
        onChange={onChange}
        options={{ calenderLocale: "ne", valueLocale: "en" }}
        value={value}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
