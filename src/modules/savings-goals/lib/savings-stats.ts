export type GoalStatus = "at-risk" | "behind" | "on-track";

export type Goal = {
  createdAt: Date;
  id: string;
  targetAmount: number;
  targetDate: null | string;
};

export type Contribution = { amount: number; date: string; goalId: string };

export function savedAmountForGoal(goalId: string, contributions: Contribution[]): number {
  return contributions.filter((c) => c.goalId === goalId).reduce((s, c) => s + c.amount, 0);
}

// Compares how far through the goal's timeline we are against how much of
// the target has actually been saved. No target date means there's no
// schedule to fall behind on, so it's always "on-track".
export function classifyGoal(goal: Goal, saved: number): GoalStatus {
  if (goal.targetAmount <= 0 || saved >= goal.targetAmount) return "on-track";
  if (!goal.targetDate) return "on-track";

  const start = goal.createdAt.getTime();
  const end = new Date(`${goal.targetDate}T00:00:00`).getTime();
  const now = Date.now();
  if (end <= start) return saved >= goal.targetAmount ? "on-track" : "at-risk";

  const timeElapsedPct = Math.min(1, Math.max(0, (now - start) / (end - start)));
  const progressPct = Math.min(1, saved / goal.targetAmount);
  const diff = progressPct - timeElapsedPct;

  if (diff >= -0.1) return "on-track";
  if (diff >= -0.25) return "behind";
  return "at-risk";
}

export function monthlyTotals(
  contributions: Contribution[],
  monthsBack: number,
): { cumulative: number; label: string }[] {
  const now = new Date();
  const months: { label: string; month: number; year: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleString("en-US", { month: "short" }), month: d.getMonth() + 1, year: d.getFullYear() });
  }

  const sorted = [...contributions].sort((a, b) => a.date.localeCompare(b.date));
  let runningTotal = 0;
  let contribIndex = 0;

  return months.map(({ label, month, year }) => {
    const monthEnd = new Date(year, month, 0);
    while (contribIndex < sorted.length && new Date(`${sorted[contribIndex].date}T00:00:00`) <= monthEnd) {
      runningTotal += sorted[contribIndex].amount;
      contribIndex++;
    }
    return { cumulative: runningTotal, label };
  });
}

function isInMonth(dateStr: string, year: number, month: number) {
  const [y, m] = dateStr.split("-").map(Number);
  return y === year && m === month;
}

export type SavingsOverviewStats = {
  averageProgress: number;
  lastMonthContribution: number;
  monthlyContribution: number;
  totalGoals: number;
  totalSaved: number;
};

export function savingsOverviewStats(
  goals: Goal[],
  contributions: Contribution[],
  year: number,
  month: number,
): SavingsOverviewStats {
  const totalSaved = contributions.reduce((s, c) => s + c.amount, 0);
  const monthlyContribution = contributions.filter((c) => isInMonth(c.date, year, month)).reduce((s, c) => s + c.amount, 0);
  const lastMonthDate = new Date(year, month - 2, 1);
  const lastMonthContribution = contributions
    .filter((c) => isInMonth(c.date, lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1))
    .reduce((s, c) => s + c.amount, 0);

  const progressPcts = goals
    .filter((g) => g.targetAmount > 0)
    .map((g) => Math.min(1, savedAmountForGoal(g.id, contributions) / g.targetAmount));
  const averageProgress =
    progressPcts.length > 0 ? Math.round((progressPcts.reduce((s, p) => s + p, 0) / progressPcts.length) * 100) : 0;

  return { averageProgress, lastMonthContribution, monthlyContribution, totalGoals: goals.length, totalSaved };
}
