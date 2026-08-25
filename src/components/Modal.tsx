"use client";

import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import type { Tone } from "@/components/ToneIcon";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  icon?: LucideIcon;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  tone?: Tone;
};

// Every modal in the app should go through this component instead of
// reassembling Dialog/DialogContent/DialogHeader/DialogFooter by hand —
// that's where the sticky-header/scrollable-body/sticky-footer layout and
// the icon+tone header treatment live, in one place.
//
// `bodyClassName` is an escape hatch for content with its own floating
// overlay (e.g. a date picker that isn't portaled) that needs to render
// past the body's default `overflow-y-auto` instead of being clipped/
// trapped inside it — pass `overflow-visible` there (and cancel
// DialogContent's own `overflow-hidden` via `className`) to let it float
// over the dialog instead.
export function Modal({ bodyClassName, children, className, footer, icon, onOpenChange, open, title, tone }: Props) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={className}>
        <DialogHeader icon={icon} tone={tone}>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className={cn("min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4", bodyClassName)}>{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
