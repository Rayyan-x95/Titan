import { useShallow } from 'zustand/react/shallow';
import { useStore } from './useStore';
import { toLocalDateString, isToday } from '@/utils/date';
import { buildTimelineItems } from '@/lib/core/timelineEngine';
import {
  filterExpensesByRange,
  calculateCategoryTotals,
  calculateTotalBalance,
  calculateTotalSpent,
  calculateTotalIncome,
  safeAddCents,
  calculateMonthlyExpense,
  getTopCategories,
  getWeeklyTrend,
} from '@/lib/core/financeEngine';
import { calculateTotalOwed } from '@/lib/core/splitEngine';
import type { TimelineItem } from './types';

export function useTimelineItems(): TimelineItem[] {
  return useStore(
    useShallow((state) =>
      buildTimelineItems(state.tasks, state.notes, state.expenses, state.sharedExpenses),
    ),
  );
}

export function useTodayTasks() {
  return useStore(
    useShallow((state) => {
      const today = toLocalDateString(new Date());
      return state.tasks.filter((task) => {
        if (!task.dueDate) return false;
        const d = new Date(task.dueDate);
        if (Number.isNaN(d.getTime())) return false;
        return toLocalDateString(d) === today;
      });
    }),
  );
}

export function useActiveTasks() {
  return useStore(
    useShallow((state) => state.tasks.filter((t) => t.status === 'todo' || t.status === 'doing')),
  );
}

export function useCompletedTodayTasks() {
  return useStore(
    useShallow((state) => {
      const today = toLocalDateString(new Date());
      return state.tasks.filter((task) => {
        if (task.status !== 'done') return false;
        if (task.dueDate && toLocalDateString(new Date(task.dueDate)) === today) return true;
        return toLocalDateString(new Date(task.createdAt)) === today;
      });
    }),
  );
}

export function usePriorityTasks(limit = 3) {
  return useStore(
    useShallow((state) => {
      return [...state.tasks]
        .filter((t) => t.status !== 'done')
        .sort((a, b) => {
          const pMap = { high: 0, medium: 1, low: 2 };
          if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
          if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return b.createdAt.localeCompare(a.createdAt);
        })
        .slice(0, limit);
    }),
  );
}

export function useRecentNotes(limit = 3) {
  return useStore(
    useShallow((state) => {
      return [...state.notes]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    }),
  );
}

export function useWeeklyExpenses() {
  return useStore(useShallow((state) => filterExpensesByRange(state.expenses, 'week')));
}

export function useMonthlySpend() {
  return useStore((state) => calculateMonthlyExpense(state.expenses));
}

export function useLastMonthSpend() {
  return useStore((state) => {
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return calculateMonthlyExpense(state.expenses, lastMonthDate);
  });
}

export function useCategoryTotals() {
  return useStore(useShallow((state) => calculateCategoryTotals(state.expenses, new Date())));
}

export function usePersonalExpenses() {
  return useStore(
    useShallow((state) => {
      const sharedLinkedIds = new Set(
        state.sharedExpenses.map((s) => s.linkedExpenseId).filter(Boolean),
      );
      return state.expenses.filter((e) => !sharedLinkedIds.has(e.id));
    }),
  );
}

export function useSharedExpenseItems() {
  return useStore(useShallow((state) => state.sharedExpenses));
}

export function useTopCategories(limit = 3) {
  return useStore(useShallow((state) => getTopCategories(state.expenses, limit, new Date())));
}

export function useWeeklyTrend() {
  return useStore(useShallow((state) => getWeeklyTrend(state.expenses)));
}

export function usePinnedNotes() {
  return useStore(useShallow((state) => state.notes.filter((n) => n.pinned)));
}

export function useTotalOwed() {
  return useStore((state) => calculateTotalOwed(state.sharedExpenses));
}

export function useTotalBalance() {
  return useStore((state) => calculateTotalBalance(state.accounts));
}

export function useTotalSpent() {
  return useStore((state) => calculateTotalSpent(state.expenses));
}

export function useTotalIncome() {
  return useStore((state) => calculateTotalIncome(state.expenses));
}

export function useSpentToday() {
  return useStore((state) => {
    return state.expenses
      .filter((e) => e.type === 'expense' && isToday(e.createdAt))
      .reduce((sum, e) => safeAddCents(sum, e.amount), 0);
  });
}

export function useNotesToday() {
  return useStore(useShallow((state) => state.notes.filter((n) => isToday(n.createdAt))));
}

export function useBudgetSummary() {
  return useStore(
    useShallow((state) => {
      const totalLimit = state.budgets.reduce((sum, b) => safeAddCents(sum, b.limit), 0);
      const totalSpent = calculateTotalSpent(state.expenses);
      const percent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
      return { limit: totalLimit, spent: totalSpent, percent };
    }),
  );
}
