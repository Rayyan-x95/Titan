import { useMemo, useEffect } from 'react';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import { useSeo } from '@/hooks/useSeo';
import { noteTitle } from '@/lib/core/noteEngine';
import type { Task } from '@/core/store/types';
import {
  useTodayTasks,
  useTotalOwed,
  useSpentToday,
  useBudgetSummary,
  useCompletedTodayTasks,
  useActiveTasks,
  usePriorityTasks,
  useRecentNotes,
} from '@/core/store/selectors';

const MAX_TASK_ITEMS = 5;

export function useDashboard() {
  useSeo({
    title: 'Dashboard',
    description: 'Your personal command center for tasks, notes, and finance.',
  });

  const currency = useSettings((s) => s.currency);
  const tasks = useStore((s) => s.tasks);
  const notes = useStore((s) => s.notes);
  const hydrated = useStore((s) => s.hydrated);
  const processRecurringTasks = useStore((s) => s.processRecurringTasks);

  useEffect(() => {
    if (hydrated) {
      void processRecurringTasks();
    }
  }, [hydrated, processRecurringTasks]);

  const todayTasks = useTodayTasks();
  const activeTasks = useActiveTasks();
  const priorityTasks = usePriorityTasks(3);
  const completedToday = useCompletedTodayTasks();
  const recentNotes = useRecentNotes(3);
  const todaySpendCents = useSpentToday();
  const totalOwed = useTotalOwed();
  const budgetSummary = useBudgetSummary();

  const dashboardTasks = useMemo(() => {
    const seen = new Set<string>();
    const merged: Task[] = [];
    for (const t of [...todayTasks, ...activeTasks]) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        merged.push(t);
      }
      if (merged.length >= MAX_TASK_ITEMS) break;
    }
    return merged;
  }, [todayTasks, activeTasks]);

  const continueItem = useMemo(() => {
    const lastTask = tasks.length
      ? [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : null;
    const lastNote = notes.length
      ? [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : null;

    if (!lastTask && !lastNote) return null;

    if (lastTask && lastNote) {
      const useTask = lastTask.createdAt >= lastNote.createdAt;
      return useTask
        ? { type: 'task' as const, id: lastTask.id, title: lastTask.title, to: '/tasks' }
        : {
            type: 'note' as const,
            id: lastNote.id,
            title: noteTitle(lastNote.content),
            to: '/notes',
          };
    }

    if (lastTask)
      return { type: 'task' as const, id: lastTask.id, title: lastTask.title, to: '/tasks' };
    if (lastNote)
      return {
        type: 'note' as const,
        id: lastNote.id,
        title: noteTitle(lastNote.content),
        to: '/notes',
      };
    return null;
  }, [tasks, notes]);

  const todayString = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  );

  const formattedSpend = formatMoney(todaySpendCents, currency);

  return {
    currency,
    dashboardTasks,
    continueItem,
    todayString,
    formattedSpend,
    totalOwed,
    budgetSummary,
    completedTodayCount: completedToday.length,
    pendingCount: activeTasks.length,
    priorityTasks,
    recentNotes,
    notesTotal: notes.length,
  };
}
