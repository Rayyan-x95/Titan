import { create } from 'zustand';
import { db } from '@/core/db/db';
import type {
  Expense,
  ExpenseInput,
  ExpenseUpdate,
  Note,
  NoteInput,
  NoteUpdate,
  Task,
  TaskInput,
  TaskUpdate,
  Budget,
  BudgetInput,
  BudgetUpdate,
  Account,
  AccountInput,
  AccountUpdate,
  OnboardingProfile,
  OnboardingUpdate,
  Friend,
  FriendInput,
  FriendUpdate,
  Group,
  GroupInput,
  GroupUpdate,
  SharedExpense,
  SharedExpenseInput,
  SharedExpenseUpdate,
  DailySnapshot,
  TaskRecurrence,
  FinancialGoal,
} from './types';
import {
  clearNoteBacklinks,
  clearTasksForDeletedNote,
  reconcileTaskNoteReferences,
  syncNoteNoteReferences,
  syncTaskNoteReference,
  validateTaskNoteReference,
  clearTaskNoteReference
} from './taskNoteSync';
import { sanitizeString, sanitizeTags, sanitizeDateString } from '@/utils/sanitizer';
import {
  applyExpenseToBalance,
  buildBudgetSuggestions,
  calculateCategoryTotals,
  dollarsToCentsSafe,
  filterExpensesByRange,
  normalizeExpenseRecurrenceRule,
  normalizePositiveCents,
  recalculateBalancesForExpenseUpdate,
  revertExpenseFromBalance,
  shouldRebalanceForExpenseUpdate,
  normalizeAccount,
  normalizeBudget,
} from '@/lib/core/financeEngine';
import {
  calculateNextOccurrence,
  getTodayTasks as getTodayTasksFromEngine,
  normalizeRecurrence as normalizeTaskRecurrence,
  normalizeTask,
  validateTaskRelationships,
} from '@/lib/core/taskEngine';
import { normalizeNote } from '@/lib/core/noteEngine';

// Security: Input validation limits
const MAX_ARRAY_LENGTH = 1000;
const VALID_ACCOUNT_ID_PATTERN = /^[a-z]{2,10}-[a-z]{2,10}$/;
const VALID_TASK_ID_PATTERN = /^[a-z]{2,8}-[0-9]{4,8}$/;
const VALID_NOTE_ID_PATTERN = /^[a-z]{2,8}-[0-9]{4,8}$/;

function isValidAccountId(id: string): boolean {
  return typeof id === 'string' && (VALID_ACCOUNT_ID_PATTERN.test(id) || ['cash', 'bank'].includes(id));
}

function isValidTaskId(id: string): boolean {
  return typeof id === 'string' && (VALID_TASK_ID_PATTERN.test(id) || id.length > 20);
}

function isValidNoteId(id: string): boolean {
  return typeof id === 'string' && (VALID_NOTE_ID_PATTERN.test(id) || id.length > 20);
}

function sanitizeArray<T>(array: T[]): T[] {
  return array.slice(0, MAX_ARRAY_LENGTH);
}

interface CoreStoreState {
  tasks: Task[];
  notes: Note[];
  expenses: Expense[];
  budgets: Budget[];
  accounts: Account[];
  friends: Friend[];
  groups: Group[];
  sharedExpenses: SharedExpense[];
  dailySnapshots: DailySnapshot[];
  onboarding: OnboardingProfile;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  clearAll: () => Promise<void>;
  importBackup: (payload: unknown) => Promise<void>;

  // Onboarding
  updateOnboarding: (updates: OnboardingUpdate) => Promise<OnboardingProfile>;
  completeOnboarding: (updates?: OnboardingUpdate) => Promise<OnboardingProfile>;
  skipOnboarding: () => Promise<OnboardingProfile>;
  
  // Accounts
  addAccount: (account: AccountInput) => Promise<Account>;
  updateAccount: (id: string, updates: AccountUpdate) => Promise<Account | undefined>;
  deleteAccount: (id: string) => Promise<void>;

  // Friends
  addFriend: (input: FriendInput) => Promise<Friend>;
  updateFriend: (id: string, updates: FriendUpdate) => Promise<Friend | undefined>;
  deleteFriend: (id: string) => Promise<void>;

  // Groups
  addGroup: (input: GroupInput) => Promise<Group>;
  updateGroup: (id: string, updates: GroupUpdate) => Promise<Group | undefined>;
  deleteGroup: (id: string) => Promise<void>;

  // Shared Expenses
  addSharedExpense: (input: SharedExpenseInput) => Promise<SharedExpense>;
  deleteSharedExpense: (id: string) => Promise<void>;

  // Tasks
  addTask: (task: TaskInput) => Promise<Task>;
  updateTask: (id: string, updates: TaskUpdate) => Promise<Task | undefined>;
  deleteTask: (id: string) => Promise<void>;

  // Notes
  addNote: (note: NoteInput) => Promise<Note>;
  updateNote: (id: string, updates: NoteUpdate) => Promise<Note | undefined>;
  deleteNote: (id: string) => Promise<void>;

  // Finance
  addExpense: (expense: ExpenseInput) => Promise<Expense>;
  updateExpense: (id: string, updates: ExpenseUpdate) => Promise<Expense | undefined>;
  deleteExpense: (id: string) => Promise<void>;
  addBudget: (budget: BudgetInput) => Promise<Budget>;
  updateBudget: (id: string, updates: BudgetUpdate) => Promise<Budget | undefined>;
  deleteBudget: (id: string) => Promise<void>;
  processRecurringTransactions: () => Promise<void>;

  // Rate limiting
  resetRateLimits: () => Promise<void>;

  getTodayTasks: () => Task[];
  getWeeklyExpenses: () => Expense[];
  getCategoryTotals: () => Record<string, number>;
  getPinnedNotes: () => Note[];
  getTimelineItems: () => TimelineItem[];
  updateSnapshot: (date: string, type: 'task' | 'expense' | 'note' | 'split', value?: number) => Promise<void>;
  recomputeSnapshots: () => Promise<void>;
}

export type TimelineItem = 
  | { type: 'task'; data: Task; timestamp: string }
  | { type: 'note'; data: Note; timestamp: string }
  | { type: 'expense'; data: Expense; timestamp: string }
  | { type: 'split'; data: SharedExpense; timestamp: string };

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTimestamp(value?: string) {
  return value ?? new Date().toISOString();
}

function createDefaultOnboardingProfile(timestamp = new Date().toISOString()): OnboardingProfile {
  return {
    id: 'primary',
    name: '',
    income: 0,
    avgExpense: 0,
    goals: [],
    preferences: {
      notifications: true,
      darkMode: true,
    },
    currentStep: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function upsertItem<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((i) => i.id === item.id);
  if (index === -1) return [...items, item];
  const next = [...items];
  next[index] = item;
  return next;
}

function sanitizeExpenseReferences<T extends { linkedTaskId?: string; linkedNoteId?: string }>(
  value: T,
  tasks: Task[],
  notes: Note[],
): T {
  return {
    ...value,
    linkedTaskId:
      value.linkedTaskId && !tasks.some((task) => task.id === value.linkedTaskId)
        ? undefined
        : value.linkedTaskId,
    linkedNoteId:
      value.linkedNoteId && !notes.some((note) => note.id === value.linkedNoteId)
        ? undefined
        : value.linkedNoteId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readArray(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return Array.isArray(value) ? value : [];
}

function normalizeRecurrence(value: unknown): TaskRecurrence | undefined {
  return normalizeTaskRecurrence(value);
}

function normalizeImportedOnboarding(value: unknown, fallback: OnboardingProfile): OnboardingProfile {
  if (!isRecord(value)) return fallback;

  const base = createDefaultOnboardingProfile();
  const preferences = isRecord(value.preferences) ? value.preferences : {};
  const goals = Array.isArray(value.goals)
    ? value.goals.filter((goal): goal is FinancialGoal =>
        [
          'save-money',
          'track-spending',
          'improve-productivity',
          'reduce-expenses',
        ].includes(goal),
      )
    : [];

  return {
    ...base,
    id: 'primary',
    name: sanitizeString(value.name, 100) || base.name,
    phoneNumber: sanitizeString(value.phoneNumber, 20),
    dob: sanitizeDateString(value.dob),
    income: typeof value.income === 'number' ? normalizePositiveCents(value.income) : base.income,
    avgExpense: typeof value.avgExpense === 'number' ? normalizePositiveCents(value.avgExpense) : base.avgExpense,
    goals,
    preferences: {
      notifications: typeof preferences.notifications === 'boolean' ? preferences.notifications : base.preferences.notifications,
      darkMode: typeof preferences.darkMode === 'boolean' ? preferences.darkMode : base.preferences.darkMode,
    },
    currentStep: typeof value.currentStep === 'number' ? value.currentStep : base.currentStep,
    completedAt: sanitizeDateString(value.completedAt),
    skippedAt: sanitizeDateString(value.skippedAt),
    createdAt: sanitizeDateString(value.createdAt) || base.createdAt,
    updatedAt: sanitizeDateString(value.updatedAt) || new Date().toISOString(),
  };
}

function normalizeImportedFriend(value: unknown): Friend | null {
  if (!isRecord(value) || !value.name) return null;
  return {
    id: typeof value.id === 'string' ? value.id : createId(),
    name: sanitizeString(value.name, 100),
    phoneNumber: sanitizeString(value.phoneNumber, 20),
    avatar: typeof value.avatar === 'string' ? value.avatar : undefined,
    createdAt: sanitizeDateString(value.createdAt) || createTimestamp(),
  };
}

function normalizeImportedGroup(value: unknown, friendIds: Set<string>): Group | null {
  if (!isRecord(value) || !value.name) return null;
  const memberIds = Array.isArray(value.memberIds) 
    ? value.memberIds.filter((id): id is string => typeof id === 'string' && (friendIds.has(id) || id === 'user'))
    : [];
  return {
    id: typeof value.id === 'string' ? value.id : createId(),
    name: sanitizeString(value.name, 100),
    memberIds,
    createdAt: sanitizeDateString(value.createdAt) || createTimestamp(),
  };
}

function normalizeImportedSharedExpense(value: unknown, groupIds: Set<string>, friendIds: Set<string>): SharedExpense | null {
  if (!isRecord(value) || !value.description || typeof value.totalAmount !== 'number') return null;
  const participants = Array.isArray(value.participants)
    ? value.participants
        .filter((p): p is { id: string; amount: number } => isRecord(p) && typeof p.id === 'string' && typeof p.amount === 'number')
        .map(p => ({ id: p.id, amount: normalizePositiveCents(p.amount) }))
    : [];

  return {
    id: typeof value.id === 'string' ? value.id : createId(),
    totalAmount: normalizePositiveCents(value.totalAmount),
    description: sanitizeString(value.description, 200),
    paidBy: typeof value.paidBy === 'string' ? value.paidBy : 'user',
    groupId: typeof value.groupId === 'string' && groupIds.has(value.groupId) ? value.groupId : undefined,
    participants,
    linkedExpenseId: typeof value.linkedExpenseId === 'string' ? value.linkedExpenseId : undefined,
    note: sanitizeString(value.note, 500),
    area: typeof value.area === 'string' && ['work', 'personal', 'health', 'finance', 'social'].includes(value.area) ? value.area as SharedExpense['area'] : 'social',
    createdAt: sanitizeDateString(value.createdAt) || createTimestamp(),
  };
}

async function hydrateFromDatabase() {
  const [tasks, notes, expenses, budgets, accounts, friends, groups, sharedExpenses, dailySnapshots, onboarding] = await Promise.all([
    db.tasks.toArray(),
    db.notes.toArray(),
    db.expenses.toArray(),
    db.budgets.toArray(),
    db.accounts.toArray(),
    db.friends.toArray(),
    db.groups.toArray(),
    db.sharedExpenses.toArray(),
    db.dailySnapshots.toArray(),
    db.onboarding.get('primary'),
  ]);

  const reconciled = reconcileTaskNoteReferences(tasks, notes);
  return { 
    tasks: reconciled.tasks, 
    notes: reconciled.notes, 
    expenses,
    budgets,
    accounts,
    friends,
    groups,
    sharedExpenses,
    dailySnapshots,
    onboarding: onboarding ?? createDefaultOnboardingProfile(),
  };
}

export const useStore = create<CoreStoreState>((set, get) => ({
  tasks: [],
  notes: [],
  expenses: [],
  budgets: [],
  accounts: [],
  friends: [],
  groups: [],
  sharedExpenses: [],
  dailySnapshots: [],
  onboarding: createDefaultOnboardingProfile(),
  hydrated: false,

  hydrate: async () => {
    console.log('[Titan] Hydrating store...');
    try {
      let {
        tasks,
        notes,
        expenses,
        budgets,
        accounts,
        friends,
        groups,
        sharedExpenses,
        dailySnapshots,
        onboarding,
      } = await hydrateFromDatabase();
      
      if (accounts.length === 0) {
        console.log('[Titan] No accounts found, initializing defaults...');
        const defaults: Account[] = [
          { id: 'cash', name: 'Cash', balance: 0, createdAt: new Date().toISOString() },
          { id: 'bank', name: 'Bank', balance: 0, createdAt: new Date().toISOString() },
        ];
        await db.accounts.bulkPut(defaults);
        accounts = defaults;
      } else {
        // Migration: Merge 'upi' into 'bank' if 'upi' exists
        const upiAccount = accounts.find(a => a.id === 'upi');
        if (upiAccount) {
          console.log('[Titan] Migrating UPI account to Bank...');
          const bankAccount = accounts.find(a => a.id === 'bank');
          if (bankAccount) {
            const updatedBank = {
              ...bankAccount,
              balance: bankAccount.balance + upiAccount.balance
            };
            
            // Reassign expenses
            const reassignedExpenses = expenses.map(e => 
              e.accountId === 'upi' ? { ...e, accountId: 'bank' } : e
            );

            await db.transaction('rw', [db.accounts, db.expenses], async () => {
              await db.accounts.delete('upi');
              await db.accounts.put(updatedBank);
              const upiExpenses = expenses.filter(e => e.accountId === 'upi');
              if (upiExpenses.length > 0) {
                await db.expenses.where('accountId').equals('upi').modify({ accountId: 'bank' });
              }
            });

            accounts = accounts.filter(a => a.id !== 'upi').map(a => a.id === 'bank' ? updatedBank : a);
            expenses = reassignedExpenses;
          } else {
            // Just rename upi to bank if bank doesn't exist for some reason
            const newBank = { ...upiAccount, id: 'bank', name: 'Bank' };
            await db.transaction('rw', [db.accounts, db.expenses], async () => {
              await db.accounts.delete('upi');
              await db.accounts.put(newBank);
              await db.expenses.where('accountId').equals('upi').modify({ accountId: 'bank' });
            });
            accounts = accounts.filter(a => a.id !== 'upi').concat(newBank);
            expenses = expenses.map(e => e.accountId === 'upi' ? { ...e, accountId: 'bank' } : e);
          }
        }
      }

      set({ tasks, notes, expenses, budgets, accounts, friends, groups, sharedExpenses, dailySnapshots, onboarding, hydrated: true });
      console.log('[Titan] Hydration complete.', { tasks: tasks.length, accounts: accounts.length, snapshots: dailySnapshots.length });
    } catch (error) {
      console.error('[Titan] Hydration failed:', error);
      // Ensure we at least have valid empty arrays and onboarding to prevent crashes
      set({ 
        tasks: [], 
        notes: [], 
        expenses: [], 
        budgets: [], 
        accounts: [], 
        friends: [],
        groups: [],
        sharedExpenses: [],
        dailySnapshots: [],
        onboarding: createDefaultOnboardingProfile(),
        hydrated: true 
      });
    }
  },

  clearAll: async () => {
    try {
      const onboarding = createDefaultOnboardingProfile();
      await db.transaction('rw', [db.tasks, db.notes, db.expenses, db.budgets, db.accounts, db.onboarding], async () => {
        await Promise.all([
          db.tasks.clear(),
          db.notes.clear(),
          db.expenses.clear(),
          db.budgets.clear(),
          db.accounts.clear(),
          db.friends?.clear?.(),
          db.groups?.clear?.(),
          db.sharedExpenses?.clear?.(),
          db.onboarding.clear(),
        ]);
      });
      set({ tasks: [], notes: [], expenses: [], budgets: [], accounts: [], friends: [], groups: [], sharedExpenses: [], onboarding });
    } catch (error) {
      console.error('[Titan] Clear all failed:', error);
    }
  },

  importBackup: async (payload) => {
    if (!isRecord(payload)) {
      throw new Error('Invalid backup payload.');
    }

    const importedTasks = readArray(payload, 'tasks')
      .map(t => normalizeTask(t))
      .filter(Boolean);
    const importedNotes = readArray(payload, 'notes')
      .map(n => normalizeNote(n))
      .filter(Boolean);
    const reconciled = reconcileTaskNoteReferences(importedTasks, importedNotes);

    let importedAccounts = readArray(payload, 'accounts')
      .map(a => normalizeAccount(a))
      .filter(Boolean);

    if (importedAccounts.length === 0) {
      const now = new Date().toISOString();
      importedAccounts = [
        { id: 'cash', name: 'Cash', balance: 0, createdAt: now },
        { id: 'bank', name: 'Bank', balance: 0, createdAt: now },
      ];
    }

    const accountIds = new Set(importedAccounts.map((account) => account.id));
    const fallbackAccountId = importedAccounts[0].id;
    
    // Expense normalization helper for backup import
    const importedExpenses: Expense[] = readArray(payload, 'expenses')
      .flatMap((e) => {
        if (!isRecord(e) || typeof e.category !== 'string' || e.category.trim().length === 0) return [];
        const amount =
          typeof e.amount === 'number'
            ? e.amount
            : typeof e.amountDollars === 'number'
              ? dollarsToCentsSafe(e.amountDollars)
              : 0;

        const normalized: Expense = {
          id: typeof e.id === 'string' ? e.id : crypto.randomUUID(),
          amount: normalizePositiveCents(amount),
          category: sanitizeString(e.category, 50),
          type: e.type === 'income' ? 'income' : 'expense',
          accountId: typeof e.accountId === 'string' && accountIds.has(e.accountId) ? e.accountId : fallbackAccountId,
          tags: sanitizeTags(e.tags),
          area:
            typeof e.area === 'string' && ['work', 'personal', 'health', 'finance', 'social'].includes(e.area)
              ? (e.area as Expense['area'])
              : 'finance',
          note: sanitizeString(e.note, 500),
          isRecurring: Boolean(e.isRecurring),
          recurrenceRule: normalizeExpenseRecurrenceRule(e.recurrenceRule),
          linkedTaskId: typeof e.linkedTaskId === 'string' ? e.linkedTaskId : undefined,
          linkedNoteId: typeof e.linkedNoteId === 'string' ? e.linkedNoteId : undefined,
          createdAt: sanitizeDateString(e.createdAt) || new Date().toISOString(),
        };

        return [normalized];
      })
      .map((expense) => sanitizeExpenseReferences(expense, reconciled.tasks, reconciled.notes));

    const importedBudgets = readArray(payload, 'budgets')
      .map(b => normalizeBudget(b))
      .filter(Boolean);

    const importedFriends = readArray(payload, 'friends')
      .map(f => normalizeImportedFriend(f))
      .filter((f): f is Friend => Boolean(f));
    
    const friendIds = new Set(importedFriends.map(f => f.id));

    const importedGroups = readArray(payload, 'groups')
      .map(g => normalizeImportedGroup(g, friendIds))
      .filter((g): g is Group => Boolean(g));

    const groupIds = new Set(importedGroups.map(g => g.id));

    const importedSharedExpenses = readArray(payload, 'sharedExpenses')
      .map(se => normalizeImportedSharedExpense(se, groupIds, friendIds))
      .filter((se): se is SharedExpense => Boolean(se));

    const importedOnboarding = normalizeImportedOnboarding(payload.onboarding, get().onboarding);

    await db.transaction(
      'rw',
      [db.tasks, db.notes, db.expenses, db.budgets, db.accounts, db.onboarding],
      async () => {
        await Promise.all([
          db.tasks.clear(),
          db.notes.clear(),
          db.expenses.clear(),
          db.budgets.clear(),
          db.accounts.clear(),
          db.friends?.clear?.(),
          db.groups?.clear?.(),
          db.sharedExpenses?.clear?.(),
        ]);
        await Promise.all([
          db.tasks.bulkPut(reconciled.tasks),
          db.notes.bulkPut(reconciled.notes),
          db.expenses.bulkPut(importedExpenses),
          db.budgets.bulkPut(importedBudgets),
          db.accounts.bulkPut(importedAccounts),
          db.friends?.bulkPut?.(importedFriends),
          db.groups?.bulkPut?.(importedGroups),
          db.sharedExpenses?.bulkPut?.(importedSharedExpenses),
          db.onboarding.put(importedOnboarding),
        ]);
      },
    );

    set({
      tasks: reconciled.tasks,
      notes: reconciled.notes,
      expenses: importedExpenses,
      budgets: importedBudgets,
      accounts: importedAccounts,
      friends: importedFriends,
      groups: importedGroups,
      sharedExpenses: importedSharedExpenses,
      onboarding: importedOnboarding,
      hydrated: true,
    });
  },

  updateOnboarding: async (updates) => {
    const current = get().onboarding;
    const now = new Date().toISOString();
    const next: OnboardingProfile = {
      ...current,
      ...updates,
      preferences: updates.preferences
        ? { ...current.preferences, ...updates.preferences }
        : current.preferences,
      updatedAt: now,
    };

    await db.onboarding.put(next);
    set({ onboarding: next });
    return next;
  },

  completeOnboarding: async (updates = {}) => {
    const current = get().onboarding;
    const now = new Date().toISOString();
    const next: OnboardingProfile = {
      ...current,
      ...updates,
      preferences: updates.preferences
        ? { ...current.preferences, ...updates.preferences }
        : current.preferences,
      currentStep: Math.max(current.currentStep, 7),
      completedAt: now,
      skippedAt: undefined,
      updatedAt: now,
    };
    const budgetSuggestions = buildBudgetSuggestions(next, get().budgets);

    await db.transaction('rw', [db.onboarding, db.budgets], async () => {
      await db.onboarding.put(next);
      if (budgetSuggestions.length > 0) {
        await db.budgets.bulkPut(budgetSuggestions);
      }
    });

    set((state) => ({
      onboarding: next,
      budgets: [...state.budgets, ...budgetSuggestions],
    }));
    return next;
  },

  skipOnboarding: async () => {
    const current = get().onboarding;
    const now = new Date().toISOString();
    const next: OnboardingProfile = {
      ...current,
      skippedAt: now,
      updatedAt: now,
    };

    await db.onboarding.put(next);
    set({ onboarding: next });
    return next;
  },

  // Accounts
  addAccount: async (input) => {
    const account: Account = {
      id: input.id ?? createId(),
      name: input.name,
      balance: dollarsToCentsSafe(input.balanceDollars),
      createdAt: new Date().toISOString(),
    };
    await db.accounts.put(account);
    set(state => ({ accounts: upsertItem(state.accounts, account) }));
    return account;
  },

  updateAccount: async (id, updates) => {
    const current = get().accounts.find(a => a.id === id);
    if (!current) return undefined;
    const next = { ...current, ...updates };
    await db.accounts.put(next);
    set(state => ({ accounts: upsertItem(state.accounts, next) }));
    return next;
  },

  deleteAccount: async (id) => {
    try {
      console.log('[Titan] Deleting account:', id);
      const currentState = get();
      const account = currentState.accounts.find((a) => a.id === id);
      if (!account) return;

      if (currentState.accounts.length <= 1) {
        throw new Error('Cannot delete the last account.');
      }

      const fallbackAccount = currentState.accounts.find((a) => a.id !== id);
      if (!fallbackAccount) {
        throw new Error('No fallback account available.');
      }

      const migratedExpenses = currentState.expenses
        .filter((expense) => expense.accountId === id)
        .map((expense) => ({ ...expense, accountId: fallbackAccount.id }));
      
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
        if (migratedExpenses.length > 0) {
          await db.expenses.bulkPut(migratedExpenses);
        }
      });

      set((prev) => ({
        accounts: prev.accounts
          .filter((entry) => entry.id !== id)
          .map((entry) => (entry.id === fallbackAccount.id ? updatedFallbackAccount : entry)),
        expenses: reassignedExpenses,
      }));
      console.log(`[Titan] Account ${id} deleted. Expenses migrated to ${fallbackAccount.id}.`);
    } catch (error) {
      console.error('[Titan] Delete account failed:', error);
      throw error;
    }
  },

  // Friends
  addFriend: async (input) => {
    const friend: Friend = {
      id: input.id || createId(),
      name: sanitizeString(input.name, 100),
      phoneNumber: sanitizeString(input.phoneNumber, 20),
      avatar: input.avatar,
      createdAt: createTimestamp(input.createdAt),
    };
    await db.friends.put(friend);
    set(state => ({ friends: upsertItem(state.friends, friend) }));
    return friend;
  },

  updateFriend: async (id, updates) => {
    const current = get().friends.find(f => f.id === id);
    if (!current) return undefined;
    const next: Friend = { ...current, ...updates };
    await db.friends.put(next);
    set(state => ({ friends: upsertItem(state.friends, next) }));
    return next;
  },

  deleteFriend: async (id) => {
    const currentState = get();
    const groups = currentState.groups.map(g => ({
      ...g,
      memberIds: g.memberIds.filter(mid => mid !== id)
    }));

    await db.transaction('rw', [db.friends, db.groups], async () => {
      await db.friends.delete(id);
      for (const g of groups) {
        await db.groups.update(g.id, { memberIds: g.memberIds });
      }
    });

    set(state => ({
      friends: state.friends.filter(f => f.id !== id),
      groups
    }));
  },

  // Groups
  addGroup: async (input) => {
    const group: Group = {
      id: input.id || createId(),
      name: sanitizeString(input.name, 100),
      memberIds: input.memberIds || [],
      createdAt: createTimestamp(input.createdAt),
    };
    await db.groups.put(group);
    set(state => ({ groups: upsertItem(state.groups, group) }));
    return group;
  },

  updateGroup: async (id, updates) => {
    const current = get().groups.find(g => g.id === id);
    if (!current) return undefined;
    const next: Group = { ...current, ...updates };
    await db.groups.put(next);
    set(state => ({ groups: upsertItem(state.groups, next) }));
    return next;
  },

  deleteGroup: async (id) => {
    await db.transaction('rw', [db.groups, db.sharedExpenses], async () => {
      await db.groups.delete(id);
      await db.sharedExpenses.where('groupId').equals(id).delete();
    });
    set(state => ({
      groups: state.groups.filter(g => g.id !== id),
      sharedExpenses: state.sharedExpenses.filter(se => se.groupId !== id)
    }));
  },

  // Shared Expenses
  addSharedExpense: async (input) => {
    const shared: SharedExpense = {
      id: input.id || createId(),
      totalAmount: input.totalAmount,
      description: sanitizeString(input.description, 200),
      paidBy: input.paidBy || 'user',
      groupId: input.groupId,
      participants: input.participants || [],
      linkedExpenseId: input.linkedExpenseId,
      note: sanitizeString(input.note, 500),
      area: input.area ?? 'social',
      createdAt: createTimestamp(input.createdAt),
    };
    await db.transaction('rw', [db.sharedExpenses, db.dailySnapshots], async () => {
      await db.sharedExpenses.put(shared);
      await get().updateSnapshot(shared.createdAt.split('T')[0], 'split', shared.totalAmount);
    });
    set(state => ({ sharedExpenses: upsertItem(state.sharedExpenses, shared) }));
    return shared;
  },

  deleteSharedExpense: async (id) => {
    await db.sharedExpenses.delete(id);
    set(state => ({ sharedExpenses: state.sharedExpenses.filter(se => se.id !== id) }));
  },

  // Tasks
  addTask: async (input) => {
    try {
      console.log('[Titan] Adding task:', input.title);
      const currentState = get();
      const task = normalizeTask(input, currentState.tasks);

      const errors = validateTaskRelationships(task, currentState.tasks);
      if (errors.length > 0) {
        throw new Error(errors.join(' '));
      }

      const nextNotes = syncTaskNoteReference(task, currentState.notes, currentState.tasks);
      const touchedNoteIds = new Set([task.noteId].filter(Boolean) as string[]);

      await db.transaction('rw', [db.tasks, db.notes, db.dailySnapshots], async () => {
        await db.tasks.put(task);
        if (touchedNoteIds.size > 0) {
          await db.notes.bulkPut(nextNotes.filter(n => touchedNoteIds.has(n.id)));
        }
        if (task.status === 'done') {
          await get().updateSnapshot(task.createdAt.split('T')[0], 'task', 1);
        }
      });

      set(state => ({ 
        tasks: upsertItem(state.tasks, task),
        notes: nextNotes
      }));
      return task;
    } catch (error) {
      console.error('[Titan] Add task failed:', error);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const currentState = get();
      const current = currentState.tasks.find(t => t.id === id);
      if (!current) return undefined;
      
      const nextTask = normalizeTask({ ...current, ...updates }, currentState.tasks);

      const errors = validateTaskRelationships(
        nextTask,
        currentState.tasks.filter((task) => task.id !== id),
      );
      if (errors.length > 0) {
        throw new Error(errors.join(' '));
      }

      const nextNotes = syncTaskNoteReference(nextTask, currentState.notes, currentState.tasks);
      const touchedNoteIds = new Set([current.noteId, nextTask.noteId].filter(Boolean) as string[]);

      await db.transaction('rw', [db.tasks, db.notes, db.dailySnapshots], async () => {
        await db.tasks.put(nextTask);
        if (touchedNoteIds.size > 0) {
          await db.notes.bulkPut(nextNotes.filter(n => touchedNoteIds.has(n.id)));
        }
        
        if (nextTask.status === 'done' && current.status !== 'done') {
          await get().updateSnapshot(nextTask.createdAt.split('T')[0], 'task', 1);
        } else if (nextTask.status !== 'done' && current.status === 'done') {
          await get().updateSnapshot(nextTask.createdAt.split('T')[0], 'task', -1);
        }
      });

      set(state => ({ 
        tasks: upsertItem(state.tasks, nextTask),
        notes: nextNotes
      }));
      return nextTask;
    } catch (error) {
      console.error('[Titan] Update task failed:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      console.log('[Titan] Deleting task:', id);
      const currentState = get();
      
      // Find all subtasks recursively
      const subtaskIds = new Set<string>();
      const findSubtasks = (parentId: string) => {
        currentState.tasks.filter(t => t.parentTaskId === parentId).forEach(sub => {
          if (!subtaskIds.has(sub.id)) {
            subtaskIds.add(sub.id);
            findSubtasks(sub.id);
          }
        });
      };
      findSubtasks(id);
      
      const allIdsToDelete = [id, ...Array.from(subtaskIds)];
      const affectedNoteIds = new Set<string>();
      
      // Collect all notes that need to be updated
      allIdsToDelete.forEach(taskId => {
        const t = currentState.tasks.find(x => x.id === taskId);
        if (t?.noteId) affectedNoteIds.add(t.noteId);
      });

      const nextNotes = currentState.notes.map(note => {
        let updated = false;
        let linkedTaskIds = note.linkedTaskIds || [];
        
        const nextLinked = linkedTaskIds.filter(tid => !allIdsToDelete.includes(tid));
        if (nextLinked.length !== linkedTaskIds.length) {
          updated = true;
          linkedTaskIds = nextLinked;
        }
        
        return updated ? { ...note, linkedTaskIds } : note;
      });

      const nextExpenses = currentState.expenses.map((expense) =>
        allIdsToDelete.includes(expense.linkedTaskId || '') ? { ...expense, linkedTaskId: undefined } : expense,
      );

      await db.transaction('rw', [db.tasks, db.notes, db.expenses], async () => {
        if (typeof db.tasks.bulkDelete === 'function') {
          await db.tasks.bulkDelete(allIdsToDelete);
        } else {
          await Promise.all(allIdsToDelete.map((taskId) => db.tasks.delete(taskId)));
        }
        
        const updatedNotes = nextNotes.filter(n => affectedNoteIds.has(n.id));
        if (updatedNotes.length > 0) {
          await db.notes.bulkPut(updatedNotes);
        }
        
        const updatedExpenses = nextExpenses.filter(e => allIdsToDelete.includes(get().expenses.find(x => x.id === e.id)?.linkedTaskId || ''));
        if (updatedExpenses.length > 0) {
          await db.expenses.bulkPut(updatedExpenses);
        }
      });

      set(state => ({ 
        tasks: state.tasks.filter(t => !allIdsToDelete.includes(t.id)),
        notes: nextNotes,
        expenses: nextExpenses,
      }));
      console.log(`[Titan] Deleted task ${id} and ${subtaskIds.size} subtasks.`);
    } catch (error) {
      console.error('[Titan] Delete task failed:', error);
      throw error;
    }
  },

  // Notes
  addNote: async (input) => {
    try {
      console.log('[Titan] Adding note');
      const note = normalizeNote(input);
      const currentState = get();
      const nextNotes = syncNoteNoteReferences(note, currentState.notes);
      const touchedIds = new Set([note.id, ...(note.linkedNoteIds ?? [])]);

      await db.transaction('rw', [db.notes, db.dailySnapshots], async () => {
        await db.notes.bulkPut(nextNotes.filter(n => touchedIds.has(n.id)));
        await get().updateSnapshot(note.createdAt.split('T')[0], 'note', 1);
      });

      set(state => ({ notes: nextNotes }));
      return note;
    } catch (error) {
      console.error('[Titan] Add note failed:', error);
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const currentState = get();
      const current = currentState.notes.find(n => n.id === id);
      if (!current) return undefined;

      const nextNote = normalizeNote({ ...current, ...updates });
      const nextNotes = syncNoteNoteReferences(nextNote, currentState.notes);
      const touchedIds = new Set([nextNote.id, ...(nextNote.linkedNoteIds ?? []), ...(current.linkedNoteIds ?? [])]);

      await db.transaction('rw', [db.notes, db.tasks], async () => {
        await db.notes.bulkPut(nextNotes.filter(n => touchedIds.has(n.id)));
        
        const { tasks: nextTasks } = reconcileTaskNoteReferences(currentState.tasks, [nextNote]);
        const changedTasks = nextTasks.filter(t => {
          const orig = currentState.tasks.find(ot => ot.id === t.id);
          return JSON.stringify(orig) !== JSON.stringify(t);
        });
        if (changedTasks.length > 0) {
          await db.tasks.bulkPut(changedTasks);
        }
      });

      set(state => ({
        notes: nextNotes,
        tasks: reconcileTaskNoteReferences(state.tasks, [nextNote]).tasks
      }));

      return nextNote;
    } catch (error) {
      console.error('[Titan] Update note failed:', error);
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      console.log('[Titan] Deleting note:', id);
      const currentState = get();
      
      const nextNotes = clearNoteBacklinks(id, currentState.notes).filter(n => n.id !== id);
      const nextTasks = clearTasksForDeletedNote(id, currentState.tasks);
      const nextExpenses = currentState.expenses.map((expense) =>
        expense.linkedNoteId === id ? { ...expense, linkedNoteId: undefined } : expense,
      );
      
      const touchedTaskIds = new Set(
        currentState.tasks.filter((task) => task.noteId === id).map((task) => task.id),
      );
      const touchedExpenseIds = new Set(
        currentState.expenses.filter((expense) => expense.linkedNoteId === id).map((expense) => expense.id),
      );
      const touchedNoteIds = new Set(
        currentState.notes.filter(n => n.linkedNoteIds?.includes(id)).map(n => n.id)
      );

      await db.transaction('rw', [db.tasks, db.notes, db.expenses], async () => {
        await db.notes.delete(id);
        if (touchedNoteIds.size > 0) {
          await db.notes.bulkPut(nextNotes.filter(n => touchedNoteIds.has(n.id)));
        }
        if (touchedTaskIds.size > 0) {
          await db.tasks.bulkPut(nextTasks.filter(t => touchedTaskIds.has(t.id)));
        }
        if (touchedExpenseIds.size > 0) {
          await db.expenses.bulkPut(nextExpenses.filter(e => touchedExpenseIds.has(e.id)));
        }
      });

      set({ notes: nextNotes, tasks: nextTasks, expenses: nextExpenses });
      console.log('[Titan] Note deleted successfully.');
    } catch (error) {
      console.error('[Titan] Delete note failed:', error);
      throw error;
    }
  },

  // Finance
  addExpense: async (input) => {
    try {
      console.log('[Titan] Adding expense:', input.category);
      const currentState = get();
      const sanitizedInput = sanitizeExpenseReferences(input, currentState.tasks, currentState.notes);
      const amount = normalizePositiveCents(
        typeof input.amount === 'number' 
          ? input.amount 
          : dollarsToCentsSafe(input.amountDollars || 0)
      );
      
      const accountId =
        sanitizedInput.accountId ??
        currentState.accounts.find((account) => account.id === 'cash')?.id ??
        currentState.accounts[0]?.id;
      
      if (!accountId) throw new Error('No account available for expense.');
      if (amount <= 0) throw new Error('Amount must be greater than zero.');

      const type = sanitizedInput.type ?? 'expense';
      const recurrenceRule = sanitizedInput.isRecurring
        ? normalizeExpenseRecurrenceRule(sanitizedInput.recurrenceRule)
        : undefined;

      const expense: Expense = {
        id: input.id ?? crypto.randomUUID(),
        amount,
        category: sanitizeString(input.category, 50) || 'Uncategorized',
        type,
        accountId,
        tags: sanitizeTags(sanitizedInput.tags),
        note: sanitizeString(sanitizedInput.note, 500),
        isRecurring: Boolean(sanitizedInput.isRecurring),
        recurrenceRule,
        linkedTaskId: sanitizedInput.linkedTaskId,
        linkedNoteId: sanitizedInput.linkedNoteId,
        area: (input as any).area || 'finance',
        createdAt: sanitizeDateString(input.createdAt) || new Date().toISOString(),
      };

      const account = currentState.accounts.find(a => a.id === accountId);
      if (!account) throw new Error(`Account not found: ${accountId}`);

      const nextBalance = applyExpenseToBalance(account.balance, amount, type);

      await db.transaction('rw', [db.expenses, db.accounts, db.dailySnapshots], async () => {
        await db.expenses.put(expense);
        await db.accounts.update(account.id, { balance: nextBalance });
        await get().updateSnapshot(expense.createdAt.split('T')[0], 'expense', amount);
      });

      set(state => ({ 
        expenses: upsertItem(state.expenses, expense),
        accounts: upsertItem(state.accounts, { ...account, balance: nextBalance })
      }));
      return expense;
    } catch (error) {
      console.error('[Titan] Add expense failed:', error);
      throw error;
    }
  },

  updateExpense: async (id, updates) => {
    try {
      const current = get().expenses.find(e => e.id === id);
      if (!current) return undefined;
      
      const sanitizedUpdates = sanitizeExpenseReferences(updates, get().tasks, get().notes);
      const amount =
        sanitizedUpdates.amount !== undefined
          ? normalizePositiveCents(sanitizedUpdates.amount)
          : current.amount;
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero.');
      }

      const isRecurring = sanitizedUpdates.isRecurring ?? current.isRecurring;
      const recurrenceRule = isRecurring
        ? normalizeExpenseRecurrenceRule(sanitizedUpdates.recurrenceRule ?? current.recurrenceRule)
        : undefined;
      if (isRecurring && !recurrenceRule) {
        throw new Error('Recurring expenses require a valid recurrence rule.');
      }

      const next: Expense = {
        ...current,
        ...sanitizedUpdates,
        amount,
        isRecurring,
        recurrenceRule,
      };
      
      await db.transaction('rw', [db.expenses, db.accounts], async () => {
         if (shouldRebalanceForExpenseUpdate(sanitizedUpdates)) {
           const nextAccounts = recalculateBalancesForExpenseUpdate(get().accounts, current, next);
           await Promise.all(nextAccounts.map((account) => db.accounts.put(account)));
         }
         await db.expenses.put(next);
      });

      set((state) => ({
        accounts: shouldRebalanceForExpenseUpdate(sanitizedUpdates)
          ? recalculateBalancesForExpenseUpdate(state.accounts, current, next)
          : state.accounts,
        expenses: upsertItem(state.expenses, next),
      }));
      return next;
    } catch (error) {
      console.error('[Titan] Update expense failed:', error);
      throw error;
    }
  },

  deleteExpense: async (id) => {
    console.log('[Titan] Deleting expense:', id);
    try {
      const current = get().expenses.find(e => e.id === id);
      if (!current) return;

      const account = get().accounts.find(a => a.id === current.accountId);
      
      await db.transaction('rw', [db.expenses, db.accounts], async () => {
        await db.expenses.delete(id);
        if (account) {
          const nextBalance = revertExpenseFromBalance(account.balance, current.amount, current.type);
          await db.accounts.update(account.id, { balance: nextBalance });
        }
      });

      set((state) => ({
        expenses: state.expenses.filter((expense) => expense.id !== id),
        accounts: account
          ? upsertItem(state.accounts, {
              ...account,
              balance: revertExpenseFromBalance(account.balance, current.amount, current.type),
            })
          : state.accounts,
      }));
      console.log('[Titan] Expense deleted successfully.');
    } catch (error) {
      console.error('[Titan] Delete expense failed:', error);
      throw error;
    }
  },

  addBudget: async (input) => {
    try {
      const budget = normalizeBudget(input);
      await db.budgets.put(budget);
      set(state => ({ budgets: upsertItem(state.budgets, budget) }));
      return budget;
    } catch (error) {
      console.error('[Titan] Add budget failed:', error);
      throw error;
    }
  },

  updateBudget: async (id, updates) => {
    try {
      const current = get().budgets.find(b => b.id === id);
      if (!current) return undefined;
      const next = normalizeBudget({ ...current, ...updates });
      await db.budgets.put(next);
      set(state => ({ budgets: upsertItem(state.budgets, next) }));
      return next;
    } catch (error) {
      console.error('[Titan] Update budget failed:', error);
      throw error;
    }
  },

  deleteBudget: async (id) => {
    await db.budgets.delete(id);
    set(state => ({ budgets: state.budgets.filter(b => b.id !== id) }));
  },

  getTodayTasks: () => {
    return getTodayTasksFromEngine(get().tasks);
  },

  getWeeklyExpenses: () => {
    return filterExpensesByRange(get().expenses, 'week');
  },

  getCategoryTotals: () => {
    return calculateCategoryTotals(get().expenses);
  },

  getPinnedNotes: () => {
    return get().notes.filter((n) => n.pinned);
  },

  getTimelineItems: () => {
    const { tasks, notes, expenses, sharedExpenses } = get();
    const items: TimelineItem[] = [
      ...tasks.map(t => ({ type: 'task' as const, data: t, timestamp: t.createdAt })),
      ...notes.map(n => ({ type: 'note' as const, data: n, timestamp: n.createdAt })),
      ...expenses.map(e => ({ type: 'expense' as const, data: e, timestamp: e.createdAt })),
      ...sharedExpenses.map(se => ({ type: 'split' as const, data: se, timestamp: se.createdAt })),
    ];
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  updateSnapshot: async (date, type, value = 1) => {
    const snapshots = get().dailySnapshots;
    let snapshot = snapshots.find(s => s.date === date);
    
    if (!snapshot) {
      snapshot = {
        date,
        tasksCompleted: 0,
        expensesTotal: 0,
        notesCreated: 0,
        splitsAdded: 0,
        topArea: 'personal',
      };
    }

    if (type === 'task') snapshot.tasksCompleted += value;
    else if (type === 'expense') snapshot.expensesTotal += value;
    else if (type === 'note') snapshot.notesCreated += value;
    else if (type === 'split') snapshot.splitsAdded += value;

    if (db.dailySnapshots && typeof db.dailySnapshots.put === 'function') {
      await db.dailySnapshots.put(snapshot);
    }
    set((state) => {
      const nextSnapshots = state.dailySnapshots.filter((entry) => entry.date !== snapshot!.date);
      nextSnapshots.push(snapshot!);
      return { dailySnapshots: nextSnapshots };
    });
  },

  recomputeSnapshots: async () => {
    const { tasks, expenses, notes, sharedExpenses } = get();
    const snapshotMap = new Map<string, DailySnapshot>();

    const getSnapshot = (date: string) => {
      if (!snapshotMap.has(date)) {
        snapshotMap.set(date, {
          date,
          tasksCompleted: 0,
          expensesTotal: 0,
          notesCreated: 0,
          splitsAdded: 0,
          topArea: 'personal',
        });
      }
      return snapshotMap.get(date)!;
    };

    tasks.filter(t => t.status === 'done').forEach(t => {
      const date = t.createdAt.split('T')[0];
      getSnapshot(date).tasksCompleted += 1;
    });

    expenses.filter(e => e.type === 'expense').forEach(e => {
      const date = e.createdAt.split('T')[0];
      getSnapshot(date).expensesTotal += e.amount;
    });

    notes.forEach(n => {
      const date = n.createdAt.split('T')[0];
      getSnapshot(date).notesCreated += 1;
    });

    sharedExpenses.forEach(se => {
      const date = se.createdAt.split('T')[0];
      getSnapshot(date).splitsAdded += se.totalAmount;
    });

    const newSnapshots = Array.from(snapshotMap.values());
    await db.transaction('rw', [db.dailySnapshots], async () => {
      await db.dailySnapshots.clear();
      await db.dailySnapshots.bulkPut(newSnapshots);
    });

    set({ dailySnapshots: newSnapshots });
  },

  processRecurringTransactions: async () => {
    const { expenses, addExpense, updateExpense } = get();
    const now = new Date();
    const recurring = expenses.filter(e => e.isRecurring && e.recurrenceRule);

    for (const item of recurring) {
      let cursorDate = new Date(item.lastProcessedAt || item.createdAt);
      let nextOccurrence = calculateNextOccurrence(cursorDate.toISOString(), item.recurrenceRule!);
      if (!nextOccurrence) continue;
      
      let nextDate = new Date(nextOccurrence);
      let createdCount = 0;

      while (nextDate <= now) {
        await addExpense({
          amount: item.amount,
          category: item.category,
          type: item.type,
          accountId: item.accountId,
          note: `Recurring: ${item.note || item.category}`,
          tags: item.tags,
          isRecurring: false,
          createdAt: nextDate.toISOString(),
        });
        cursorDate = nextDate;
        const nextTime = calculateNextOccurrence(nextDate.toISOString(), item.recurrenceRule!);
        if (!nextTime) break;
        nextDate = new Date(nextTime);
        createdCount++;
      }

      if (createdCount > 0) {
        await updateExpense(item.id, { lastProcessedAt: cursorDate.toISOString() });
      }
    }
  },

  resetRateLimits: async () => {
    // No-op for now, can be implemented with a debounce store if needed
    // localStorage.removeItem('titan-rate-limiter');
  },
}));

export async function initializeCoreStore() {
  if (useStore.getState().hydrated) return;
  await useStore.getState().hydrate();
}
