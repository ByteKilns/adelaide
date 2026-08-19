import { BottomNav } from "@/components/nav/BottomNav";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { getCurrentMember, getEffectiveMember, getHouseholdMembers } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentMember();
  const [members, effective] = await Promise.all([
    getHouseholdMembers(current.householdId),
    getEffectiveMember(current),
  ]);

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        members={members.map((m) => ({ id: m.id, name: m.user.name }))}
        realMemberId={current.memberId}
        viewingAsMemberId={effective.memberId}
      />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
