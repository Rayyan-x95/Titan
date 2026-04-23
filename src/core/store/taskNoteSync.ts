import type { Note, Task } from './types';

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
  const previousLinks = new Set(previousNote?.linkedNoteIds ?? []);
  const currentLinks = new Set(note.linkedNoteIds ?? []);

  const normalizedNote = normalizeNoteFields(note);
  const baseNotes = noteStore.map(normalizeNoteFields);
  const noteIndex = baseNotes.findIndex((item) => item.id === normalizedNote.id);
  let nextNotes =
    noteIndex === -1
      ? [...baseNotes, normalizedNote]
      : baseNotes.map((item) => (item.id === normalizedNote.id ? normalizedNote : item));

  // Remove backlinks for links that were removed
  previousLinks.forEach((id) => {
    if (!currentLinks.has(id)) {
      nextNotes = nextNotes.map((n) => 
        n.id === id 
          ? { ...n, linkedNoteIds: n.linkedNoteIds.filter((linkId) => linkId !== note.id) }
          : n
      );
    }
  });

  // Add backlinks for new links
  currentLinks.forEach((id) => {
    if (!previousLinks.has(id)) {
      nextNotes = nextNotes.map((n) => 
        n.id === id 
          ? { ...n, linkedNoteIds: uniqueStrings([...n.linkedNoteIds, note.id]) }
          : n
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
      linkedTaskIds: sanitizedTasks.filter((task) => task.noteId === note.id).map((task) => task.id),
      linkedNoteIds: fields.linkedNoteIds.filter((id) => noteIds.has(id)),
    };
  });

  return { tasks: sanitizedTasks, notes: normalizedNotes };
}
