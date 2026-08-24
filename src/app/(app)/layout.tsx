import { cookies } from "next/headers";

import { BottomNav } from "@/components/nav/BottomNav";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { getCurrentMember, getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { SIDEBAR_COLLAPSED_COOKIE_NAME } from "@/lib/sidebar-cookie";
import { listCategories } from "@/modules/categories/api/categories";
import { countUnreadNotifications } from "@/modules/notifications/api/notifications.actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentMember();
  const [members, effective, categories, unreadNotifications, cookieStore] = await Promise.all([
    getHouseholdMembers(current.householdId),
    getEffectiveMember(current),
    listCategories(current.householdId),
    countUnreadNotifications(current.householdId),
    cookies(),
  ]);

  const expenseCategories = categories.map((c) => ({ id: c.id, name: c.name }));
  const expenseMembers = members.map((m) => ({ id: m.id, name: m.user.name }));
  const initialCollapsed = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE_NAME)?.value === "true";

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        categories={expenseCategories}
        currentMemberId={current.memberId}
        initialCollapsed={initialCollapsed}
        members={members.map((m) => ({ id: m.id, image: m.user.image, name: m.user.name }))}
        realMemberId={current.memberId}
        unreadNotifications={unreadNotifications}
        viewingAsMemberId={effective.memberId}
      />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav categories={expenseCategories} currentMemberId={current.memberId} members={expenseMembers} />
    </div>
  );
}
