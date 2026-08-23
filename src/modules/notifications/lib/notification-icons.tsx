import { CircleAlert, CircleCheck, Info, type LucideIcon, TriangleAlert } from "lucide-react";

import type { Tone } from "@/components/ToneIcon";

export type NotificationSeverity = "danger" | "info" | "success" | "warning";

const SEVERITY_ICON: Record<NotificationSeverity, LucideIcon> = {
  danger: CircleAlert,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
};

const SEVERITY_TONE: Record<NotificationSeverity, Tone> = {
  danger: "pink",
  info: "blue",
  success: "green",
  warning: "amber",
};

export function getSeverityIcon(severity: NotificationSeverity): LucideIcon {
  return SEVERITY_ICON[severity];
}

export function getSeverityTone(severity: NotificationSeverity): Tone {
  return SEVERITY_TONE[severity];
}
