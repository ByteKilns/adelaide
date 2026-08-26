import { PiggyBank, RotateCw, Users, Wallet } from "lucide-react";

import { StatAmount } from "@/components/StatAmount";
import { StatCardGrid } from "@/components/StatCardGrid";
import { getDateFormatPref } from "@/lib/date-format-cookie";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { listDhukuEntries, listDhukus } from "@/modules/dhuku/api/dhuku.actions";
import { DhukuHeader } from "@/modules/dhuku/components/DhukuHeader";
import { DhukuManager } from "@/modules/dhuku/components/DhukuManager";
import { buildDhukuCards, dhukuOverviewStats } from "@/modules/dhuku/lib/dhuku-stats";

export async function DhukuPage() {
  const { householdId, memberId } = await getCurrentMember();

  const [members, dhukuRows, entryRows, dateFormat] = await Promise.all([
    getHouseholdMembers(householdId),
    listDhukus(householdId),
    listDhukuEntries(householdId),
    getDateFormatPref(householdId),
  ]);

  const memberById = new Map(members.map((m) => [m.id, m]));
  const dhukus = buildDhukuCards(dhukuRows, entryRows, memberById);
  const stats = dhukuOverviewStats(dhukus);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <DhukuHeader />

      <StatCardGrid
        cards={[
          {
            content: (
              <div>
                <StatAmount>{stats.activeCount}</StatAmount>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </div>
            ),
            icon: Users,
            title: "Active Dhukus",
            tone: "blue",
          },
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.dueThisMonth)}</StatAmount>
                <p className="text-xs text-muted-foreground">Across active dhukus</p>
              </div>
            ),
            icon: Wallet,
            title: "Due This Month",
            tone: "amber",
          },
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.totalContributed)}</StatAmount>
                <p className="text-xs text-muted-foreground">All-time</p>
              </div>
            ),
            icon: RotateCw,
            title: "Total Contributed",
            tone: "green",
          },
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.totalReceived)}</StatAmount>
                <p className="text-xs text-muted-foreground">Payouts taken</p>
              </div>
            ),
            icon: PiggyBank,
            title: "Total Received",
            tone: "pink",
          },
        ]}
      />

      <DhukuManager
        currentMemberId={memberId}
        dateFormat={dateFormat}
        dhukus={dhukus}
        members={members.map((m) => ({ id: m.id, name: m.user.name }))}
        realMemberId={memberId}
      />
    </div>
  );
}
