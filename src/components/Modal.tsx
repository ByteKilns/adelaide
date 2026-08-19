"use client";

import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import type { Tone } from "@/components/ToneIcon";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
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
export function Modal({ children, className, footer, icon, onOpenChange, open, title, tone }: Props) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={className}>
        <DialogHeader icon={icon} tone={tone}>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
