// Shared between src/app/layout.tsx (reads it, server-side, to avoid a
// flash of the wrong accent color) and the settings module (writes it).
export const ACCENT_COLOR_COOKIE_NAME = "accent-color";

export const ACCENT_COLORS = ["purple", "blue", "green", "pink", "orange"] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

export function isAccentColor(value: string): value is AccentColor {
  return (ACCENT_COLORS as readonly string[]).includes(value);
}
