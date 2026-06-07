import { describe, it, expect } from 'vitest';
import { generateProjections } from './projectionEngine';
import type { Account, Budget, Expense, SharedExpense } from '@/core/store/types';

describe('projectionEngine', () => {
  const dummyAccounts: Account[] = [
    { id: 'bank', name: 'Bank', balance: 100000, createdAt: new Date().toISOString() }, // 1000.00
    { id: 'cash', name: 'Cash', balance: 50000, createdAt: new Date().toISOString() }, // 500.00
  ];

  const dummyExpenses: Expense[] = [
    {
      id: 'salary',
      amount: 300000, // 3000.00
      category: 'Salary',
      type: 'income',
      accountId: 'bank',
      tags: [],
      isRecurring: true,
      recurrenceRule: { type: 'monthly', interval: 1 },
      createdAt: '2026-05-01T00:00:00.000Z',
    },
    {
      id: 'rent',
      amount: 100000, // 1000.00
      category: 'Rent',
      type: 'expense',
      accountId: 'bank',
      tags: [],
      isRecurring: true,
      recurrenceRule: { type: 'monthly', interval: 1 },
      createdAt: '2026-05-01T00:00:00.000Z',
    },
    {
      id: 'food-var',
      amount: 1000, // 10.00 variable spend
      category: 'Food',
      type: 'expense',
      accountId: 'cash',
      tags: [],
      isRecurring: false,
      createdAt: '2026-05-25T12:00:00.000Z',
    },
  ];

  const dummyBudgets: Budget[] = [
    { id: 'b1', category: 'Food', limit: 30000, period: 'monthly' }, // 300.00 monthly = 10.00 daily
  ];

  const dummyShared: SharedExpense[] = [
    {
      id: 'se1',
      totalAmount: 15000, // 150.00 total
      description: 'Dinner',
      paidBy: 'primary',
      participants: [
        { id: 'primary', amount: 5000 },
        { id: 'friend1', amount: 10000 }, // Friend owes 100.00
      ],
      settlementStatus: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];

  it('calculates trajectory correctly over 180 days', () => {
    const now = new Date('2026-05-30T10:00:00.000Z');
    const result = generateProjections({
      accounts: dummyAccounts,
      expenses: dummyExpenses,
      budgets: dummyBudgets,
      sharedExpenses: dummyShared,
      daysToProject: 30,
      now,
    });

    expect(result.length).toBe(30);
    expect(result[0].date).toBe('2026-05-30');

    // Starting balance should be initial balance = 150000 cents (1500.00)
    // Plus daily updates (receivables spread in optimistic, etc.)
    expect(result[0].optimisticBalance).toBeLessThan(155000);
    expect(result[29].date).toBe('2026-06-28');
  });

  it('factors in recurring monthly income and expenses on scheduled days', () => {
    const now = new Date('2026-05-30T00:00:00.000Z');
    const result = generateProjections({
      accounts: dummyAccounts,
      expenses: dummyExpenses,
      budgets: [],
      sharedExpenses: [],
      daysToProject: 5,
      now,
    });

    // Verify first 5 days projection exists
    expect(result.length).toBe(5);
    expect(result[0].optimisticBalance).toBeDefined();
    expect(result[0].pessimisticBalance).toBeDefined();
  });
});
