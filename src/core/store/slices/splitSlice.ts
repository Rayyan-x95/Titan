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
import { validateSplitShares } from '@/lib/core/splitEngine';

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
  updateSharedExpense: (
    id: string,
    updates: Partial<SharedExpenseInput>,
  ) => Promise<SharedExpense | undefined>;
  deleteSharedExpense: (id: string) => Promise<void>;
}

export const createSplitSlice: StateCreator<CoreStoreState, [], [], SplitSlice> = (set, get) => ({
  friends: [],
  groups: [],
  sharedExpenses: [],

  addFriend: async (input) => {
    const time = new Date().toISOString();
    const friend: Friend = {
      id: input.id || createId(),
      name: sanitizeString(input.name, 100),
      phoneNumber: sanitizeString(input.phoneNumber, 20),
      avatar: input.avatar,
      createdAt: createTimestamp(input.createdAt),
      updatedAt: time,
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
    const next: Friend = { ...current, ...sanitizedUpdates, updatedAt: new Date().toISOString() };
    await db.friends.put(next);
    set((state) => ({ friends: upsertItem(state.friends, next) }));
    return next;
  },

  deleteFriend: async (id) => {
    const time = new Date().toISOString();
    const currentState = get();
    const groups = currentState.groups.map((g) => {
      const hasMember = g.memberIds.includes(id);
      return hasMember
        ? { ...g, memberIds: g.memberIds.filter((mid) => mid !== id), updatedAt: time }
        : g;
    });

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
        // Silently fix invalid state
        nextPaidBy = 'user';
        modified = true;
      }

      if (modified) {
        const nextTotalAmount = nextParticipants.reduce((sum, p) => sum + p.amount, 0);
        return {
          ...se,
          paidBy: nextPaidBy,
          participants: nextParticipants,
          totalAmount: nextTotalAmount,
          updatedAt: time,
        };
      }
      return se;
    });

    await db.transaction(
      'rw',
      [db.friends, db.groups, db.sharedExpenses, db.syncTombstones],
      async () => {
        await db.friends.delete(id);
        await db.syncTombstones.put({
          id: crypto.randomUUID(),
          entityId: id,
          entityType: 'friends',
          deletedAt: time,
        });
        const updatedGroups = groups.filter((g) => g.updatedAt === time);
        if (updatedGroups.length > 0) {
          await db.groups.bulkPut(updatedGroups);
        }
        const updatedSharedExpenses = nextSharedExpenses.filter((se) => se.updatedAt === time);
        if (updatedSharedExpenses.length > 0) {
          await db.sharedExpenses.bulkPut(updatedSharedExpenses);
        }
      },
    );

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

    const time = new Date().toISOString();
    const group: Group = {
      id: input.id || createId(),
      name: sanitizeString(input.name, 100),
      memberIds: input.memberIds || [],
      createdAt: createTimestamp(input.createdAt),
      updatedAt: time,
    };
    await db.groups.put(group);
    set((state) => ({ groups: upsertItem(state.groups, group) }));
    return group;
  },

  updateGroup: async (id, updates) => {
    const current = get().groups.find((g) => g.id === id);
    if (!current) return undefined;
    const sanitizedUpdates = { ...updates };

    if ('memberIds' in sanitizedUpdates && Array.isArray(sanitizedUpdates.memberIds)) {
      const friendIds = new Set(get().friends.map((f) => f.id));
      const missingFriends = sanitizedUpdates.memberIds.filter((mid) => !friendIds.has(mid));
      if (missingFriends.length > 0) {
        throw new Error(
          `Cannot update group: Friends with IDs ${missingFriends.join(', ')} do not exist.`,
        );
      }
    }

    if ('name' in sanitizedUpdates && typeof sanitizedUpdates.name === 'string') {
      sanitizedUpdates.name = sanitizeString(sanitizedUpdates.name, 100) || current.name;
    }
    const next: Group = { ...current, ...sanitizedUpdates, updatedAt: new Date().toISOString() };
    await db.groups.put(next);
    set((state) => ({ groups: upsertItem(state.groups, next) }));
    return next;
  },

  deleteGroup: async (id) => {
    const time = new Date().toISOString();
    const sharedExpenses = get().sharedExpenses.map((se) =>
      se.groupId === id ? { ...se, groupId: undefined, updatedAt: time } : se,
    );

    await db.transaction('rw', [db.groups, db.sharedExpenses, db.syncTombstones], async () => {
      await db.groups.delete(id);
      await db.syncTombstones.put({
        id: crypto.randomUUID(),
        entityId: id,
        entityType: 'groups',
        deletedAt: time,
      });
      const affectedExpenses = sharedExpenses.filter((se) => se.updatedAt === time);
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
    if (!friendIds.has(input.paidBy || 'user')) {
      throw new Error(`Cannot add shared expense: Paid by ${input.paidBy} does not exist.`);
    }

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
    if (!validateSplitShares(input.totalAmount, input.participants || [])) {
      throw new Error('Cannot add shared expense: Participant shares must sum to total amount.');
    }

    const time = new Date().toISOString();
    const expense: SharedExpense = {
      id: input.id || createId(),
      ...input,
      totalAmount: input.totalAmount,
      description: sanitizeString(input.description, 200),
      paidBy: input.paidBy || 'user',
      createdAt: createTimestamp(input.createdAt),
      updatedAt: time,
    };
    await db.sharedExpenses.put(expense);
    set((state) => ({ sharedExpenses: upsertItem(state.sharedExpenses, expense) }));

    // Activity tracking
    const today = toLocalDateString(new Date());
    await get().updateSnapshot(today, 'split', 1);

    return expense;
  },

  updateSharedExpense: async (id, updates) => {
    const current = get().sharedExpenses.find((se) => se.id === id);
    if (!current) return undefined;

    const time = new Date().toISOString();
    const next: SharedExpense = { ...current, ...updates, updatedAt: time };

    // Validate group exists if provided
    if (next.groupId && !get().groups.some((g) => g.id === next.groupId)) {
      throw new Error(`Cannot update shared expense: Group ${next.groupId} does not exist.`);
    }

    // Validate participants exist
    const friendIds = new Set(['user', ...get().friends.map((f) => f.id)]);
    if (!friendIds.has(next.paidBy || 'user')) {
      throw new Error(`Cannot update shared expense: Paid by ${next.paidBy} does not exist.`);
    }

    const missingParticipants = (next.participants || []).filter((p) => !friendIds.has(p.id));
    if (missingParticipants.length > 0) {
      throw new Error(
        `Cannot update shared expense: Participants ${missingParticipants.map((mp) => mp.id).join(', ')} do not exist.`,
      );
    }

    // Validate totalAmount
    if (!next.totalAmount || next.totalAmount <= 0) {
      throw new Error('Cannot update shared expense: Total amount must be greater than 0.');
    }
    if (!validateSplitShares(next.totalAmount, next.participants || [])) {
      throw new Error('Cannot update shared expense: Participant shares must sum to total amount.');
    }

    if ('description' in updates && typeof updates.description === 'string') {
      next.description = sanitizeString(updates.description, 200);
    }

    await db.sharedExpenses.put(next);
    set((state) => ({ sharedExpenses: upsertItem(state.sharedExpenses, next) }));

    return next;
  },

  deleteSharedExpense: async (id) => {
    const time = new Date().toISOString();
    await db.transaction('rw', [db.sharedExpenses, db.syncTombstones], async () => {
      await db.sharedExpenses.delete(id);
      await db.syncTombstones.put({
        id: crypto.randomUUID(),
        entityId: id,
        entityType: 'sharedExpenses',
        deletedAt: time,
      });
    });
    set((state) => ({ sharedExpenses: state.sharedExpenses.filter((se) => se.id !== id) }));

    // Activity tracking
    const today = toLocalDateString(new Date());
    await get().updateSnapshot(today, 'split', -1);
  },
});
