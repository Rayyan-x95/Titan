import { StateCreator } from 'zustand';
import { db } from '@/core/db/db';
import type { Note, NoteInput, NoteUpdate } from '../types';
import type { CoreStoreState } from '../useStore';
import {
  clearTasksForDeletedNote,
  syncNoteNoteReferences,
  validateNoteReferences,
} from '../taskNoteSync';
import { normalizeNote } from '@/lib/core/noteEngine';
import { toLocalDateString } from '@/utils/date';

export interface NoteSlice {
  notes: Note[];
  addNote: (note: NoteInput) => Promise<Note>;
  updateNote: (id: string, updates: NoteUpdate) => Promise<Note | undefined>;
  deleteNote: (id: string) => Promise<void>;
}

export const createNoteSlice: StateCreator<CoreStoreState, [], [], NoteSlice> = (set, get) => ({
  notes: [],

  addNote: async (input) => {
    const note = normalizeNote(input);
    const updatedNotes = syncNoteNoteReferences(note, get().notes);

    await db.transaction('rw', [db.notes], async () => {
      await db.notes.put(note);
      // Persist backlink changes to other notes
      const touchedNotes = updatedNotes.filter(
        (n) =>
          n.id !== note.id &&
          n.linkedNoteIds !== get().notes.find((on) => on.id === n.id)?.linkedNoteIds,
      );
      if (touchedNotes.length > 0) {
        await db.notes.bulkPut(touchedNotes);
      }
    });

    set(() => ({
      notes: updatedNotes,
    }));

    // Activity tracking
    const today = toLocalDateString(new Date());
    await get().updateSnapshot(today, 'note', 1);

    return note;
  },

  updateNote: async (id, updates) => {
    const current = get().notes.find((n) => n.id === id);
    if (!current) return undefined;

    const note = normalizeNote({ ...current, ...updates });

    // Validate note references to prevent cycles and orphans
    const errors = validateNoteReferences(note, get().notes);
    if (errors.length > 0) throw new Error(errors.join('; '));

    const updatedNotes = syncNoteNoteReferences(note, get().notes);

    await db.transaction('rw', [db.notes], async () => {
      // Update the primary note
      await db.notes.put(note);
      // Update any notes that had their backlinks changed
      const touchedNotes = updatedNotes.filter(
        (n) =>
          n.id !== note.id &&
          n.linkedNoteIds !== get().notes.find((on) => on.id === n.id)?.linkedNoteIds,
      );
      if (touchedNotes.length > 0) {
        await db.notes.bulkPut(touchedNotes);
      }
    });

    set(() => ({
      notes: updatedNotes,
    }));

    return note;
  },

  deleteNote: async (id) => {
    const tasks = clearTasksForDeletedNote(id, get().tasks);
    const affectedTaskIds = get()
      .tasks.filter((t) => t.noteId === id)
      .map((t) => t.id);

    // Clear linkedNoteId from any expenses that reference this note
    const expenses = get().expenses.map((e) =>
      e.linkedNoteId === id ? { ...e, linkedNoteId: undefined } : e,
    );

    // Clear linkedNoteIds from other notes that reference this note
    const notes = get()
      .notes.filter((n) => n.id !== id)
      .map((n) => ({
        ...n,
        linkedNoteIds: (n.linkedNoteIds ?? []).filter((nid) => nid !== id),
      }));

    await db.transaction('rw', [db.notes, db.tasks, db.expenses], async () => {
      await db.notes.delete(id);
      if (affectedTaskIds.length > 0) {
        await db.tasks.bulkPut(tasks.filter((t) => affectedTaskIds.includes(t.id)));
      }
      // Update expenses that referenced this note
      const affectedExpenses = expenses.filter(
        (e) =>
          e.linkedNoteId === undefined &&
          get().expenses.find((oe) => oe.id === e.id)?.linkedNoteId === id,
      );
      if (affectedExpenses.length > 0) {
        await db.expenses.bulkPut(affectedExpenses);
      }
      // Update notes that linked to this note
      const linkedNotes = notes.filter((n) => {
        const originalNote = get().notes.find((on) => on.id === n.id);
        return originalNote && (originalNote.linkedNoteIds ?? []).includes(id);
      });
      if (linkedNotes.length > 0) {
        await db.notes.bulkPut(linkedNotes);
      }
    });

    set(() => ({
      notes,
      tasks,
      expenses,
    }));

    // Activity tracking
    const today = toLocalDateString(new Date());
    await get().updateSnapshot(today, 'note', -1);
  },
});
