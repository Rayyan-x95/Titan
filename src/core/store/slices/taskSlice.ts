import { StateCreator } from 'zustand';
import { db } from '@/core/db/db';
import type { Task, TaskInput, TaskUpdate } from '../types';
import type { CoreStoreState } from '../useStore';
import { syncTaskNoteReference } from '../taskNoteSync';
import {
  normalizeTask,
  validateTaskRelationships,
  generateNextRecurringTasks,
} from '@/lib/core/taskEngine';
import { upsertItem } from '../utils';
import { toLocalDateString } from '@/utils/date';

function findAllSubtaskIds(parentId: string, tasks: Task[]): Set<string> {
  const subtaskIds = new Set<string>();
  const queue = [parentId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = tasks.filter((t) => t.parentTaskId === currentId);
    children.forEach((child) => {
      if (!subtaskIds.has(child.id)) {
        subtaskIds.add(child.id);
        queue.push(child.id);
      }
    });
  }

  return subtaskIds;
}

export interface TaskSlice {
  tasks: Task[];
  addTask: (task: TaskInput) => Promise<Task>;
  updateTask: (id: string, updates: TaskUpdate) => Promise<Task | undefined>;
  deleteTask: (id: string) => Promise<void>;
  processRecurringTasks: () => Promise<void>;
}

export const createTaskSlice: StateCreator<CoreStoreState, [], [], TaskSlice> = (set, get) => ({
  tasks: [],

  addTask: async (input) => {
    const task = normalizeTask(input, get().tasks);
    const errors = validateTaskRelationships(task, get().tasks);
    if (errors.length > 0) throw new Error(errors.join(' '));

    const notes = syncTaskNoteReference(task, get().notes, get().tasks);
    const affectedNoteIds = new Set(notes.filter((n) => n.id === task.noteId).map((n) => n.id));

    await db.transaction('rw', [db.tasks, db.notes], async () => {
      await db.tasks.put(task);
      if (affectedNoteIds.size > 0) {
        await db.notes.bulkPut(notes.filter((n) => affectedNoteIds.has(n.id)));
      }
    });

    set((state) => ({
      tasks: upsertItem(state.tasks, task),
      notes,
    }));

    const today = toLocalDateString(new Date());
    await get().updateSnapshot(today, 'task', 1);

    return task;
  },

  updateTask: async (id, updates) => {
    const current = get().tasks.find((t) => t.id === id);
    if (!current) return undefined;

    const task = normalizeTask({ ...current, ...updates }, get().tasks);
    const errors = validateTaskRelationships(task, get().tasks);
    if (errors.length > 0) throw new Error(errors.join(' '));

    const notes = syncTaskNoteReference(task, get().notes, get().tasks);
    const affectedNoteIds = new Set();
    if (current.noteId !== task.noteId) {
      if (current.noteId) affectedNoteIds.add(current.noteId);
      if (task.noteId) affectedNoteIds.add(task.noteId);
    }

    await db.transaction('rw', [db.tasks, db.notes], async () => {
      await db.tasks.put(task);
      if (affectedNoteIds.size > 0) {
        await db.notes.bulkPut(notes.filter((n) => affectedNoteIds.has(n.id)));
      }
    });

    set((state) => ({
      tasks: upsertItem(state.tasks, task),
      notes,
    }));

    if (current.status !== 'done' && task.status === 'done') {
      const today = toLocalDateString(new Date());
      await get().updateSnapshot(today, 'task', 1);
    } else if (current.status === 'done' && task.status !== 'done') {
      const today = toLocalDateString(new Date());
      await get().updateSnapshot(today, 'task', -1);
    }

    return task;
  },

  deleteTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const allTaskIdsToDelete = Array.from(findAllSubtaskIds(id, get().tasks));
    allTaskIdsToDelete.push(id);
    const deleteSet = new Set(allTaskIdsToDelete);

    const notes = get().notes.map((note) => {
      const linkedTaskIds = (note.linkedTaskIds || []).filter((tid) => !deleteSet.has(tid));
      return linkedTaskIds.length !== (note.linkedTaskIds || []).length
        ? { ...note, linkedTaskIds }
        : note;
    });

    const expenses = get().expenses.map((e) =>
      e.linkedTaskId && deleteSet.has(e.linkedTaskId) ? { ...e, linkedTaskId: undefined } : e,
    );

    const originalNotesById = new Map(get().notes.map((n) => [n.id, n]));
    const originalExpensesById = new Map(get().expenses.map((e) => [e.id, e]));

    await db.transaction('rw', [db.tasks, db.notes, db.expenses], async () => {
      await db.tasks.bulkDelete(allTaskIdsToDelete);

      const affectedNotes = notes.filter((n) => n !== originalNotesById.get(n.id));
      if (affectedNotes.length > 0) {
        await db.notes.bulkPut(affectedNotes);
      }

      const affectedExpenses = expenses.filter((e) => e !== originalExpensesById.get(e.id));
      if (affectedExpenses.length > 0) {
        await db.expenses.bulkPut(affectedExpenses);
      }
    });

    // Update snapshot if the deleted task (or its subtasks) were done
    const tasksToDelete = get().tasks.filter((t) => deleteSet.has(t.id));
    const doneTasksCount = tasksToDelete.filter((t) => t.status === 'done').length;

    set((state) => ({
      tasks: state.tasks.filter((t) => !deleteSet.has(t.id)),
      notes,
      expenses,
    }));

    if (doneTasksCount > 0) {
      const today = toLocalDateString(new Date());
      await get().updateSnapshot(today, 'task', -doneTasksCount);
    }
  },

  processRecurringTasks: async () => {
    const { tasks } = get();
    const { newTasks, updatedTasks } = generateNextRecurringTasks(tasks);

    if (newTasks.length === 0 && updatedTasks.length === 0) return;

    await db.transaction('rw', [db.tasks], async () => {
      if (newTasks.length > 0) await db.tasks.bulkPut(newTasks);
      if (updatedTasks.length > 0) await db.tasks.bulkPut(updatedTasks);
    });

    set((state) => {
      let nextTasks = [...state.tasks];
      updatedTasks.forEach((t) => {
        nextTasks = upsertItem(nextTasks, t);
      });
      return { tasks: [...nextTasks, ...newTasks] };
    });
  },
});
