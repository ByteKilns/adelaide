import { formatBsShortDate } from "@/lib/nepali-date";

export function formatNotificationTime(createdAt: Date): string {
  const now = Date.now();
  const diffMs = now - createdAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const createdDay = new Date(createdAt);
  createdDay.setHours(0, 0, 0, 0);

  if (createdDay.getTime() === yesterday.getTime()) return "Yesterday";
  return formatBsShortDate(createdAt.toISOString().slice(0, 10));
}
