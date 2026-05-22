// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Account,
  Budget,
  DailySnapshot,
  Expense,
  Friend,
  Group,
  Note,
  OnboardingProfile,
  SharedExpense,
  Task,
} from './types';

function createTable<T>(getKey: (value: T) => string = (value) => (value as { id: string }).id) {
  const rows = new Map<string, T>();

  return {
    toArray() {
      return Promise.resolve(Array.from(rows.values()));
    },
    put(value: T) {
      const key = getKey(value);
      rows.set(key, value);
      return Promise.resolve(key);
    },
    get(id: string) {
      return Promise.resolve(rows.get(id));
    },
    update(id: string, updates: Partial<T>) {
      const current = rows.get(id);
      if (!current) return Promise.resolve(0);
      rows.set(id, { ...current, ...updates });
      return Promise.resolve(1);
    },
    delete(id: string) {
      rows.delete(id);
      return Promise.resolve();
    },
    clear() {
      rows.clear();
      return Promise.resolve();
    },
    bulkPut(values: T[]) {
      for (const value of values) {
        rows.set(getKey(value), value);
      }
      return Promise.resolve();
    },
    bulkDelete(ids: string[]) {
      for (const id of ids) {
        rows.delete(id);
      }
      return Promise.resolve();
    },
  };
}

const tables = vi.hoisted(() => ({
  tasksTable: createTable<Task>(),
  notesTable: createTable<Note>(),
  expensesTable: createTable<Expense>(),
  budgetsTable: createTable<Budget>(),
  accountsTable: createTable<Account>(),
  onboardingTable: createTable<OnboardingProfile>(),
  friendsTable: createTable<Friend>(),
  groupsTable: createTable<Group>(),
  sharedExpensesTable: createTable<SharedExpense>(),
  dailySnapshotsTable: createTable<DailySnapshot>((snapshot) => snapshot.date),
}));

vi.mock('@/core/db/db', () => ({
  db: {
    tasks: tables.tasksTable,
    notes: tables.notesTable,
    expenses: tables.expensesTable,
    budgets: tables.budgetsTable,
    accounts: tables.accountsTable,
    onboarding: tables.onboardingTable,
    friends: tables.friendsTable,
    groups: tables.groupsTable,
    sharedExpenses: tables.sharedExpensesTable,
    dailySnapshots: tables.dailySnapshotsTable,
    tables: [
      tables.tasksTable,
      tables.notesTable,
      tables.expensesTable,
      tables.budgetsTable,
      tables.accountsTable,
      tables.onboardingTable,
      tables.friendsTable,
      tables.groupsTable,
      tables.sharedExpensesTable,
      tables.dailySnapshotsTable,
    ],
    transaction: async (_mode: string, ...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<void>;
      await callback();
    },
  },
}));

import { useStore } from './useStore';

beforeEach(async () => {
  await tables.tasksTable.clear();
  await tables.notesTable.clear();
  await tables.expensesTable.clear();
  await tables.budgetsTable.clear();
  await tables.accountsTable.clear();
  await tables.onboardingTable.clear();
  await tables.friendsTable.clear();
  await tables.groupsTable.clear();
  await tables.sharedExpensesTable.clear();
  await tables.dailySnapshotsTable.clear();

  const createdAt = new Date().toISOString();
  const cashAccount: Account = { id: 'cash', name: 'Cash', balance: 0, createdAt };
  const bankAccount: Account = { id: 'bank', name: 'Bank', balance: 0, createdAt };

  useStore.setState({
    tasks: [],
    notes: [],
    expenses: [],
    budgets: [],
    accounts: [cashAccount, bankAccount],
    friends: [],
    groups: [],
    sharedExpenses: [],
    dailySnapshots: [],
    hydrated: true,
  });
  await tables.accountsTable.put(cashAccount);
  await tables.accountsTable.put(bankAccount);
});

describe('core store stabilization behavior', () => {
  it('supports basic task CRUD', async () => {
    const created = await useStore.getState().addTask({ title: 'Ship launch', status: 'todo' });
    expect(useStore.getState().tasks).toHaveLength(1);

    const updated = await useStore.getState().updateTask(created.id, { status: 'doing' });
    expect(updated?.status).toBe('doing');

    await useStore.getState().deleteTask(created.id);
    expect(useStore.getState().tasks).toHaveLength(0);
  });

  it('keeps note-task links synchronized when tasks are added or removed', async () => {
    const note = await useStore.getState().addNote({
      content: 'Release checklist',
      tags: ['launch'],
    });

    const task = await useStore.getState().addTask({
      title: 'Write changelog',
      status: 'todo',
      noteId: note.id,
    });

    const linkedNote = useStore.getState().notes.find((item) => item.id === note.id);
    expect(linkedNote?.linkedTaskIds).toContain(task.id);

    await useStore.getState().deleteTask(task.id);
    const unlinkedNote = useStore.getState().notes.find((item) => item.id === note.id);
    expect(unlinkedNote?.linkedTaskIds).toEqual([]);
  });

  it('removes invalid expense task links on create, update, and import', async () => {
    const task = await useStore.getState().addTask({ title: 'Pay hosting bill', status: 'todo' });

    const validExpense = await useStore.getState().addExpense({
      amountDollars: 10,
      category: 'Ops',
      linkedTaskId: task.id,
    });
    expect(validExpense.linkedTaskId).toBe(task.id);

    const invalidExpense = await useStore.getState().addExpense({
      amountDollars: 11,
      category: 'Ops',
      linkedTaskId: 'missing-task',
    });
    expect(invalidExpense.linkedTaskId).toBeUndefined();

    const updated = await useStore
      .getState()
      .updateExpense(validExpense.id, { linkedTaskId: 'missing-task' });
    expect(updated?.linkedTaskId).toBeUndefined();

    await useStore.getState().importBackup({
      tasks: [
        { id: 'task-1', title: 'Valid task', status: 'todo', createdAt: new Date().toISOString() },
      ],
      notes: [],
      expenses: [
        {
          id: 'expense-1',
          amount: 1234,
          category: 'Misc',
          linkedTaskId: 'non-existent',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    expect(useStore.getState().expenses[0]?.linkedTaskId).toBeUndefined();
  });

  it('normalizes updated expense amounts to integer cents', async () => {
    const expense = await useStore.getState().addExpense({
      amountDollars: 10,
      category: 'Ops',
    });

    const updated = await useStore.getState().updateExpense(expense.id, { amount: 1234.56 });

    expect(updated?.amount).toBe(1234);
    expect(useStore.getState().expenses.find((item) => item.id === expense.id)?.amount).toBe(1234);
  });

  it('clears stale timeline snapshots from state and storage on import', async () => {
    await useStore.getState().updateSnapshot('2026-05-01', 'expense', 1200);
    expect(useStore.getState().dailySnapshots).toHaveLength(1);
    expect(await tables.dailySnapshotsTable.toArray()).toHaveLength(1);

    await useStore.getState().importBackup({
      tasks: [],
      notes: [],
      expenses: [],
    });

    expect(useStore.getState().dailySnapshots).toEqual([]);
    expect(await tables.dailySnapshotsTable.toArray()).toEqual([]);
  });

  it('rejects note creation with missing linked notes', async () => {
    await expect(
      useStore.getState().addNote({
        content: 'Invalid link',
        tags: [],
        linkedNoteIds: ['missing-note'],
      }),
    ).rejects.toThrow(/does not exist/);
  });

  it('rejects shared expenses with invalid payer or unbalanced shares', async () => {
    const friend = await useStore.getState().addFriend({ name: 'Ava' });

    await expect(
      useStore.getState().addSharedExpense({
        totalAmount: 1000,
        description: 'Dinner',
        paidBy: 'missing-friend',
        participants: [{ id: friend.id, amount: 1000 }],
      }),
    ).rejects.toThrow(/Paid by/);

    await expect(
      useStore.getState().addSharedExpense({
        totalAmount: 1000,
        description: 'Dinner',
        paidBy: 'user',
        participants: [{ id: friend.id, amount: 900 }],
      }),
    ).rejects.toThrow(/sum to total amount/);
  });
});
