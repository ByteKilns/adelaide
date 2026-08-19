import {
  Car,
  Heart,
  Landmark,
  type LucideIcon,
  MoreHorizontal,
  PiggyBank,
  ShoppingCart,
  User,
  Users,
} from "lucide-react";

import type { Tone } from "@/modules/dashboard/components/ToneIcon";

const GROUP_ICONS: Record<string, LucideIcon> = {
  Family: Users,
  Obligations: Landmark,
  Household: ShoppingCart,
  Transportation: Car,
  Lifestyle: Heart,
  Personal: User,
  Financial: PiggyBank,
  Other: MoreHorizontal,
};

export function getCategoryIcon(groupName: string): LucideIcon {
  return GROUP_ICONS[groupName] ?? MoreHorizontal;
}

const GROUP_TONES: Record<string, Tone> = {
  Family: "pink",
  Obligations: "purple",
  Household: "green",
  Transportation: "orange",
  Lifestyle: "pink",
  Personal: "purple",
  Financial: "purple",
  Other: "blue",
};

export function getCategoryTone(groupName: string): Tone {
  return GROUP_TONES[groupName] ?? "blue";
}
