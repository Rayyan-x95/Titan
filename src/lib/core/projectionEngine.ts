import type { Account, Budget, Expense, SharedExpense } from '@/core/store/types';
import { safeAddCents, safeSubCents, normalizeCents } from './financeEngine';

export interface ProjectionPoint {
  date: string; // YYYY-MM-DD
  optimisticBalance: number; // in cents
  pessimisticBalance: number; // in cents
}

/**
 * Calculates next date for a recurrence rule.
 */
function getNextRecurrenceDate(
  currentDate: Date,
  type: 'daily' | 'weekly' | 'monthly',
  interval: number,
): Date {
  const next = new Date(currentDate.getTime());
  if (type === 'daily') {
    next.setDate(next.getDate() + interval);
  } else if (type === 'weekly') {
    next.setDate(next.getDate() + interval * 7);
  } else if (type === 'monthly') {
    next.setMonth(next.getMonth() + interval);
  }
  return next;
}

/**
 * Returns YYYY-MM-DD string representation of a Date object.
 */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateProjections({
  accounts,
  expenses,
  budgets,
  sharedExpenses,
  daysToProject = 180,
  now = new Date(),
}: {
  accounts: Account[];
  expenses: Expense[];
  budgets: Budget[];
  sharedExpenses: SharedExpense[];
  daysToProject?: number;
  now?: Date;
}): ProjectionPoint[] {
  // 1. Calculate Initial Total Balance (in cents)
  const initialBalance = accounts.reduce((sum, acc) => safeAddCents(sum, acc.balance), 0);

  // 2. Identify and isolate actual historical variable spending vs recurring rules
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentExpenses = expenses.filter(
    (e) => new Date(e.createdAt) >= thirtyDaysAgo && e.type === 'expense' && !e.isRecurring,
  );

  // Total actual variable spending over past 30 days
  const recentVariableSpendTotal = recentExpenses.reduce(
    (sum, e) => safeAddCents(sum, e.amount),
    0,
  );
  const avgDailyVariableSpend = Math.round(recentVariableSpendTotal / 30);

  // 3. Compute Budget caps
  // Convert all budgets to a monthly equivalent
  const totalMonthlyBudget = budgets.reduce((sum, b) => {
    const limit = b.limit;
    return safeAddCents(sum, b.period === 'weekly' ? limit * 4 : limit);
  }, 0);
  const dailyBudgetCap = Math.round(totalMonthlyBudget / 30);

  // 4. Extract pending receivables from Shared Split Expenses
  // Receivables are splits paid by the user where settlementStatus is 'pending' and the user is 'paidBy'
  const pendingReceivables = sharedExpenses.filter(
    (se) => se.settlementStatus === 'pending' && se.paidBy === 'primary' && !se.isSettlement,
  );

  const totalReceivables = pendingReceivables.reduce((sum, se) => {
    // Sum the debt of other participants (excluding the user 'primary')
    const otherDebt = se.participants
      .filter((p) => p.id !== 'primary')
      .reduce((s, p) => safeAddCents(s, p.amount), 0);
    return safeAddCents(sum, otherDebt);
  }, 0);

  // 5. Generate daily timeline trajectory
  const points: ProjectionPoint[] = [];
  let optBalance = initialBalance;
  let pesBalance = initialBalance;

  // Track next occurrences of recurring items forward
  interface ProjectedRecurring {
    id: string;
    amount: number;
    type: 'expense' | 'income';
    nextDate: Date;
    rule: { type: 'daily' | 'weekly' | 'monthly'; interval: number };
  }

  const recurringItems: ProjectedRecurring[] = expenses
    .filter((e) => e.isRecurring && e.recurrenceRule)
    .map((e) => {
      const baseDate = new Date(e.lastProcessedAt || e.createdAt);
      // Project the first future occurrence from baseDate
      let nextOccur = getNextRecurrenceDate(
        baseDate,
        e.recurrenceRule!.type,
        e.recurrenceRule!.interval,
      );
      // Ensure the first future occurrence is today or in the future
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      while (nextOccur < todayStart) {
        nextOccur = getNextRecurrenceDate(
          nextOccur,
          e.recurrenceRule!.type,
          e.recurrenceRule!.interval,
        );
      }
      return {
        id: e.id,
        amount: e.amount,
        type: e.type,
        nextDate: nextOccur,
        rule: e.recurrenceRule!,
      };
    });

  // Spread receivables over next 30 days under optimistic, but completely ignore/write-off under pessimistic
  const dailyReceivableInflow = Math.round(totalReceivables / 30);

  for (let d = 0; d < daysToProject; d++) {
    const currentDate = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    const dateStr = toDateString(currentDate);

    // Filter recurring transactions scheduled for today
    let dailyRecIncome = 0;
    let dailyRecExpense = 0;

    const todayStart = new Date(currentDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(currentDate);
    todayEnd.setHours(23, 59, 59, 999);

    recurringItems.forEach((ri) => {
      if (ri.nextDate >= todayStart && ri.nextDate <= todayEnd) {
        if (ri.type === 'income') {
          dailyRecIncome = safeAddCents(dailyRecIncome, ri.amount);
        } else {
          dailyRecExpense = safeAddCents(dailyRecExpense, ri.amount);
        }
        // Advance to next recurrence
        ri.nextDate = getNextRecurrenceDate(ri.nextDate, ri.rule.type, ri.rule.interval);
      }
    });

    // Determine variable spending models
    // Optimistic: strictly capped by dailyBudgetCap (if set) or average daily, assuming 85% efficiency
    const optVarSpend =
      dailyBudgetCap > 0
        ? Math.round(dailyBudgetCap * 0.85)
        : Math.round(avgDailyVariableSpend * 0.85);

    // Pessimistic: variable hits budget limit + 20% overrun, or average daily + 20%
    const pesVarSpend =
      dailyBudgetCap > 0
        ? Math.round(dailyBudgetCap * 1.2)
        : Math.round(avgDailyVariableSpend * 1.2);

    // Apply receivables to Optimistic model only (reimbursement paid back within 30 days)
    const optReceivable = d < 30 ? dailyReceivableInflow : 0;

    // Apply daily updates
    // Optimistic: + RecIncome + Receivables - RecExpense - OptVarSpend
    optBalance = safeAddCents(optBalance, dailyRecIncome, optReceivable);
    optBalance = safeSubCents(optBalance, dailyRecExpense);
    optBalance = safeSubCents(optBalance, optVarSpend);

    // Pessimistic: + RecIncome - RecExpense - PesVarSpend (ignore receivables)
    pesBalance = safeAddCents(pesBalance, dailyRecIncome);
    pesBalance = safeSubCents(pesBalance, dailyRecExpense);
    pesBalance = safeSubCents(pesBalance, pesVarSpend);

    points.push({
      date: dateStr,
      optimisticBalance: normalizeCents(optBalance),
      pessimisticBalance: normalizeCents(pesBalance),
    });
  }

  return points;
}
