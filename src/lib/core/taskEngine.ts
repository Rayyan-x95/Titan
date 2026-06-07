import type { Task, TaskRecurrence } from '@/core/store/types';
import { sanitizeTitle, sanitizeDateString } from '@/utils/sanitizer';
import { toLocalDateString } from '@/utils/date';

export function calculateNextOccurrence(
  baseDate: string,
  recurrence: { type: 'daily' | 'weekly' | 'monthly'; interval: number },
): string {
  const date = new Date(baseDate);
  if (!Number.isFinite(date.getTime())) return baseDate;

  if (recurrence.type === 'daily') date.setDate(date.getDate() + recurrence.interval);
  else if (recurrence.type === 'weekly') date.setDate(date.getDate() + recurrence.interval * 7);
  else if (recurrence.type === 'monthly') date.setMonth(date.getMonth() + recurrence.interval);

  return date.toISOString();
}

export function normalizeRecurrence(value: unknown): TaskRecurrence | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const candidate = value as Record<string, unknown>;
  const validTypes = ['daily', 'weekly', 'monthly'] as const;
  const type =
    typeof candidate.type === 'string' && (validTypes as readonly string[]).includes(candidate.type)
      ? (candidate.type as 'daily' | 'weekly' | 'monthly')
      : undefined;

  const interval =
    typeof candidate.interval === 'number' &&
    Number.isFinite(candidate.interval) &&
    candidate.interval > 0
      ? candidate.interval
      : undefined;

  return type && interval ? { type, interval } : undefined;
}

const MAX_TASK_DEPTH = 5;

export function getSubtreeDepth(taskId: string, tasks: Task[]): number {
  const byParent = new Map<string, string[]>();
  tasks.forEach((t) => {
    if (t.parentTaskId) {
      const list = byParent.get(t.parentTaskId) ?? [];
      list.push(t.id);
      byParent.set(t.parentTaskId, list);
    }
  });

  const visited = new Set<string>();

  function getDepth(id: string): number {
    if (visited.has(id)) return 0;
    visited.add(id);
    const children = byParent.get(id) ?? [];
    if (children.length === 0) {
      visited.delete(id);
      return 0;
    }
    const maxVal = 1 + Math.max(...children.map(getDepth));
    visited.delete(id);
    return maxVal;
  }

  return getDepth(taskId);
}

export function getTaskHierarchyDepth(taskId: string, tasks: Task[]): number {
  let depth = 0;
  let cursor: string | undefined = taskId;
  const byId = new Map(tasks.map((task) => [task.id, task] as const));

  while (cursor && depth < MAX_TASK_DEPTH + 1) {
    cursor = byId.get(cursor)?.parentTaskId;
    if (cursor) depth++;
  }

  return depth;
}

export function hasTaskParentCycle(taskId: string, parentTaskId: string, tasks: Task[]): boolean {
  let cursor: string | undefined = parentTaskId;
  const byId = new Map(tasks.map((task) => [task.id, task] as const));
  const visited = new Set<string>([taskId]);

  while (cursor) {
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = byId.get(cursor)?.parentTaskId;

    // Safety break for extremely deep nesting
    if (visited.size > 100) return true;
  }

  return false;
}

export function validateTaskRelationships(task: Task, tasks: Task[]): string[] {
  const errors: string[] = [];

  if (task.parentTaskId) {
    if (task.parentTaskId === task.id) {
      errors.push('Task cannot be its own parent.');
    }

    const parent = tasks.find((item) => item.id === task.parentTaskId);
    if (!parent) {
      errors.push('Parent task does not exist.');
    } else {
      if (hasTaskParentCycle(task.id, task.parentTaskId, tasks)) {
        errors.push('Task parent relationship creates a cycle.');
      }

      const parentDepth = getTaskHierarchyDepth(task.parentTaskId, tasks);
      const subtreeDepth = getSubtreeDepth(task.id, tasks);
      if (parentDepth + 1 + subtreeDepth > MAX_TASK_DEPTH) {
        errors.push(`Task hierarchy is too deep (max ${MAX_TASK_DEPTH}).`);
      }
    }
  }

  return errors;
}

export function getTodayTasks(tasks: Task[], now = new Date()): Task[] {
  const today = toLocalDateString(now);
  return tasks.filter((task) => task.dueDate === today);
}

export function normalizeTask(payload: unknown, _existingTasks: Task[] = []): Task {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    const time = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      title: 'Untitled Task',
      status: 'todo',
      priority: 'medium',
      energy: 'medium',
      area: 'personal',
      createdAt: time,
      updatedAt: time,
    };
  }
  const p = payload as Record<string, unknown>;
  const title =
    typeof p.title === 'string' ? sanitizeTitle(p.title) || 'Untitled Task' : 'Untitled Task';

  const validStatus = ['todo', 'doing', 'done'] as const;
  const status =
    typeof p.status === 'string' && (validStatus as readonly string[]).includes(p.status)
      ? (p.status as (typeof validStatus)[number])
      : 'todo';

  const validLevels = ['low', 'medium', 'high'] as const;
  const priority =
    typeof p.priority === 'string' && (validLevels as readonly string[]).includes(p.priority)
      ? (p.priority as (typeof validLevels)[number])
      : 'medium';

  const energy =
    typeof p.energy === 'string' && (validLevels as readonly string[]).includes(p.energy)
      ? (p.energy as (typeof validLevels)[number])
      : 'medium';

  const validAreas = ['work', 'personal', 'health', 'finance', 'social'] as const;
  const area =
    typeof p.area === 'string' && (validAreas as readonly string[]).includes(p.area)
      ? (p.area as (typeof validAreas)[number])
      : 'personal';

  const fallbackTime = new Date().toISOString();
  const createdAt = sanitizeDateString(p.createdAt) || fallbackTime;
  const updatedAt = sanitizeDateString(p.updatedAt) || createdAt;

  const task: Task = {
    id: typeof p.id === 'string' && p.id.length > 0 ? p.id : crypto.randomUUID(),
    title,
    status,
    priority,
    energy,
    area,
    dueDate: toLocalDateString(sanitizeDateString(p.dueDate) || '') || undefined,
    noteId: typeof p.noteId === 'string' ? p.noteId : undefined,
    parentTaskId: typeof p.parentTaskId === 'string' ? p.parentTaskId : undefined,
    recurrence: normalizeRecurrence(p.recurrence),
    tags: Array.isArray(p.tags)
      ? p.tags.filter((t): t is string => typeof t === 'string')
      : undefined,
    createdAt,
    updatedAt,
  };

  return task;
}

export function generateNextRecurringTasks(tasks: Task[]): {
  newTasks: Task[];
  updatedTasks: Task[];
} {
  const recurring = tasks.filter((t) => t.recurrence && t.status === 'done' && !t.lastProcessedAt);
  const newTasks: Task[] = [];
  const updatedTasks: Task[] = [];

  for (const item of recurring) {
    const cursorDate = new Date(item.dueDate || item.createdAt);
    const nextOccurrence = calculateNextOccurrence(cursorDate.toISOString(), item.recurrence!);
    if (!nextOccurrence) continue;

    const now = new Date().toISOString();
    updatedTasks.push({ ...item, lastProcessedAt: now, updatedAt: now });

    newTasks.push({
      id: crypto.randomUUID(),
      title: item.title,
      status: 'todo',
      priority: item.priority,
      energy: item.energy,
      area: item.area,
      dueDate: toLocalDateString(nextOccurrence),
      recurrence: item.recurrence,
      tags: item.tags,
      noteId: item.noteId,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { newTasks, updatedTasks };
}
