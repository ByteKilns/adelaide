import { BottomNav } from "@/components/nav/BottomNav";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { getCurrentMember, getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentMember();
  const [members, effective, categories] = await Promise.all([
    getHouseholdMembers(current.householdId),
    getEffectiveMember(current),
    listCategories(current.householdId),
  ]);

  const expenseCategories = categories.map((c) => ({ id: c.id, name: c.name }));
  const expenseMembers = members.map((m) => ({ id: m.id, name: m.user.name }));

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        categories={expenseCategories}
        currentMemberId={current.memberId}
        members={members.map((m) => ({ id: m.id, image: m.user.image, name: m.user.name }))}
        realMemberId={current.memberId}
        viewingAsMemberId={effective.memberId}
      />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav categories={expenseCategories} currentMemberId={current.memberId} members={expenseMembers} />
    </div>
  );
}
