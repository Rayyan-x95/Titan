import { StateCreator } from 'zustand';
import { db } from '@/core/db/db';
import type {
  Friend,
  FriendInput,
  FriendUpdate,
  Group,
  GroupInput,
  GroupUpdate,
  SharedExpense,
  SharedExpenseInput,
} from '../types';
import type { CoreStoreState } from '../useStore';
import { sanitizeString } from '@/utils/sanitizer';
import { upsertItem, createId, createTimestamp } from '../utils';
import { toLocalDateString } from '@/utils/date';

export interface SplitSlice {
  friends: Friend[];
  groups: Group[];
  sharedExpenses: SharedExpense[];
  addFriend: (input: FriendInput) => Promise<Friend>;
  updateFriend: (id: string, updates: FriendUpdate) => Promise<Friend | undefined>;
  deleteFriend: (id: string) => Promise<void>;
  addGroup: (input: GroupInput) => Promise<Group>;
  updateGroup: (id: string, updates: GroupUpdate) => Promise<Group | undefined>;
  deleteGroup: (id: string) => Promise<void>;
  addSharedExpense: (input: SharedExpenseInput) => Promise<SharedExpense>;
  deleteSharedExpense: (id: string) => Promise<void>;
}

export const createSplitSlice: StateCreator<CoreStoreState, [], [], SplitSlice> = (set, get) => ({
  friends: [],
  groups: [],
  sharedExpenses: [],

  addFriend: async (input) => {
    const friend: Friend = {
      id: input.id || createId(),
      name: sanitizeString(input.name, 100),
      phoneNumber: sanitizeString(input.phoneNumber, 20),
      avatar: input.avatar,
      createdAt: createTimestamp(input.createdAt),
    };
    await db.friends.put(friend);
    set((state) => ({ friends: upsertItem(state.friends, friend) }));
    return friend;
  },

  updateFriend: async (id, updates) => {
    const current = get().friends.find((f) => f.id === id);
    if (!current) return undefined;
    const sanitizedUpdates = { ...updates };
    if ('name' in sanitizedUpdates && typeof sanitizedUpdates.name === 'string') {
      sanitizedUpdates.name = sanitizeString(sanitizedUpdates.name, 100) || current.name;
    }
    if ('phoneNumber' in sanitizedUpdates && sanitizedUpdates.phoneNumber !== undefined) {
      sanitizedUpdates.phoneNumber = sanitizeString(sanitizedUpdates.phoneNumber, 20);
    }
    const next: Friend = { ...current, ...sanitizedUpdates };
    await db.friends.put(next);
    set((state) => ({ friends: upsertItem(state.friends, next) }));
    return next;
  },

  deleteFriend: async (id) => {
    const currentState = get();
    const groups = currentState.groups.map((g) => ({
      ...g,
      memberIds: g.memberIds.filter((mid) => mid !== id),
    }));

    const nextSharedExpenses = currentState.sharedExpenses.map((se) => {
      let modified = false;
      let nextPaidBy = se.paidBy;
      if (se.paidBy === id) {
        nextPaidBy = 'user';
        modified = true;
      }
      const nextParticipants = se.participants.filter((p) => p.id !== id);
      if (nextParticipants.length !== se.participants.length) {
        modified = true;
      }

      // Validate that shared expense still has participants
      if (nextParticipants.length === 0 && nextPaidBy !== 'user') {
        console.warn(
          `[Titan] Shared expense ${se.id} would have no participants; setting paidBy to 'user'`,
        );
        nextPaidBy = 'user';
        modified = true;
      }

      return modified ? { ...se, paidBy: nextPaidBy, participants: nextParticipants } : se;
    });

    await db.transaction('rw', [db.friends, db.groups, db.sharedExpenses], async () => {
      await db.friends.delete(id);
      for (const g of groups) {
        await db.groups.put(g);
      }
      const updatedSharedExpenses = nextSharedExpenses.filter((se) => {
        const orig = currentState.sharedExpenses.find((ose) => ose.id === se.id);
        return (
          orig && (orig.paidBy !== se.paidBy || orig.participants.length !== se.participants.length)
        );
      });
      if (updatedSharedExpenses.length > 0) {
        await db.sharedExpenses.bulkPut(updatedSharedExpenses);
      }
    });

    set((state) => ({
      friends: state.friends.filter((f) => f.id !== id),
      groups,
      sharedExpenses: nextSharedExpenses,
    }));
  },

  addGroup: async (input) => {
    // Validate members exist
    const friendIds = new Set(get().friends.map((f) => f.id));
    const missingFriends = (input.memberIds || []).filter((mid) => !friendIds.has(mid));
    if (missingFriends.length > 0) {
      throw new Error(
        `Cannot create group: Friends with IDs ${missingFriends.join(', ')} do not exist.`,
      );
    }

    const group: Group = {
      id: input.id || createId(),
      name: sanitizeString(input.name, 100),
      memberIds: input.memberIds || [],
      createdAt: createTimestamp(input.createdAt),
    };
    await db.groups.put(group);
    set((state) => ({ groups: upsertItem(state.groups, group) }));
    return group;
  },

  updateGroup: async (id, updates) => {
    const current = get().groups.find((g) => g.id === id);
    if (!current) return undefined;
    const sanitizedUpdates = { ...updates };
    if ('name' in sanitizedUpdates && typeof sanitizedUpdates.name === 'string') {
      sanitizedUpdates.name = sanitizeString(sanitizedUpdates.name, 100) || current.name;
    }
    const next: Group = { ...current, ...sanitizedUpdates };
    await db.groups.put(next);
    set((state) => ({ groups: upsertItem(state.groups, next) }));
    return next;
  },

  deleteGroup: async (id) => {
    const sharedExpenses = get().sharedExpenses.map((se) =>
      se.groupId === id ? { ...se, groupId: undefined } : se,
    );

    const originalSharedById = new Map(get().sharedExpenses.map((se) => [se.id, se]));

    await db.transaction('rw', [db.groups, db.sharedExpenses], async () => {
      await db.groups.delete(id);
      const affectedExpenses = sharedExpenses.filter((se) => se !== originalSharedById.get(se.id));
      if (affectedExpenses.length > 0) {
        await db.sharedExpenses.bulkPut(affectedExpenses);
      }
    });

    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      sharedExpenses,
    }));
  },

  addSharedExpense: async (input) => {
    // Validate group exists if provided
    if (input.groupId && !get().groups.some((g) => g.id === input.groupId)) {
      throw new Error(`Cannot add shared expense: Group ${input.groupId} does not exist.`);
    }

    // Validate participants exist
    const friendIds = new Set(['user', ...get().friends.map((f) => f.id)]);
    const missingParticipants = (input.participants || []).filter((p) => !friendIds.has(p.id));
    if (missingParticipants.length > 0) {
      throw new Error(
        `Cannot add shared expense: Participants ${missingParticipants.map((mp) => mp.id).join(', ')} do not exist.`,
      );
    }

    // Validate totalAmount
    if (!input.totalAmount || input.totalAmount <= 0) {
      throw new Error('Cannot add shared expense: Total amount must be greater than 0.');
    }

    const expense: SharedExpense = {
      id: input.id || createId(),
      ...input,
      totalAmount: input.totalAmount,
      description: sanitizeString(input.description, 200),
      paidBy: input.paidBy || 'user',
      createdAt: createTimestamp(input.createdAt),
    };
    await db.sharedExpenses.put(expense);
    set((state) => ({ sharedExpenses: upsertItem(state.sharedExpenses, expense) }));

    // Activity tracking
    const today = toLocalDateString(new Date());
    await get().updateSnapshot(today, 'split', 1);

    return expense;
  },

  deleteSharedExpense: async (id) => {
    await db.sharedExpenses.delete(id);
    set((state) => ({ sharedExpenses: state.sharedExpenses.filter((se) => se.id !== id) }));

    // Activity tracking
    const today = toLocalDateString(new Date());
    await get().updateSnapshot(today, 'split', -1);
  },
});
