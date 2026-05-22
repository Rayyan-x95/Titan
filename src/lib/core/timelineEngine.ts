import type {
  Task,
  Note,
  Expense,
  SharedExpense,
  DailySnapshot,
  TimelineItem,
} from '@/core/store/types';
import { toLocalDateString } from '@/utils/date';

const wrapperCache = new WeakMap<object, TimelineItem>();

export function buildTimelineItems(
  tasks: Task[],
  notes: Note[],
  expenses: Expense[],
  sharedExpenses: SharedExpense[],
): TimelineItem[] {
  const getWrapper = (
    type: 'task' | 'note' | 'expense' | 'split',
    item: Task | Note | Expense | SharedExpense,
  ): TimelineItem => {
    let cached = wrapperCache.get(item);
    if (!cached) {
      cached = { type, data: item, timestamp: item.createdAt } as TimelineItem;
      wrapperCache.set(item, cached);
    }
    return cached;
  };

  const items: TimelineItem[] = [
    ...tasks.map((t) => getWrapper('task', t)),
    ...notes.map((n) => getWrapper('note', n)),
    ...expenses.map((e) => getWrapper('expense', e)),
    ...sharedExpenses.map((se) => getWrapper('split', se)),
  ];
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function computeDailySnapshots(
  tasks: Task[],
  notes: Note[],
  expenses: Expense[],
  sharedExpenses: SharedExpense[],
): DailySnapshot[] {
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

  tasks
    .filter((t) => t.status === 'done')
    .forEach((t) => {
      const date = toLocalDateString(t.createdAt);
      if (date) getSnapshot(date).tasksCompleted += 1;
    });

  expenses
    .filter((e) => e.type === 'expense')
    .forEach((e) => {
      const date = toLocalDateString(e.createdAt);
      if (date) getSnapshot(date).expensesTotal += e.amount;
    });

  notes.forEach((n) => {
    const date = toLocalDateString(n.createdAt);
    if (date) getSnapshot(date).notesCreated += 1;
  });

  sharedExpenses.forEach((se) => {
    const date = toLocalDateString(se.createdAt);
    if (date) getSnapshot(date).splitsAdded += 1; // Count of splits, not amount
  });

  return Array.from(snapshotMap.values());
}
