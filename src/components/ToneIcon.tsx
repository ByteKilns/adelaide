import type { LucideIcon } from "lucide-react";

export type Tone = "green" | "orange" | "pink" | "purple" | "amber" | "blue";

export const TONE_BADGE_CLASSES: Record<Tone, string> = {
  green: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  pink: "bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
};

// Solid fill color for tone-colored progress bars (distinct from the badge's
// light background + tinted-text pairing above).
export const TONE_BAR_CLASSES: Record<Tone, string> = {
  green: "bg-green-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
};

type Props = { className?: string; icon: LucideIcon; tone: Tone; };

export function ToneIcon({ icon: Icon, tone, className = "" }: Props) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_BADGE_CLASSES[tone]} ${className}`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}
