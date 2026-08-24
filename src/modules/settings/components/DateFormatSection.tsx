"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DateFormat } from "@/lib/date-format-cookie";
import { setDateFormatAction } from "@/modules/settings/api/settings.actions";

const OPTIONS: { description: string; label: string; value: DateFormat }[] = [
  { description: "e.g. 15 Bhadra 2083", label: "Nepali (Bikram Sambat)", value: "nepali" },
  { description: "e.g. 15 August 2026", label: "English (Gregorian)", value: "english" },
];

export function DateFormatSection({ initialFormat }: { initialFormat: DateFormat }) {
  const [format, setFormat] = useState(initialFormat);
  const [, startTransition] = useTransition();

  function handleClick(value: DateFormat) {
    setFormat(value);
    startTransition(async () => {
      try {
        await setDateFormatAction(value);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save date format");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Date format</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        {OPTIONS.map((option) => {
          const active = format === option.value;
          return (
            <button
              className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm ${
                active ? "border-primary bg-primary/10" : "text-muted-foreground"
              }`}
              key={option.value}
              onClick={() => handleClick(option.value)}
              type="button"
            >
              <p className={active ? "font-medium text-primary" : "font-medium text-foreground"}>{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
