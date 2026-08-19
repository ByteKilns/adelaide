"use client";

import { useState, useTransition } from "react";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccentColor } from "@/lib/accent-color-cookie";
import { setAccentColorAction } from "@/modules/settings/api/settings.actions";

const MODES = [
  { icon: Sun, label: "Light", value: "light" },
  { icon: Moon, label: "Dark", value: "dark" },
  { icon: Monitor, label: "System", value: "system" },
] as const;

const ACCENT_SWATCHES: { color: AccentColor; hex: string; label: string }[] = [
  { color: "purple", hex: "#662d91", label: "Purple" },
  { color: "blue", hex: "#2563eb", label: "Blue" },
  { color: "green", hex: "#15803d", label: "Green" },
  { color: "pink", hex: "#be185d", label: "Pink" },
  { color: "orange", hex: "#c2410c", label: "Orange" },
];

export function ThemeSection({ initialAccent }: { initialAccent: AccentColor }) {
  const { setTheme, theme } = useTheme();
  const [accent, setAccent] = useState(initialAccent);
  const [, startTransition] = useTransition();

  function handleAccentClick(color: AccentColor) {
    setAccent(color);
    startTransition(async () => {
      try {
        await setAccentColorAction(color);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save accent color");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Theme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Appearance</p>
          <div className="flex gap-2">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const active = (theme ?? "system") === mode.value;
              return (
                <button
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    active ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground"
                  }`}
                  key={mode.value}
                  onClick={() => setTheme(mode.value)}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Accent color</p>
          <div className="flex gap-3">
            {ACCENT_SWATCHES.map((swatch) => (
              <button
                aria-label={swatch.label}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
                key={swatch.color}
                onClick={() => handleAccentClick(swatch.color)}
                style={{
                  backgroundColor: swatch.hex,
                  boxShadow: accent === swatch.color ? `0 0 0 2px var(--background), 0 0 0 4px ${swatch.hex}` : "none",
                }}
                type="button"
              >
                {accent === swatch.color && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
