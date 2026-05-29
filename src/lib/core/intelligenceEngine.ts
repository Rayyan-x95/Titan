import type {
  Account,
  Budget,
  Expense,
  Friend,
  Note,
  SharedExpense,
  Task,
} from '@/core/store/types';
import { calculateTotalOwed } from '@/lib/core/splitEngine';

export type InboxKind = 'task' | 'note' | 'expense';

export interface InboxDraft {
  kind: InboxKind;
  title: string;
  amountCents?: number;
  category?: string;
  note?: string;
  suggestion?: string;
  confidence?: number;
}

export interface BriefTaskItem {
  id: string;
  title: string;
  dueDate: string;
  daysAway: number;
}

export interface BriefRecurringExpenseItem {
  id: string;
  category: string;
  amountCents: number;
  nextDueDate: string;
}

export interface DailyBrief {
  overdueTasks: Task[];
  dueTodayTasks: Task[];
  upcomingTasks: BriefTaskItem[];
  highPriorityTasks: Task[];
  budgetAlerts: { category: string; spent: number; limit: number; percent: number }[];
  recentNotes: Note[];
  pendingSettlements: SharedExpense[];
  recurringExpenses: BriefRecurringExpenseItem[];
  splitBalance: number;
  spendingToday: number;
}

export interface SearchFacet {
  text?: string;
  tags: string[];
  status?: string;
  area?: string;
  category?: string;
  type?: string;
  amountGreaterThan?: number;
  amountLessThan?: number;
  date?: string;
}

export interface SearchResult {
  id: string;
  type: 'task' | 'note' | 'expense' | 'split';
  title: string;
  detail: string;
  createdAt: string;
}

export interface DataHealthIssue {
  id: string;
  severity: 'info' | 'warn' | 'error';
  title: string;
  detail: string;
}

function toDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function includesQuery(values: Array<string | undefined>, query: string) {
  return values.some((value) => value?.toLowerCase().includes(query));
}

function calculateNextOccurrence(
  baseDate: string,
  recurrence: { type: 'daily' | 'weekly' | 'monthly'; interval: number },
) {
  const date = new Date(baseDate);
  if (Number.isNaN(date.getTime())) return baseDate;

  if (recurrence.type === 'daily') date.setDate(date.getDate() + recurrence.interval);
  else if (recurrence.type === 'weekly') date.setDate(date.getDate() + recurrence.interval * 7);
  else if (recurrence.type === 'monthly') date.setMonth(date.getMonth() + recurrence.interval);

  return date.toISOString();
}

function getDaysAway(targetDate: string, today: string) {
  const target = new Date(targetDate);
  const current = new Date(today);
  if (Number.isNaN(target.getTime()) || Number.isNaN(current.getTime())) return 0;
  const diff = target.getTime() - current.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function parseSearchFacet(query: string): SearchFacet {
  const facet: SearchFacet = { tags: [] };
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  const freeText: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    const amountGreater = lower.match(/^amount>(\d+(?:\.\d+)?)$/);
    const amountLess = lower.match(/^amount<(\d+(?:\.\d+)?)$/);
    const prefixed = lower.match(/^([a-z]+):(.*)$/);

    if (amountGreater) {
      facet.amountGreaterThan = Math.round(Number(amountGreater[1]) * 100);
      continue;
    }

    if (amountLess) {
      facet.amountLessThan = Math.round(Number(amountLess[1]) * 100);
      continue;
    }

    if (prefixed) {
      const [, key, rawValue] = prefixed;
      const value = rawValue.replace(/^['"]|['"]$/g, '').trim();
      if (!value) continue;

      if (key === 'tag') facet.tags.push(value.toLowerCase());
      else if (key === 'status') facet.status = value.toLowerCase();
      else if (key === 'area') facet.area = value.toLowerCase();
      else if (key === 'category') facet.category = value.toLowerCase();
      else if (key === 'type') facet.type = value.toLowerCase();
      else if (key === 'date') facet.date = value;
      else freeText.push(token);
      continue;
    }

    freeText.push(token);
  }

  facet.text = freeText.join(' ').trim();
  return facet;
}

export function parseInboxDraft(input: string): InboxDraft {
  const text = input.trim();
  if (!text) throw new Error('Enter something to capture.');

  const lower = text.toLowerCase();
  const amountMatch = text.match(/(?:₹|rs\.?|inr|\$)?\s*(\d+(?:\.\d{1,2})?)/i);
  const amountCents = amountMatch ? Math.round(Number(amountMatch[1]) * 100) : undefined;

  if (lower.startsWith('note:') || lower.startsWith('idea:')) {
    return {
      kind: 'note',
      title: text.replace(/^(note|idea):/i, '').trim(),
      suggestion: 'Save as note',
      confidence: 0.92,
    };
  }

  if (lower.startsWith('task:') || lower.startsWith('todo:')) {
    return {
      kind: 'task',
      title: text.replace(/^(task|todo):/i, '').trim(),
      suggestion: 'Create a task',
      confidence: 0.94,
    };
  }

  if (
    lower.startsWith('expense:') ||
    lower.startsWith('spent ') ||
    lower.includes(' paid ') ||
    lower.includes(' bought ') ||
    amountCents
  ) {
    const category =
      lower.includes('food') || lower.includes('coffee') || lower.includes('lunch')
        ? 'Food'
        : lower.includes('uber') || lower.includes('fuel') || lower.includes('taxi')
          ? 'Transport'
          : 'General';

    return {
      kind: 'expense',
      title: text,
      amountCents: amountCents ?? 0,
      category,
      note: text,
      suggestion: `Create an expense under ${category}`,
      confidence: amountCents ? 0.9 : 0.72,
    };
  }

  return {
    kind: 'task',
    title: text,
    suggestion: 'Defaulting to task',
    confidence: 0.55,
  };
}

export function buildDailyBrief(input: {
  tasks: Task[];
  notes: Note[];
  expenses: Expense[];
  budgets: Budget[];
  sharedExpenses: SharedExpense[];
  today?: Date;
}): DailyBrief {
  const todayKey = toDateKey(input.today ?? new Date());
  const today = todayKey || new Date().toISOString().slice(0, 10);
  const expenseByCategory = new Map<string, number>();
  const spendingToday = input.expenses
    .filter((expense) => expense.type === 'expense' && toDateKey(expense.createdAt) === todayKey)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const recurringExpenses = input.expenses
    .filter((expense) => expense.isRecurring && expense.recurrenceRule)
    .map((expense) => ({
      id: expense.id,
      category: expense.category,
      amountCents: expense.amount,
      nextDueDate: calculateNextOccurrence(
        expense.lastProcessedAt || expense.createdAt,
        expense.recurrenceRule!,
      ),
    }))
    .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate))
    .slice(0, 8);

  for (const expense of input.expenses) {
    if (expense.type === 'income') continue;
    expenseByCategory.set(
      expense.category,
      (expenseByCategory.get(expense.category) ?? 0) + expense.amount,
    );
  }

  return {
    overdueTasks: input.tasks.filter(
      (task) => task.status !== 'done' && task.dueDate && task.dueDate < todayKey,
    ),
    dueTodayTasks: input.tasks.filter(
      (task) => task.status !== 'done' && task.dueDate === todayKey,
    ),
    upcomingTasks: input.tasks
      .filter((task) => task.status !== 'done' && task.dueDate && task.dueDate > todayKey)
      .map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate!,
        daysAway: getDaysAway(task.dueDate!, today),
      }))
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
      .slice(0, 5),
    highPriorityTasks: input.tasks
      .filter((task) => task.status !== 'done' && task.priority === 'high')
      .slice(0, 5),
    budgetAlerts: input.budgets
      .map((budget) => {
        const spent = expenseByCategory.get(budget.category) ?? 0;
        const percent = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;
        return { category: budget.category, spent, limit: budget.limit, percent };
      })
      .filter((item) => item.percent >= 80)
      .sort((a, b) => b.percent - a.percent),
    recentNotes: [...input.notes]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3),
    pendingSettlements: input.sharedExpenses.filter(
      (expense) => expense.isSettlement && expense.settlementStatus !== 'settled',
    ),
    recurringExpenses,
    splitBalance: calculateTotalOwed(input.sharedExpenses),
    spendingToday,
  };
}

export function searchTitan(input: {
  query: string;
  tasks: Task[];
  notes: Note[];
  expenses: Expense[];
  sharedExpenses: SharedExpense[];
}): SearchResult[] {
  const facet = parseSearchFacet(input.query);
  const query = normalizeQuery(facet.text ?? '');
  if (
    !query &&
    facet.tags.length === 0 &&
    !facet.status &&
    !facet.area &&
    !facet.category &&
    !facet.type &&
    facet.amountGreaterThan === undefined &&
    facet.amountLessThan === undefined &&
    !facet.date
  ) {
    return [];
  }

  const results: SearchResult[] = [];

  const matchesFacet = (candidate: {
    textValues: Array<string | undefined>;
    tags?: string[];
    status?: string;
    area?: string;
    category?: string;
    type?: string;
    amount?: number;
    createdAt?: string;
  }) => {
    if (facet.status && candidate.status?.toLowerCase() !== facet.status) return false;
    if (facet.area && candidate.area?.toLowerCase() !== facet.area) return false;
    if (facet.category && !candidate.category?.toLowerCase().includes(facet.category)) return false;
    if (facet.type && candidate.type?.toLowerCase() !== facet.type) return false;
    if (facet.amountGreaterThan !== undefined && (candidate.amount ?? 0) <= facet.amountGreaterThan)
      return false;
    if (facet.amountLessThan !== undefined && (candidate.amount ?? 0) >= facet.amountLessThan)
      return false;
    if (facet.date && candidate.createdAt && !candidate.createdAt.startsWith(facet.date))
      return false;
    if (facet.tags.length > 0) {
      const candidateTags = new Set((candidate.tags ?? []).map((tag) => tag.toLowerCase()));
      if (!facet.tags.every((tag) => candidateTags.has(tag))) return false;
    }
    if (query && !includesQuery(candidate.textValues, query)) return false;
    return true;
  };

  for (const task of input.tasks) {
    if (
      matchesFacet({
        textValues: [task.title, task.area, task.status, ...(task.tags ?? [])],
        tags: task.tags,
        status: task.status,
        area: task.area,
        createdAt: task.createdAt,
      })
    ) {
      results.push({
        id: task.id,
        type: 'task',
        title: task.title,
        detail: [task.status, task.priority, task.dueDate].filter(Boolean).join(' • '),
        createdAt: task.createdAt,
      });
    }
  }

  for (const note of input.notes) {
    if (
      matchesFacet({
        textValues: [note.content, note.area, ...(note.tags ?? [])],
        tags: note.tags,
        area: note.area,
        createdAt: note.createdAt,
      })
    ) {
      results.push({
        id: note.id,
        type: 'note',
        title: note.content.split('\n')[0] || 'Untitled note',
        detail: note.tags.join(', '),
        createdAt: note.createdAt,
      });
    }
  }

  for (const expense of input.expenses) {
    if (
      matchesFacet({
        textValues: [
          expense.category,
          expense.note,
          expense.area,
          expense.type,
          ...(expense.tags ?? []),
        ],
        tags: expense.tags,
        area: expense.area,
        category: expense.category,
        type: expense.type,
        amount: expense.amount,
        createdAt: expense.createdAt,
      })
    ) {
      results.push({
        id: expense.id,
        type: 'expense',
        title: expense.category,
        detail: `${expense.type} • ${expense.amount}`,
        createdAt: expense.createdAt,
      });
    }
  }

  for (const split of input.sharedExpenses) {
    if (
      matchesFacet({
        textValues: [split.description, split.note, split.area],
        area: split.area,
        createdAt: split.createdAt,
      })
    ) {
      results.push({
        id: split.id,
        type: 'split',
        title: split.description,
        detail: split.isSettlement ? 'settlement' : 'shared expense',
        createdAt: split.createdAt,
      });
    }
  }

  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);
}

export function diagnoseDataHealth(input: {
  tasks: Task[];
  notes: Note[];
  expenses: Expense[];
  accounts: Account[];
  friends: Friend[];
  sharedExpenses: SharedExpense[];
}): DataHealthIssue[] {
  const issues: DataHealthIssue[] = [];
  const noteIds = new Set(input.notes.map((note) => note.id));
  const taskIds = new Set(input.tasks.map((task) => task.id));
  const accountIds = new Set(input.accounts.map((account) => account.id));
  const friendIds = new Set(input.friends.map((friend) => friend.id));
  const categoryVariants = new Map<string, Set<string>>();

  for (const expense of input.expenses) {
    const normalized = expense.category.trim().toLowerCase();
    if (!categoryVariants.has(normalized)) categoryVariants.set(normalized, new Set());
    categoryVariants.get(normalized)!.add(expense.category.trim());
  }

  for (const task of input.tasks) {
    if (task.noteId && !noteIds.has(task.noteId)) {
      issues.push({
        id: `task-note-${task.id}`,
        severity: 'error',
        title: 'Task links to a missing note',
        detail: task.title,
      });
    }
    if (task.parentTaskId && !taskIds.has(task.parentTaskId)) {
      issues.push({
        id: `task-parent-${task.id}`,
        severity: 'warn',
        title: 'Task has a missing parent',
        detail: task.title,
      });
    }

    if (task.recurrence && task.status === 'done' && !task.lastProcessedAt) {
      issues.push({
        id: `task-recurring-${task.id}`,
        severity: 'warn',
        title: 'Recurring task needs processing',
        detail: task.title,
      });
    }
  }

  for (const note of input.notes) {
    const missingLinkedTasks = (note.linkedTaskIds ?? []).filter((id) => !taskIds.has(id));
    const missingLinkedNotes = (note.linkedNoteIds ?? []).filter((id) => !noteIds.has(id));
    if (missingLinkedTasks.length > 0) {
      issues.push({
        id: `note-tasks-${note.id}`,
        severity: 'error',
        title: 'Note links to missing tasks',
        detail: `${missingLinkedTasks.length} missing link(s)`,
      });
    }
    if (missingLinkedNotes.length > 0) {
      issues.push({
        id: `note-notes-${note.id}`,
        severity: 'error',
        title: 'Note links to missing notes',
        detail: `${missingLinkedNotes.length} missing backlink(s)`,
      });
    }
  }

  for (const expense of input.expenses) {
    if (!accountIds.has(expense.accountId)) {
      issues.push({
        id: `expense-account-${expense.id}`,
        severity: 'error',
        title: 'Expense uses a missing account',
        detail: expense.category,
      });
    }
    if (expense.isRecurring && !expense.recurrenceRule) {
      issues.push({
        id: `expense-recurring-${expense.id}`,
        severity: 'warn',
        title: 'Recurring expense is missing a recurrence rule',
        detail: expense.category,
      });
    }
    if (expense.linkedTaskId && !taskIds.has(expense.linkedTaskId)) {
      issues.push({
        id: `expense-task-${expense.id}`,
        severity: 'warn',
        title: 'Expense links to a missing task',
        detail: expense.category,
      });
    }
  }

  for (const [normalized, variants] of categoryVariants.entries()) {
    if (variants.size > 1) {
      issues.push({
        id: `category-${normalized}`,
        severity: 'info',
        title: 'Duplicate category labels detected',
        detail: Array.from(variants).join(' / '),
      });
    }
  }

  for (const split of input.sharedExpenses) {
    if (!friendIds.has(split.paidBy)) {
      issues.push({
        id: `split-payer-${split.id}`,
        severity: 'warn',
        title: 'Shared expense has a missing payer',
        detail: split.description,
      });
    }
  }

  const staleRecurringExpenses = input.expenses.filter(
    (expense) => expense.isRecurring && expense.recurrenceRule && !expense.lastProcessedAt,
  );
  if (staleRecurringExpenses.length > 0) {
    issues.push({
      id: 'stale-recurring-expenses',
      severity: 'warn',
      title: 'Recurring expenses need a processing pass',
      detail: `${staleRecurringExpenses.length} item(s) are pending their next generated occurrence.`,
    });
  }

  if (issues.length === 0) {
    issues.push({
      id: 'clean',
      severity: 'info',
      title: 'Data graph looks healthy',
      detail: 'No broken task, note, expense, account, or split references were found.',
    });
  }

  return issues;
}

export function summarizeSearchFacets(query: string): SearchFacet {
  return parseSearchFacet(query);
}
