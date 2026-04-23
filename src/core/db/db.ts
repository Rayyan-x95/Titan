import Dexie, { type Table } from 'dexie';
import type { Account, Budget, DailySnapshot, Expense, Note, OnboardingProfile, Task, Friend, Group, SharedExpense } from '@/core/store/types';

class TitanDatabase extends Dexie {
  tasks!: Table<Task, string>;
  notes!: Table<Note, string>;
  expenses!: Table<Expense, string>;
  budgets!: Table<Budget, string>;
  accounts!: Table<Account, string>;
  onboarding!: Table<OnboardingProfile, string>;
  friends!: Table<Friend, string>;
  groups!: Table<Group, string>;
  sharedExpenses!: Table<SharedExpense, string>;
  dailySnapshots!: Table<DailySnapshot, string>;

  constructor() {
    super('titan');

    this.version(1).stores({
      tasks: 'id, status, createdAt, dueDate, noteId',
      notes: 'id, createdAt',
      expenses: 'id, category, createdAt, linkedTaskId',
      onboarding: 'id',
    });

    this.version(3).stores({
      tasks: 'id, status, createdAt, dueDate, noteId',
      notes: 'id, createdAt',
      expenses: 'id, category, createdAt, linkedTaskId, accountId, type',
      budgets: 'id, category, period',
      accounts: 'id, name, createdAt',
      onboarding: 'id',
      friends: 'id, name, phoneNumber, createdAt',
      groups: 'id, name, createdAt',
      sharedExpenses: 'id, groupId, paidBy, createdAt',
      dailySnapshots: 'date',
    });

    this.tasks = this.table('tasks');
    this.notes = this.table('notes');
    this.expenses = this.table('expenses');
    this.budgets = this.table('budgets');
    this.accounts = this.table('accounts');
    this.onboarding = this.table('onboarding');
    this.friends = this.table('friends');
    this.groups = this.table('groups');
    this.sharedExpenses = this.table('sharedExpenses');
    this.dailySnapshots = this.table('dailySnapshots');
  }
}

export const db = new TitanDatabase();
