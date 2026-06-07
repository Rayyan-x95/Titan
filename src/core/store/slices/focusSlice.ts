import { StateCreator } from 'zustand';
import { db } from '@/core/db/db';
import type { FocusSession, FocusSessionInput } from '../types';
import type { CoreStoreState } from '../useStore';
import { upsertItem } from '../utils';

export interface FocusSlice {
  focusSessions: FocusSession[];
  addFocusSession: (session: FocusSessionInput) => Promise<FocusSession>;
  deleteFocusSession: (id: string) => Promise<void>;
  loadFocusSessions: () => Promise<void>;
}

export const createFocusSlice: StateCreator<CoreStoreState, [], [], FocusSlice> = (set) => ({
  focusSessions: [],

  addFocusSession: async (input) => {
    const time = new Date().toISOString();
    const session: FocusSession = {
      id: input.id || `focus-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      taskId: input.taskId,
      startTime: input.startTime || time,
      durationSeconds: input.durationSeconds,
      notes: input.notes,
      updatedAt: time,
    };

    await db.focusSessions.put(session);

    set((state) => ({
      focusSessions: upsertItem(state.focusSessions, session),
    }));

    return session;
  },

  deleteFocusSession: async (id) => {
    await db.transaction('rw', [db.focusSessions, db.syncTombstones], async () => {
      await db.focusSessions.delete(id);
      await db.syncTombstones.put({
        id: crypto.randomUUID(),
        entityId: id,
        entityType: 'focusSessions',
        deletedAt: new Date().toISOString(),
      });
    });
    set((state) => ({
      focusSessions: state.focusSessions.filter((s) => s.id !== id),
    }));
  },

  loadFocusSessions: async () => {
    const sessions = await db.focusSessions.toArray();
    set({ focusSessions: sessions });
  },
});
