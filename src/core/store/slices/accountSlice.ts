import { StateCreator } from 'zustand';
import { db } from '@/core/db/db';
import type { Account, AccountInput, AccountUpdate } from '../types';
import type { CoreStoreState } from '../useStore';
import { dollarsToCentsSafe } from '@/lib/core/financeEngine';
import { sanitizeString } from '@/utils/sanitizer';
import { upsertItem, createId } from '../utils';

export interface AccountSlice {
  accounts: Account[];
  addAccount: (account: AccountInput) => Promise<Account>;
  updateAccount: (id: string, updates: AccountUpdate) => Promise<Account | undefined>;
  deleteAccount: (id: string) => Promise<void>;
}

export const createAccountSlice: StateCreator<CoreStoreState, [], [], AccountSlice> = (
  set,
  get,
) => ({
  accounts: [],

  addAccount: async (input) => {
    const account: Account = {
      id: input.id ?? createId(),
      name: sanitizeString(input.name || 'Account', 100),
      balance: dollarsToCentsSafe(input.balanceDollars),
      createdAt: new Date().toISOString(),
    };
    await db.accounts.put(account);
    set((state) => ({ accounts: upsertItem(state.accounts, account) }));
    return account;
  },

  updateAccount: async (id, updates) => {
    const current = get().accounts.find((a) => a.id === id);
    if (!current) return undefined;
    const sanitizedUpdates: Partial<Account> = { ...updates };
    if ('name' in sanitizedUpdates && typeof sanitizedUpdates.name === 'string') {
      sanitizedUpdates.name = sanitizeString(sanitizedUpdates.name, 100) || current.name;
    }
    const next = { ...current, ...sanitizedUpdates };
    await db.accounts.put(next);
    set((state) => ({ accounts: upsertItem(state.accounts, next) }));
    return next;
  },

  deleteAccount: async (id) => {
    const currentState = get();
    const account = currentState.accounts.find((a) => a.id === id);
    if (!account) return;

    if (currentState.accounts.length <= 1) {
      throw new Error('Cannot delete the last account.');
    }

    const fallbackAccount = currentState.accounts.find((a) => a.id !== id);
    if (!fallbackAccount) throw new Error('No fallback account available.');

    const reassignedExpenses = currentState.expenses.map((expense) =>
      expense.accountId === id ? { ...expense, accountId: fallbackAccount.id } : expense,
    );

    const updatedFallbackAccount = {
      ...fallbackAccount,
      balance: fallbackAccount.balance + account.balance,
    };

    await db.transaction('rw', [db.accounts, db.expenses], async () => {
      await db.accounts.delete(id);
      await db.accounts.put(updatedFallbackAccount);
      if (reassignedExpenses.length > 0) {
        await db.expenses.where('accountId').equals(id).modify({ accountId: fallbackAccount.id });
      }
    });

    set((prev) => ({
      accounts: prev.accounts
        .filter((entry) => entry.id !== id)
        .map((entry) => (entry.id === fallbackAccount.id ? updatedFallbackAccount : entry)),
      expenses: reassignedExpenses,
    }));
  },
});
