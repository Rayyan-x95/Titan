import type { Task, TaskRecurrence } from '@/core/store/types';
import { sanitizeTitle, sanitizeDateString } from '@/utils/sanitizer';

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
  const type =
    candidate.type === 'daily' ||
    candidate.type === 'weekly' ||
    candidate.type === 'monthly'
      ? candidate.type
      : undefined;

  const interval =
    typeof candidate.interval === 'number' && Number.isFinite(candidate.interval) && candidate.interval > 0
      ? candidate.interval
      : undefined;

  return type && interval ? { type, interval } : undefined;
}

const MAX_TASK_DEPTH = 5;

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

      if (getTaskHierarchyDepth(task.id, tasks) > MAX_TASK_DEPTH) {
        errors.push(`Task hierarchy is too deep (max ${MAX_TASK_DEPTH}).`);
      }
    }
  }

  return errors;
}

export function getTodayTasks(tasks: Task[], now = new Date()): Task[] {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  return tasks.filter((task) => task.dueDate === today);
}

export function normalizeTask(payload: any, existingTasks: Task[] = []): Task {
  const title = sanitizeTitle(payload.title) || 'Untitled Task';
  const status = ['todo', 'doing', 'done'].includes(payload.status) ? payload.status : 'todo';
  const priority = ['low', 'medium', 'high'].includes(payload.priority) ? payload.priority : 'medium';
  const energy = ['low', 'medium', 'high'].includes(payload.energy) ? payload.energy : 'medium';
  const area = ['work', 'personal', 'health', 'finance', 'social'].includes(payload.area) ? payload.area : 'personal';

  const task: Task = {
    id: typeof payload.id === 'string' && payload.id.length > 0 ? payload.id : crypto.randomUUID(),
    title,
    status,
    priority,
    energy,
    area,
    dueDate: sanitizeDateString(payload.dueDate)?.split('T')[0],
    noteId: typeof payload.noteId === 'string' ? payload.noteId : undefined,
    parentTaskId: typeof payload.parentTaskId === 'string' ? payload.parentTaskId : undefined,
    recurrence: normalizeRecurrence(payload.recurrence),
    createdAt: sanitizeDateString(payload.createdAt) || new Date().toISOString(),
  };

  return task;
}
