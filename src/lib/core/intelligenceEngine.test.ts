import { describe, expect, it } from 'vitest';
import {
  buildDailyBrief,
  diagnoseDataHealth,
  parseInboxDraft,
  searchTitan,
} from './intelligenceEngine';
import type { Account, Expense, Note, Task } from '@/core/store/types';

const task: Task = {
  id: 'task-1',
  title: 'Pay rent',
  status: 'todo',
  priority: 'high',
  dueDate: '2026-05-29',
  createdAt: '2026-05-28T00:00:00.000Z',
};

const note: Note = {
  id: 'note-1',
  content: 'Rent transfer details',
  tags: ['home'],
  pinned: false,
  createdAt: '2026-05-28T01:00:00.000Z',
};

const expense: Expense = {
  id: 'expense-1',
  amount: 90000,
  category: 'Rent',
  type: 'expense',
  accountId: 'bank',
  tags: ['home'],
  isRecurring: true,
  createdAt: '2026-05-28T02:00:00.000Z',
};

const account: Account = {
  id: 'bank',
  name: 'Bank',
  balance: 100000,
  createdAt: '2026-05-01T00:00:00.000Z',
};

describe('intelligenceEngine', () => {
  it('parses inbox captures into task, note, and expense drafts', () => {
    expect(parseInboxDraft('task: Call bank')).toMatchObject({ kind: 'task', title: 'Call bank' });
    expect(parseInboxDraft('note: IFSC is ABCD')).toMatchObject({
      kind: 'note',
      title: 'IFSC is ABCD',
    });
    expect(parseInboxDraft('spent 250 coffee')).toMatchObject({
      kind: 'expense',
      amountCents: 25000,
      category: 'Food',
    });
  });

  it('builds a daily brief from existing Titan entities', () => {
    const brief = buildDailyBrief({
      tasks: [task],
      notes: [note],
      expenses: [{ ...expense, createdAt: '2026-05-29T08:00:00.000Z' }],
      budgets: [{ id: 'budget-1', category: 'Rent', limit: 100000, period: 'monthly' }],
      sharedExpenses: [],
      today: new Date('2026-05-29T10:00:00.000Z'),
    });

    expect(brief.dueTodayTasks).toHaveLength(1);
    expect(brief.highPriorityTasks).toHaveLength(1);
    expect(brief.budgetAlerts[0]).toMatchObject({ category: 'Rent', percent: 90 });
    expect(brief.upcomingTasks).toEqual([]);
    expect(brief.spendingToday).toBe(90000);
  });

  it('searches across tasks, notes, expenses, and splits', () => {
    const results = searchTitan({
      query: 'rent',
      tasks: [task],
      notes: [note],
      expenses: [expense],
      sharedExpenses: [],
    });

    expect(results.map((result) => result.type).sort()).toEqual(['expense', 'note', 'task']);
  });

  it('supports fielded search filters', () => {
    const results = searchTitan({
      query: 'area:finance amount>800 tag:home',
      tasks: [task],
      notes: [note],
      expenses: [{ ...expense, area: 'finance', tags: ['home'] }],
      sharedExpenses: [],
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe('expense');
  });

  it('reports broken references in the local data graph', () => {
    const issues = diagnoseDataHealth({
      tasks: [{ ...task, noteId: 'missing-note' }],
      notes: [],
      expenses: [{ ...expense, accountId: 'missing-account' }],
      accounts: [account],
      friends: [],
      sharedExpenses: [],
    });

    expect(issues.some((issue) => issue.id === 'task-note-task-1')).toBe(true);
    expect(issues.some((issue) => issue.id === 'expense-account-expense-1')).toBe(true);
  });

  it('flags stale recurring and duplicate categories', () => {
    const issues = diagnoseDataHealth({
      tasks: [{ ...task, recurrence: { type: 'monthly', interval: 1 }, status: 'done' }],
      notes: [],
      expenses: [
        {
          ...expense,
          category: 'Food',
          isRecurring: true,
          recurrenceRule: { type: 'monthly', interval: 1 },
        },
        { ...expense, id: 'expense-2', category: 'food', isRecurring: false },
      ],
      accounts: [account],
      friends: [],
      sharedExpenses: [],
    });

    expect(issues.some((issue) => issue.id === 'task-recurring-task-1')).toBe(true);
    expect(issues.some((issue) => issue.id === 'category-food')).toBe(true);
  });
});
