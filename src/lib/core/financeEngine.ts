import type { Account, Budget, Expense, OnboardingProfile } from '@/core/store/types';

export type FinanceRange = 'today' | 'week' | 'month' | 'all';

export interface BudgetUsage {
  spent: number;
  limit: number;
  remaining: number;
  percent: number;
  overflow: number;
}

export function normalizeCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

export function dollarsToCentsSafe(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function normalizePositiveCents(value: number): number {
  const normalized = normalizeCents(value);
  return normalized > 0 ? normalized : 0;
}

export function centsToDollars(value: number): number {
  return normalizeCents(value) / 100;
}

export function safeAddCents(...values: number[]): number {
  return values.reduce((sum, value) => sum + normalizeCents(value), 0);
}

export function safeSubCents(a: number, b: number): number {
  return normalizeCents(a) - normalizeCents(b);
}

export function applyExpenseToBalance(
  currentBalance: number,
  amount: number,
  type: Expense['type'],
): number {
  const normalizedBalance = normalizeCents(currentBalance);
  const normalizedAmount = normalizeCents(amount);
  return type === 'expense'
    ? safeSubCents(normalizedBalance, normalizedAmount)
    : safeAddCents(normalizedBalance, normalizedAmount);
}

export function revertExpenseFromBalance(
  currentBalance: number,
  amount: number,
  type: Expense['type'],
): number {
  const normalizedBalance = normalizeCents(currentBalance);
  const normalizedAmount = normalizeCents(amount);
  return type === 'expense'
    ? safeAddCents(normalizedBalance, normalizedAmount)
    : safeSubCents(normalizedBalance, normalizedAmount);
}

export function shouldRebalanceForExpenseUpdate(updates: Partial<Expense>): boolean {
  return (
    updates.amount !== undefined || updates.type !== undefined || updates.accountId !== undefined
  );
}

export function normalizeExpenseRecurrenceRule(
  value: unknown,
): Expense['recurrenceRule'] | undefined {
  // Max interval: 1 year (365 days) to prevent unreasonable recurrence rules
  const MAX_RECURRENCE_INTERVAL = 365;

  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const candidate = value as Record<string, unknown>;
  const validTypes = ['daily', 'weekly', 'monthly'] as const;
  const type =
    typeof candidate.type === 'string' && (validTypes as readonly string[]).includes(candidate.type)
      ? (candidate.type as 'daily' | 'weekly' | 'monthly')
      : undefined;

  if (!type) return undefined;

  const interval =
    typeof candidate.interval === 'number' &&
    Number.isFinite(candidate.interval) &&
    candidate.interval > 0 &&
    candidate.interval <= MAX_RECURRENCE_INTERVAL
      ? Math.floor(candidate.interval)
      : undefined;

  return interval ? { type, interval } : undefined;
}

export function recalculateBalancesForExpenseUpdate(
  accounts: Account[],
  previous: Expense,
  next: Expense,
): Account[] {
  const map = new Map(accounts.map((account) => [account.id, account] as const));
  const previousAccount = map.get(previous.accountId);
  const nextAccount = map.get(next.accountId);

  if (!previousAccount) {
    throw new Error(`Account "${previous.accountId}" not found during balance recalculation`);
  }
  if (!nextAccount) {
    throw new Error(`Account "${next.accountId}" not found during balance recalculation`);
  }

  const revertedPrevious = {
    ...previousAccount,
    balance: revertExpenseFromBalance(previousAccount.balance, previous.amount, previous.type),
  };

  map.set(revertedPrevious.id, revertedPrevious);

  const targetBase = map.get(next.accountId) ?? nextAccount;
  const appliedNext = {
    ...targetBase,
    balance: applyExpenseToBalance(targetBase.balance, next.amount, next.type),
  };

  map.set(appliedNext.id, appliedNext);

  return accounts.map((account) => map.get(account.id) ?? account);
}

export function calculateTotalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, account) => safeAddCents(sum, account.balance), 0);
}

export function calculateTotalSpent(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.type === 'expense')
    .reduce((sum, expense) => safeAddCents(sum, expense.amount), 0);
}

export function calculateTotalIncome(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.type === 'income')
    .reduce((sum, expense) => safeAddCents(sum, expense.amount), 0);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRangeStart(now: Date, range: FinanceRange): Date | null {
  if (range === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return null;
}

export function filterExpensesByRange(
  expenses: Expense[],
  range: FinanceRange,
  now = new Date(),
): Expense[] {
  if (range === 'all') return [...expenses];

  if (range === 'today') {
    const todayKey = toDateKey(now);
    return expenses.filter((expense) => toDateKey(new Date(expense.createdAt)) === todayKey);
  }

  const start = getRangeStart(now, range);
  if (!start) return [...expenses];

  return expenses.filter((expense) => new Date(expense.createdAt) >= start);
}

export function calculateCategoryTotals(
  expenses: Expense[],
  filterDate?: Date,
): Record<string, number> {
  return expenses.reduce<Record<string, number>>((accumulator, expense) => {
    if (expense.type !== 'expense') return accumulator;

    // Filter by date if provided
    if (filterDate) {
      const date = new Date(expense.createdAt);
      if (
        date.getMonth() !== filterDate.getMonth() ||
        date.getFullYear() !== filterDate.getFullYear()
      ) {
        return accumulator;
      }
    }

    const current = accumulator[expense.category] ?? 0;
    accumulator[expense.category] = safeAddCents(current, expense.amount);
    return accumulator;
  }, {});
}

export function getTopCategories(
  expenses: Expense[],
  top = 3,
  filterDate?: Date,
): { category: string; amount: number }[] {
  const totals = calculateCategoryTotals(expenses, filterDate);
  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, top);
}

export function getWeeklyTrend(
  expenses: Expense[],
  now = new Date(),
): { day: string; amount: number }[] {
  const result: { day: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = toDateKey(d);
    const dayTotal = expenses
      .filter((e) => e.type === 'expense' && toDateKey(new Date(e.createdAt)) === key)
      .reduce((sum, e) => safeAddCents(sum, e.amount), 0);
    result.push({ day: d.toLocaleDateString(undefined, { weekday: 'short' }), amount: dayTotal });
  }
  return result;
}

export function calculateMonthlyExpense(expenses: Expense[], now = new Date()): number {
  return expenses
    .filter((expense) => {
      if (expense.type !== 'expense') return false;
      const date = new Date(expense.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, expense) => safeAddCents(sum, expense.amount), 0);
}

export function validateBudget(budget: Partial<Budget>): string[] {
  const errors: string[] = [];
  if (!budget.category || budget.category.trim().length === 0) {
    errors.push('Category is required.');
  }
  if (budget.limit === undefined || budget.limit < 0) {
    errors.push('Limit must be a non-negative number.');
  }
  if (budget.period !== 'weekly' && budget.period !== 'monthly') {
    errors.push('Period must be weekly or monthly.');
  }
  return errors;
}

export function calculateBudgetUsage(
  budget: Budget,
  expenses: Expense[],
  now = new Date(),
): BudgetUsage {
  const range: FinanceRange = budget.period === 'weekly' ? 'week' : 'month';
  const filteredExpenses = filterExpensesByRange(expenses, range, now);

  const spent = filteredExpenses
    .filter(
      (expense) => expense.type === 'expense' && expense.category.toLowerCase() === budget.category,
    )
    .reduce((sum, expense) => safeAddCents(sum, expense.amount), 0);

  const limit = normalizePositiveCents(budget.limit);
  const remaining = safeSubCents(limit, spent);
  const overflow = remaining < 0 ? Math.abs(remaining) : 0;

  // Guard against division by zero and handle 100%+ cases gracefully
  const percent = limit > 0 ? Math.min(1000, (spent / limit) * 100) : spent > 0 ? 100 : 0;

  return {
    spent: normalizePositiveCents(spent),
    limit,
    remaining,
    overflow: normalizePositiveCents(overflow),
    percent: Number.isFinite(percent) ? percent : 0,
  };
}

export function buildBudgetSuggestions(
  profile: OnboardingProfile,
  existingBudgets: Budget[],
): Budget[] {
  const baseMonthlyLimit = profile.avgExpense || Math.round(profile.income * 0.65);
  if (baseMonthlyLimit <= 0) return [];

  const shouldTightenBudget =
    profile.goals.includes('save-money') || profile.goals.includes('reduce-expenses');
  const targetMonthlyLimit = Math.round(baseMonthlyLimit * (shouldTightenBudget ? 0.9 : 1));
  const existingCategories = new Set(
    existingBudgets.map((budget) => budget.category.toLowerCase()),
  );

  const splits = [
    ['Food', 0.3],
    ['Transport', 0.15],
    ['Shopping', 0.15],
    ['Utilities', 0.25],
    ['Personal', 0.15],
  ] as const;

  return splits
    .filter(([category]) => !existingCategories.has(category.toLowerCase()))
    .map(([category, split]) => ({
      id: `onboarding-${category.toLowerCase()}`,
      category,
      limit: normalizePositiveCents(Math.round(targetMonthlyLimit * split)),
      period: 'monthly' as const,
    }));
}

export function normalizeAccount(payload: unknown): Account {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      id: crypto.randomUUID(),
      name: 'Untitled Account',
      balance: 0,
      createdAt: new Date().toISOString(),
    };
  }
  const p = payload as Record<string, unknown>;
  const rawName = typeof p.name === 'string' ? p.name.trim() : '';
  return {
    id: typeof p.id === 'string' && p.id.length > 0 ? p.id : crypto.randomUUID(),
    name: rawName || 'Untitled Account',
    balance: typeof p.balance === 'number' ? normalizeCents(p.balance) : 0,
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
  };
}

export function normalizeBudget(payload: unknown): Budget {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      id: crypto.randomUUID(),
      category: 'uncategorized',
      limit: 0,
      period: 'monthly',
    };
  }
  const p = payload as Record<string, unknown>;
  const rawCategory = typeof p.category === 'string' ? p.category.trim() : '';
  return {
    id: typeof p.id === 'string' && p.id.length > 0 ? p.id : crypto.randomUUID(),
    category: (rawCategory || 'uncategorized').toLowerCase(),
    limit: typeof p.limit === 'number' ? normalizePositiveCents(p.limit) : 0,
    period: p.period === 'weekly' ? 'weekly' : 'monthly',
  };
}

function calculateExpenseNextOccurrence(
  baseDate: string,
  recurrence: { type: 'daily' | 'weekly' | 'monthly'; interval: number },
): string {
  const date = new Date(baseDate);
  if (!Number.isFinite(date.getTime())) return baseDate;

  if (recurrence.type === 'daily') date.setDate(date.getDate() + recurrence.interval);
  else if (recurrence.type === 'weekly') date.setDate(date.getDate() + recurrence.interval * 7);
  else if (recurrence.type === 'monthly') date.setMonth(date.getMonth() + recurrence.interval);

  return date.toISOString();
}

export function generateNextRecurringTransactions(
  expenses: Expense[],
  accounts: Account[],
  now = new Date(),
): {
  newExpenses: Expense[];
  updatedExpenses: { id: string; lastProcessedAt: string; updatedAt: string }[];
  updatedAccounts: Account[];
} {
  const recurring = expenses.filter((e) => e.isRecurring && e.recurrenceRule);
  const newExpenses: Expense[] = [];
  const updatedExpenses: { id: string; lastProcessedAt: string; updatedAt: string }[] = [];
  const nextAccounts = [...accounts];
  const MAX_RECURRING_PER_TRANSACTION = 12;
  let totalGenerated = 0;

  for (const item of recurring) {
    if (totalGenerated >= MAX_RECURRING_PER_TRANSACTION) {
      break;
    }
    const baseDate = item.lastProcessedAt || item.createdAt;
    let cursorDate = new Date(baseDate);
    const nextOccurrence = calculateExpenseNextOccurrence(
      cursorDate.toISOString(),
      item.recurrenceRule!,
    );
    if (!nextOccurrence) continue;

    let nextDate = new Date(nextOccurrence);
    let createdCount = 0;

    while (nextDate <= now && totalGenerated < MAX_RECURRING_PER_TRANSACTION) {
      const nowStr = now.toISOString();
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        amount: item.amount,
        category: item.category,
        type: item.type,
        accountId: item.accountId,
        note: `Recurring: ${item.note || item.category}`,
        tags: item.tags,
        area: item.area,
        isRecurring: false,
        createdAt: nextDate.toISOString(),
        updatedAt: nowStr,
      };

      newExpenses.push(newExpense);
      totalGenerated++;

      // Update account balance
      const accIndex = nextAccounts.findIndex((a) => a.id === item.accountId);
      if (accIndex !== -1) {
        nextAccounts[accIndex] = {
          ...nextAccounts[accIndex],
          balance: applyExpenseToBalance(
            nextAccounts[accIndex].balance,
            newExpense.amount,
            newExpense.type,
          ),
        };
      }

      cursorDate = nextDate;
      const nextTime = calculateExpenseNextOccurrence(nextDate.toISOString(), item.recurrenceRule!);
      if (!nextTime) break;
      nextDate = new Date(nextTime);
      createdCount++;

      if (totalGenerated >= MAX_RECURRING_PER_TRANSACTION) {
        break;
      }
    }

    if (createdCount > 0) {
      updatedExpenses.push({
        id: item.id,
        lastProcessedAt: cursorDate.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
  }

  return { newExpenses, updatedExpenses, updatedAccounts: nextAccounts };
}
