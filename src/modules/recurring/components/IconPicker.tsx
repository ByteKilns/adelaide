"use client";

import { cn } from "@/lib/utils";
import { getRecurringIcon, RECURRING_ICONS, type RecurringIcon } from "@/modules/recurring/lib/recurring-icons";

type Props = { onChange: (icon: RecurringIcon) => void; value: RecurringIcon };

export function IconPicker({ onChange, value }: Props) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">Icon</p>
      <div className="grid grid-cols-8 gap-2">
        {RECURRING_ICONS.map((icon) => {
          const Icon = getRecurringIcon(icon);
          const selected = icon === value;
          return (
            <button
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent bg-muted text-muted-foreground hover:bg-accent",
              )}
              key={icon}
              onClick={() => onChange(icon)}
              type="button"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
