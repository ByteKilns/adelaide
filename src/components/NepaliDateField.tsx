"use client";

import { ADToBS, BSToAD } from "bikram-sambat-js";
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";

import { cn } from "@/lib/utils";

type Props = {
  containerClassName?: string;
  error?: string;
  inputClassName?: string;
  // Omit to render without the label paragraph — for dense contexts (e.g. a
  // table cell) that already have a column header doing that job.
  label?: string;
  onChange: (value: string) => void;
  // "YYYY-MM-DD" in AD (Gregorian) — every date column and zod schema in
  // the app stores/expects AD. The underlying picker library does NOT
  // convert its `value`/`onChange` between calendars itself — despite its
  // name, it just relabels whatever date it's given with BS month names at
  // the same raw numeric month position (so "2026-08-25" would render as
  // "25 Mangsir 2026" — Mangsir being the 8th BS month, same position as
  // August — instead of the real BS equivalent, "9 Bhadra 2083"). So the
  // AD<->BS conversion has to happen here, around the library, using the
  // same bikram-sambat-js the rest of the app's display formatting uses.
  value: string;
};

// The underlying picker doesn't expose an `id` for its input, so a
// <Label htmlFor> can't be wired to it — this renders a plain label
// instead, matching TextField's look without a broken association.
export function NepaliDateField({ containerClassName, error, inputClassName, label, onChange, value }: Props) {
  const bsValue = value ? ADToBS(value) : "";

  function handleChange(bsDate: string) {
    if (!bsDate) return;
    onChange(BSToAD(bsDate));
  }

  return (
    <div className={cn("space-y-1", containerClassName)}>
      {label && <p className="text-sm leading-none font-medium select-none">{label}</p>}
      <NepaliDatePicker
        inputClassName={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
          error && "border-destructive",
          inputClassName,
        )}
        onChange={handleChange}
        options={{ calenderLocale: "en", valueLocale: "en" }}
        value={bsValue}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
