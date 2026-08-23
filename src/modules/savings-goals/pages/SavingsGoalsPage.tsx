import { CheckCircle2, Clock, PiggyBank, Target } from "lucide-react";

import { StatCardGrid } from "@/components/StatCardGrid";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { listSavingsContributions, listSavingsGoals } from "@/modules/savings-goals/api/savings-goals.actions";
import type { GoalCardData } from "@/modules/savings-goals/components/GoalCard";
import { GoalProgressOverviewCard } from "@/modules/savings-goals/components/GoalProgressOverviewCard";
import { type ContributionEntry, RecentContributionsCard } from "@/modules/savings-goals/components/RecentContributionsCard";
import { SavingsGoalsHeader } from "@/modules/savings-goals/components/SavingsGoalsHeader";
import { SavingsGoalsManager } from "@/modules/savings-goals/components/SavingsGoalsManager";
import { SavingsOverviewCard } from "@/modules/savings-goals/components/SavingsOverviewCard";
import { classifyGoal, type GoalStatus, monthlyTotals, savedAmountForGoal, savingsOverviewStats } from "@/modules/savings-goals/lib/savings-stats";

export async function SavingsGoalsPage() {
  const { householdId, memberId } = await getCurrentMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [members, goalRows, contributionRows] = await Promise.all([
    getHouseholdMembers(householdId),
    listSavingsGoals(householdId),
    listSavingsContributions(householdId),
  ]);

  const memberById = new Map(members.map((m) => [m.id, m]));
  const partner = members.find((m) => m.id !== memberId) ?? null;

  const contributions = contributionRows.map((c) => ({ amount: Number(c.amount), date: c.date, goalId: c.goalId }));

  const goals: GoalCardData[] = goalRows.map((g) => {
    const saved = savedAmountForGoal(g.id, contributions);
    const targetAmount = Number(g.targetAmount);
    const owner = g.ownerMemberId ? memberById.get(g.ownerMemberId) : null;
    return {
      createdAt: g.createdAt,
      description: g.description,
      id: g.id,
      image: g.image,
      name: g.name,
      ownerMemberId: g.ownerMemberId,
      ownerName: owner?.user.name ?? null,
      pct: targetAmount > 0 ? Math.round((saved / targetAmount) * 100) : 0,
      saved,
      status: classifyGoal({ createdAt: g.createdAt, id: g.id, targetAmount, targetDate: g.targetDate }, saved),
      targetAmount,
      targetDate: g.targetDate,
    };
  });

  const statusCounts: Record<GoalStatus, number> = { "at-risk": 0, behind: 0, "on-track": 0 };
  for (const goal of goals) statusCounts[goal.status]++;

  const stats = savingsOverviewStats(
    goalRows.map((g) => ({ createdAt: g.createdAt, id: g.id, targetAmount: Number(g.targetAmount), targetDate: g.targetDate })),
    contributions,
    year,
    month,
  );
  const vsLastMonthPct =
    stats.lastMonthContribution > 0
      ? Math.round(((stats.monthlyContribution - stats.lastMonthContribution) / stats.lastMonthContribution) * 100)
      : null;

  const points = monthlyTotals(contributions, 6);

  const contributionEntries: ContributionEntry[] = contributionRows.map((c) => {
    const goal = goalRows.find((g) => g.id === c.goalId);
    const member = memberById.get(c.memberId);
    const role = member ? (member.id === memberId ? "me" : "partner") : "shared";
    return {
      amount: Number(c.amount),
      date: c.date,
      goalImage: goal?.image ?? null,
      goalName: goal?.name ?? "Unknown goal",
      id: c.id,
      ownerLabel: member?.user.name ?? "Unknown",
      role,
    };
  });

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <SavingsGoalsHeader monthLabel={monthLabel} />

      <StatCardGrid
        cards={[
          {
            content: (
              <div>
                <p className="text-xl font-semibold">{formatNPR(stats.totalSaved)}</p>
                <p className="text-xs text-muted-foreground">Across all goals</p>
              </div>
            ),
            icon: Target,
            title: "Total Saved",
            tone: "purple",
          },
          {
            content: (
              <div>
                <p className="text-xl font-semibold">{formatNPR(stats.monthlyContribution)}</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            ),
            icon: PiggyBank,
            title: "Monthly Contribution",
            tone: "green",
          },
          {
            content: (
              <div>
                <p className="text-xl font-semibold">{stats.totalGoals}</p>
                <p className="text-xs text-muted-foreground">Active goals</p>
              </div>
            ),
            icon: Clock,
            title: "Total Goals",
            tone: "amber",
          },
          {
            content: (
              <div>
                <p className="text-xl font-semibold">{stats.averageProgress}%</p>
                <p className="text-xs text-muted-foreground">Across all goals</p>
              </div>
            ),
            icon: CheckCircle2,
            title: "Average Progress",
            tone: "blue",
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SavingsGoalsManager
            currentMemberId={memberId}
            goals={goals}
            members={members.map((m) => ({ id: m.id, name: m.user.name }))}
            partnerName={partner?.user.name ?? null}
            realMemberId={memberId}
          />
        </div>

        <div className="space-y-6">
          <SavingsOverviewCard monthlyContribution={stats.monthlyContribution} points={points} vsLastMonthPct={vsLastMonthPct} />
          <GoalProgressOverviewCard averageProgress={stats.averageProgress} counts={statusCounts} />
          <RecentContributionsCard items={contributionEntries} />
        </div>
      </div>
    </div>
  );
}
