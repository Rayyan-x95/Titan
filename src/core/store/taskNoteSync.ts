import type { Note, Task, Friend, Group, Expense, SharedExpense } from './types';

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeNoteFields(note: Note) {
  return {
    ...note,
    linkedTaskIds: note.linkedTaskIds ?? [],
    linkedNoteIds: note.linkedNoteIds ?? [],
    pinned: note.pinned ?? false,
  };
}

export function validateTaskNoteReference(task: Task, notes: Note[]) {
  if (!task.noteId) {
    return;
  }

  const hasNote = notes.some((note) => note.id === task.noteId);

  if (!hasNote) {
    throw new Error(`Task ${task.id} references missing note ${task.noteId}`);
  }
}

export function validateExpenseReferences(
  expense: { linkedTaskId?: string; linkedNoteId?: string },
  tasks: Task[],
  notes: Note[],
): string[] {
  const errors: string[] = [];

  if (expense.linkedTaskId && !tasks.some((t) => t.id === expense.linkedTaskId)) {
    errors.push(`Linked task ${expense.linkedTaskId} does not exist`);
  }

  if (expense.linkedNoteId && !notes.some((n) => n.id === expense.linkedNoteId)) {
    errors.push(`Linked note ${expense.linkedNoteId} does not exist`);
  }

  return errors;
}

export function syncTaskNoteReference(task: Task, noteStore: Note[], taskStore: Task[]) {
  const previousTask = taskStore.find((item) => item.id === task.id);
  const previousNoteId = previousTask?.noteId;
  let nextNotes = noteStore.map(normalizeNoteFields);

  if (previousNoteId && previousNoteId !== task.noteId) {
    nextNotes = nextNotes.map((note) =>
      note.id === previousNoteId
        ? { ...note, linkedTaskIds: note.linkedTaskIds.filter((taskId) => taskId !== task.id) }
        : note,
    );
  }

  if (task.noteId) {
    nextNotes = nextNotes.map((note) =>
      note.id === task.noteId
        ? {
            ...note,
            linkedTaskIds: uniqueStrings([...note.linkedTaskIds, task.id]),
          }
        : note,
    );
  }

  return nextNotes;
}

export function syncNoteNoteReferences(note: Note, noteStore: Note[]) {
  const previousNote = noteStore.find((item) => item.id === note.id);
  // Filter out self-references
  const safePreviousLinks = new Set(
    (previousNote?.linkedNoteIds ?? []).filter((id) => id !== note.id),
  );
  const safeCurrentLinks = new Set((note.linkedNoteIds ?? []).filter((id) => id !== note.id));

  const normalizedNote = normalizeNoteFields({
    ...note,
    linkedNoteIds: Array.from(safeCurrentLinks),
  });
  const baseNotes = noteStore.map(normalizeNoteFields);
  const noteIndex = baseNotes.findIndex((item) => item.id === normalizedNote.id);
  let nextNotes =
    noteIndex === -1
      ? [...baseNotes, normalizedNote]
      : baseNotes.map((item) => (item.id === normalizedNote.id ? normalizedNote : item));

  // Remove backlinks for links that were removed
  safePreviousLinks.forEach((id) => {
    if (!safeCurrentLinks.has(id)) {
      nextNotes = nextNotes.map((n) =>
        n.id === id
          ? { ...n, linkedNoteIds: n.linkedNoteIds.filter((linkId) => linkId !== note.id) }
          : n,
      );
    }
  });

  // Add backlinks for new links
  safeCurrentLinks.forEach((id) => {
    if (!safePreviousLinks.has(id)) {
      nextNotes = nextNotes.map((n) =>
        n.id === id ? { ...n, linkedNoteIds: uniqueStrings([...n.linkedNoteIds, note.id]) } : n,
      );
    }
  });

  return nextNotes;
}

export function clearTaskNoteReference(taskId: string, noteStore: Note[]) {
  return noteStore.map((note) => {
    const fields = normalizeNoteFields(note);
    return {
      ...fields,
      linkedTaskIds: fields.linkedTaskIds.filter((linkedTaskId) => linkedTaskId !== taskId),
    };
  });
}

export function clearTasksForDeletedNote(noteId: string, taskStore: Task[]) {
  return taskStore.map((task) =>
    task.noteId === noteId
      ? {
          ...task,
          noteId: undefined,
        }
      : task,
  );
}

export function clearNoteBacklinks(noteId: string, noteStore: Note[]) {
  return noteStore.map((note) => {
    const fields = normalizeNoteFields(note);
    return {
      ...fields,
      linkedNoteIds: fields.linkedNoteIds.filter((id) => id !== noteId),
    };
  });
}

export function reconcileTaskNoteReferences(tasks: Task[], notes: Note[]) {
  const noteIds = new Set(notes.map((note) => note.id));
  const sanitizedTasks = tasks.map((task) =>
    task.noteId && !noteIds.has(task.noteId) ? { ...task, noteId: undefined } : task,
  );

  const normalizedNotes = notes.map((note) => {
    const fields = normalizeNoteFields(note);
    return {
      ...fields,
      linkedTaskIds: sanitizedTasks
        .filter((task) => task.noteId === note.id)
        .map((task) => task.id),
      linkedNoteIds: fields.linkedNoteIds.filter((id) => noteIds.has(id)),
    };
  });

  return { tasks: sanitizedTasks, notes: normalizedNotes };
}

/**
 * Detects circular references in note-to-note linking.
 * Returns error message if cycle detected, undefined if valid.
 * Uses depth-first search with visited tracking.
 */
export function detectNoteReferenceCycle(noteId: string, notes: Note[]): string | undefined {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(id: string): boolean {
    if (recursionStack.has(id)) {
      return true; // Cycle detected - node is in current path
    }
    if (visited.has(id)) {
      return false; // Already fully explored this node
    }

    visited.add(id);
    recursionStack.add(id);

    const note = notes.find((n) => n.id === id);
    const linkedIds = note?.linkedNoteIds ?? [];

    for (const linkedId of linkedIds) {
      if (hasCycle(linkedId)) return true;
    }

    recursionStack.delete(id);
    return false;
  }

  if (hasCycle(noteId)) {
    return `Circular reference detected: Note ${noteId} creates a cycle in linked notes`;
  }

  return undefined;
}

/**
 * Validates all note references before updating.
 * Returns array of error messages (empty if valid).
 */
export function validateNoteReferences(note: Note, noteStore: Note[]): string[] {
  const errors: string[] = [];
  const noteIds = new Set(noteStore.map((n) => n.id));

  // Check that all linked notes exist
  const linkedIds = note.linkedNoteIds ?? [];
  for (const linkedId of linkedIds) {
    if (!noteIds.has(linkedId)) {
      errors.push(`Linked note ${linkedId} does not exist`);
    }
  }

  // Check for circular references
  const cycleError = detectNoteReferenceCycle(note.id, [
    ...noteStore.filter((n) => n.id !== note.id),
    note,
  ]);
  if (cycleError) {
    errors.push(cycleError);
  }

  return errors;
}

/**
 * Performs a comprehensive referential integrity check across all core entities.
 * Prunes orphaned IDs and ensures data consistency after hydration or bulk imports.
 */
export function reconcileIntegrity(
  tasks: Task[],
  notes: Note[],
  expenses: Expense[],
  sharedExpenses: SharedExpense[],
  groups: Group[],
  friends: Friend[],
) {
  // 1. Task-Note integrity
  const { tasks: cleanTasks, notes: cleanNotes } = reconcileTaskNoteReferences(tasks, notes);

  // 2. Expense integrity
  const cleanExpenses = expenses.map((e) => ({
    ...e,
    linkedTaskId:
      e.linkedTaskId && cleanTasks.some((t) => t.id === e.linkedTaskId)
        ? e.linkedTaskId
        : undefined,
    linkedNoteId:
      e.linkedNoteId && cleanNotes.some((n) => n.id === e.linkedNoteId)
        ? e.linkedNoteId
        : undefined,
  }));

  // 3. Shared Expense integrity
  const friendIds = new Set(['user', ...friends.map((f) => f.id)]);
  const groupIds = new Set(groups.map((g) => g.id));

  const cleanSharedExpenses = sharedExpenses.map((se) => {
    const nextParticipants = se.participants.filter((p) => friendIds.has(p.id));
    const nextPaidBy = friendIds.has(se.paidBy) ? se.paidBy : 'user';
    const nextTotalAmount = nextParticipants.reduce((sum, p) => sum + p.amount, 0);
    return {
      ...se,
      groupId: se.groupId && groupIds.has(se.groupId) ? se.groupId : undefined,
      paidBy: nextPaidBy,
      participants: nextParticipants,
      totalAmount: nextTotalAmount,
    };
  });

  // 4. Group integrity
  const cleanGroups = groups.map((g) => ({
    ...g,
    memberIds: g.memberIds.filter((mid) => friendIds.has(mid)),
  }));

  return {
    tasks: cleanTasks,
    notes: cleanNotes,
    expenses: cleanExpenses,
    sharedExpenses: cleanSharedExpenses,
    groups: cleanGroups,
    friends,
  };
}
