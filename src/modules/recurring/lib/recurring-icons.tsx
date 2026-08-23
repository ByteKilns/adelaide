import {
  Building2,
  Car,
  CreditCard,
  Dumbbell,
  Gift,
  HeartPulse,
  Home,
  Landmark,
  type LucideIcon,
  Music2,
  Receipt,
  Shield,
  Smartphone,
  Tv,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

export const RECURRING_ICONS = [
  "home",
  "wifi",
  "zap",
  "shield",
  "tv",
  "music",
  "heartPulse",
  "building",
  "car",
  "creditCard",
  "phone",
  "landmark",
  "users",
  "gift",
  "dumbbell",
  "receipt",
] as const;

export type RecurringIcon = (typeof RECURRING_ICONS)[number];

const ICON_MAP: Record<RecurringIcon, LucideIcon> = {
  building: Building2,
  car: Car,
  creditCard: CreditCard,
  dumbbell: Dumbbell,
  gift: Gift,
  heartPulse: HeartPulse,
  home: Home,
  landmark: Landmark,
  music: Music2,
  phone: Smartphone,
  receipt: Receipt,
  shield: Shield,
  tv: Tv,
  users: Users,
  wifi: Wifi,
  zap: Zap,
};

export function getRecurringIcon(icon: string): LucideIcon {
  return ICON_MAP[icon as RecurringIcon] ?? Receipt;
}
