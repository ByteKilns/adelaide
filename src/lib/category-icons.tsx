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
