import {
  Users,
  Landmark,
  ShoppingCart,
  Car,
  Heart,
  User,
  PiggyBank,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "@/components/dashboard/tone_icon";

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
