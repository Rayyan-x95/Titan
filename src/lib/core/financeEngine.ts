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
    updates.amount !== undefined ||
    updates.type !== undefined ||
    updates.accountId !== undefined
  );
}

export function normalizeExpenseRecurrenceRule(value: unknown): Expense['recurrenceRule'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const candidate = value as Record<string, unknown>;
  const type =
    candidate.type === 'daily' ||
    candidate.type === 'weekly' ||
    candidate.type === 'monthly'
      ? candidate.type
      : undefined;
  const interval =
    typeof candidate.interval === 'number' &&
    Number.isFinite(candidate.interval) &&
    candidate.interval > 0
      ? candidate.interval
      : undefined;

  return type && interval ? { type, interval } : undefined;
}

export function recalculateBalancesForExpenseUpdate(
  accounts: Account[],
  previous: Expense,
  next: Expense,
): Account[] {
  const map = new Map(accounts.map((account) => [account.id, account] as const));
  const previousAccount = map.get(previous.accountId);
  const nextAccount = map.get(next.accountId);

  if (!previousAccount || !nextAccount) {
    return accounts;
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

export function calculateCategoryTotals(expenses: Expense[]): Record<string, number> {
  return expenses.reduce<Record<string, number>>((accumulator, expense) => {
    if (expense.type !== 'expense') return accumulator;
    const current = accumulator[expense.category] ?? 0;
    accumulator[expense.category] = safeAddCents(current, expense.amount);
    return accumulator;
  }, {});
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

export function calculateBudgetUsage(budget: Budget, expenses: Expense[], now = new Date()): BudgetUsage {
  const range: FinanceRange = budget.period === 'weekly' ? 'week' : 'month';
  const filteredExpenses = filterExpensesByRange(expenses, range, now);

  const spent = filteredExpenses
    .filter((expense) => expense.type === 'expense' && expense.category === budget.category)
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
    percent: Number.isFinite(percent) ? percent : 0 
  };
}

export function buildBudgetSuggestions(profile: OnboardingProfile, existingBudgets: Budget[]): Budget[] {
  const baseMonthlyLimit = profile.avgExpense || Math.round(profile.income * 0.65);
  if (baseMonthlyLimit <= 0) return [];

  const shouldTightenBudget =
    profile.goals.includes('save-money') || profile.goals.includes('reduce-expenses');
  const targetMonthlyLimit = Math.round(baseMonthlyLimit * (shouldTightenBudget ? 0.9 : 1));
  const existingCategories = new Set(existingBudgets.map((budget) => budget.category.toLowerCase()));

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

export function normalizeAccount(payload: any): Account {
  const rawName = typeof payload.name === 'string' ? payload.name.trim() : '';
  return {
    id: typeof payload.id === 'string' && payload.id.length > 0 ? payload.id : crypto.randomUUID(),
    name: rawName || 'Untitled Account',
    balance: typeof payload.balance === 'number' ? normalizeCents(payload.balance) : 0,
    createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : new Date().toISOString(),
  };
}

export function normalizeBudget(payload: any): Budget {
  const rawCategory = typeof payload.category === 'string' ? payload.category.trim() : '';
  return {
    id: typeof payload.id === 'string' && payload.id.length > 0 ? payload.id : crypto.randomUUID(),
    category: rawCategory || 'Uncategorized',
    limit: typeof payload.limit === 'number' ? normalizePositiveCents(payload.limit) : 0,
    period: payload.period === 'weekly' ? 'weekly' : 'monthly',
  };
}
