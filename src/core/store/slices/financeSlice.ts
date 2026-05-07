import { StateCreator } from 'zustand';
import { db } from '@/core/db/db';
import type {
  Expense,
  ExpenseInput,
  ExpenseUpdate,
  Budget,
  BudgetInput,
  BudgetUpdate,
} from '../types';
import type { CoreStoreState } from '../useStore';
import {
  normalizePositiveCents,
  dollarsToCentsSafe,
  normalizeExpenseRecurrenceRule,
  applyExpenseToBalance,
  revertExpenseFromBalance,
  recalculateBalancesForExpenseUpdate,
  generateNextRecurringTransactions,
  normalizeBudget,
} from '@/lib/core/financeEngine';
import { sanitizeString, sanitizeTags, sanitizeDateString } from '@/utils/sanitizer';
import { upsertItem, createId } from '../utils';
import { toLocalDateString } from '@/utils/date';

export interface FinanceSlice {
  expenses: Expense[];
  budgets: Budget[];
  addExpense: (expense: ExpenseInput) => Promise<Expense>;
  updateExpense: (id: string, updates: ExpenseUpdate) => Promise<Expense | undefined>;
  deleteExpense: (id: string) => Promise<void>;
  addBudget: (budget: BudgetInput) => Promise<Budget>;
  updateBudget: (id: string, updates: BudgetUpdate) => Promise<Budget | undefined>;
  deleteBudget: (id: string) => Promise<void>;
  processRecurringTransactions: () => Promise<void>;
}

export const createFinanceSlice: StateCreator<CoreStoreState, [], [], FinanceSlice> = (
  set,
  get,
) => ({
  expenses: [],
  budgets: [],

  addExpense: async (input) => {
    const amount =
      input.amount !== undefined
        ? normalizePositiveCents(input.amount)
        : dollarsToCentsSafe(input.amountDollars ?? 0);

    // Reject zero or negative amounts
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    // Validate linked task and note exist
    const linkedTaskId =
      input.linkedTaskId && get().tasks.some((t) => t.id === input.linkedTaskId)
        ? input.linkedTaskId
        : undefined;
    const linkedNoteId =
      input.linkedNoteId && get().notes.some((n) => n.id === input.linkedNoteId)
        ? input.linkedNoteId
        : undefined;

    const expense: Expense = {
      id: input.id ?? createId(),
      amount,
      category: sanitizeString(input.category, 50),
      type: input.type ?? 'expense',
      accountId: input.accountId ?? 'bank',
      tags: sanitizeTags(input.tags),
      area: input.area ?? 'finance',
      note: sanitizeString(input.note, 500),
      isRecurring: Boolean(input.isRecurring),
      recurrenceRule: normalizeExpenseRecurrenceRule(input.recurrenceRule),
      linkedTaskId,
      linkedNoteId,
      createdAt: sanitizeDateString(input.createdAt) || new Date().toISOString(),
    };

    const account = get().accounts.find((a) => a.id === expense.accountId);
    if (!account) throw new Error('Invalid account ID');

    const updatedAccount = {
      ...account,
      balance: applyExpenseToBalance(account.balance, expense.amount, expense.type),
    };

    await db.transaction('rw', [db.expenses, db.accounts], async () => {
      await db.expenses.put(expense);
      await db.accounts.put(updatedAccount);
    });

    set((state) => ({
      expenses: upsertItem(state.expenses, expense),
      accounts: upsertItem(state.accounts, updatedAccount),
    }));

    // Activity tracking
    const today = toLocalDateString(new Date());
    if (expense.type === 'expense') {
      await get().updateSnapshot(today, 'expense', expense.amount);
    }

    return expense;
  },

  updateExpense: async (id, updates) => {
    const current = get().expenses.find((e) => e.id === id);
    if (!current) return undefined;

    // Validate linked task and note exist if being updated
    const updateData: Partial<Expense> = { ...updates };
    if ('linkedTaskId' in updateData) {
      updateData.linkedTaskId =
        updateData.linkedTaskId && get().tasks.some((t) => t.id === updateData.linkedTaskId)
          ? updateData.linkedTaskId
          : undefined;
    }
    if ('linkedNoteId' in updateData) {
      updateData.linkedNoteId =
        updateData.linkedNoteId && get().notes.some((n) => n.id === updateData.linkedNoteId)
          ? updateData.linkedNoteId
          : undefined;
    }
    if ('createdAt' in updateData) {
      updateData.createdAt = sanitizeDateString(updateData.createdAt) || current.createdAt;
    }

    // Normalize and validate amount if updating
    if ('amount' in updateData) {
      const newAmount = updateData.amount ?? current.amount;
      if (newAmount <= 0) throw new Error('Amount must be greater than 0');
      updateData.amount = newAmount;
    }

    const next: Expense = { ...current, ...updateData };
    const currentAccount = get().accounts.find((a) => a.id === current.accountId);
    const nextAccount = get().accounts.find((a) => a.id === next.accountId);

    if (!currentAccount || !nextAccount) throw new Error('Invalid account ID');

    const updatedAccounts = recalculateBalancesForExpenseUpdate(get().accounts, current, next);
    const updatedCurrent = updatedAccounts.find((a) => a.id === current.accountId)!;
    const updatedNext = updatedAccounts.find((a) => a.id === next.accountId)!;

    await db.transaction('rw', [db.expenses, db.accounts], async () => {
      await db.expenses.put(next);
      await db.accounts.put(updatedCurrent);
      if (updatedCurrent.id !== updatedNext.id) {
        await db.accounts.put(updatedNext);
      }
    });

    set((state) => ({
      expenses: upsertItem(state.expenses, next),
      accounts: upsertItem(upsertItem(state.accounts, updatedCurrent), updatedNext),
    }));

    return next;
  },

  deleteExpense: async (id) => {
    const current = get().expenses.find((e) => e.id === id);
    if (!current) return;

    const account = get().accounts.find((a) => a.id === current.accountId);
    let updatedAccount: typeof account | undefined;

    if (account) {
      updatedAccount = {
        ...account,
        balance: revertExpenseFromBalance(account.balance, current.amount, current.type),
      };
    }

    await db.transaction('rw', [db.expenses, db.accounts], async () => {
      await db.expenses.delete(id);
      if (updatedAccount) {
        await db.accounts.put(updatedAccount);
      }
    });

    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
      accounts: updatedAccount ? upsertItem(state.accounts, updatedAccount) : state.accounts,
    }));

    // Update snapshot
    const today = toLocalDateString(new Date());
    if (current.type === 'expense') {
      await get().updateSnapshot(today, 'expense', -current.amount);
    }
  },

  addBudget: async (input) => {
    const budget = normalizeBudget(input);
    await db.budgets.put(budget);
    set((state) => ({ budgets: upsertItem(state.budgets, budget) }));
    return budget;
  },

  updateBudget: async (id, updates) => {
    const current = get().budgets.find((b) => b.id === id);
    if (!current) return undefined;
    const next = normalizeBudget({ ...current, ...updates });
    await db.budgets.put(next);
    set((state) => ({ budgets: upsertItem(state.budgets, next) }));
    return next;
  },

  deleteBudget: async (id) => {
    await db.budgets.delete(id);
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
  },

  processRecurringTransactions: async () => {
    const { expenses, accounts } = get();
    const { newExpenses, updatedExpenses, updatedAccounts } = generateNextRecurringTransactions(
      expenses,
      accounts,
    );

    if (newExpenses.length === 0 && updatedExpenses.length === 0) return;

    await db.transaction('rw', [db.expenses, db.accounts], async () => {
      if (newExpenses.length > 0) await db.expenses.bulkPut(newExpenses);
      if (updatedAccounts.length > 0) await db.accounts.bulkPut(updatedAccounts);
      for (const update of updatedExpenses) {
        await db.expenses.update(update.id, { lastProcessedAt: update.lastProcessedAt });
      }
    });

    set((state) => ({
      expenses: state.expenses
        .map((e) => {
          const update = updatedExpenses.find((ue) => ue.id === e.id);
          return update ? { ...e, lastProcessedAt: update.lastProcessedAt } : e;
        })
        .concat(newExpenses),
      accounts: updatedAccounts.reduce((acc, updated) => upsertItem(acc, updated), state.accounts),
    }));
  },
});
