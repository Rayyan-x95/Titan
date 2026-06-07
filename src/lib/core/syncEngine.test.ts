import { describe, expect, it, beforeAll } from 'vitest';
import {
  resolveSyncMerge,
  deriveSyncKey,
  encryptPayload,
  decryptPayload,
  type SyncPayload,
} from './syncEngine';
import type { Task, SyncTombstone } from '@/core/store/types';

// Ensure standard global crypto is mocked or populated for Node.js in the test environment if needed.
beforeAll(() => {
  if (typeof window === 'undefined') {
    // In Node.js environment, map globalThis.window to globalThis if we call window.crypto
    Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true });
  }
});

describe('syncEngine', () => {
  describe('resolveSyncMerge', () => {
    const createEmptyPayload = (): SyncPayload => ({
      tasks: [],
      notes: [],
      expenses: [],
      budgets: [],
      accounts: [],
      friends: [],
      groups: [],
      sharedExpenses: [],
      focusSessions: [],
      tombstones: [],
    });

    it('should put remote items that do not exist locally', () => {
      const local = createEmptyPayload();
      const remote = createEmptyPayload();

      const remoteTask: Task = {
        id: 'task-1',
        title: 'Remote Task',
        status: 'todo',
        priority: 'high',
        createdAt: '2026-05-30T10:00:00.000Z',
        updatedAt: '2026-05-30T10:00:00.000Z',
      };
      remote.tasks.push(remoteTask);

      const resolution = resolveSyncMerge(local, remote);
      expect(resolution.tasks.put).toEqual([remoteTask]);
      expect(resolution.tasks.deleteIds).toEqual([]);
    });

    it('should respect Last-Write-Wins (LWW) for newer remote items', () => {
      const local = createEmptyPayload();
      const remote = createEmptyPayload();

      const localTask: Task = {
        id: 'task-1',
        title: 'Local Version',
        status: 'todo',
        priority: 'low',
        createdAt: '2026-05-30T10:00:00.000Z',
        updatedAt: '2026-05-30T10:00:00.000Z',
      };
      local.tasks.push(localTask);

      const remoteTask: Task = {
        id: 'task-1',
        title: 'Remote Version (Newer)',
        status: 'doing',
        priority: 'high',
        createdAt: '2026-05-30T10:00:00.000Z',
        updatedAt: '2026-05-30T10:05:00.000Z', // 5 minutes newer
      };
      remote.tasks.push(remoteTask);

      const resolution = resolveSyncMerge(local, remote);
      expect(resolution.tasks.put).toEqual([remoteTask]);
    });

    it('should ignore remote items if local is newer', () => {
      const local = createEmptyPayload();
      const remote = createEmptyPayload();

      const localTask: Task = {
        id: 'task-1',
        title: 'Local Version (Newer)',
        status: 'doing',
        priority: 'high',
        createdAt: '2026-05-30T10:00:00.000Z',
        updatedAt: '2026-05-30T10:10:00.000Z', // 10 minutes newer
      };
      local.tasks.push(localTask);

      const remoteTask: Task = {
        id: 'task-1',
        title: 'Remote Version (Older)',
        status: 'todo',
        priority: 'low',
        createdAt: '2026-05-30T10:00:00.000Z',
        updatedAt: '2026-05-30T10:05:00.000Z',
      };
      remote.tasks.push(remoteTask);

      const resolution = resolveSyncMerge(local, remote);
      expect(resolution.tasks.put).toEqual([]);
    });

    it('should propagate deletes using remote tombstones', () => {
      const local = createEmptyPayload();
      const remote = createEmptyPayload();

      const localTask: Task = {
        id: 'task-deleted',
        title: 'To Be Deleted',
        status: 'todo',
        priority: 'low',
        createdAt: '2026-05-30T10:00:00.000Z',
        updatedAt: '2026-05-30T10:00:00.000Z',
      };
      local.tasks.push(localTask);

      const remoteTombstone: SyncTombstone = {
        id: 'tomb-1',
        entityId: 'task-deleted',
        entityType: 'tasks',
        deletedAt: '2026-05-30T10:01:00.000Z', // after local update
      };
      remote.tombstones.push(remoteTombstone);

      const resolution = resolveSyncMerge(local, remote);
      expect(resolution.tasks.deleteIds).toEqual(['task-deleted']);
      expect(resolution.tombstones.put).toContain(remoteTombstone);
    });

    it('should revoke local tombstones if remote has a newer update (re-creation scenario)', () => {
      const local = createEmptyPayload();
      const remote = createEmptyPayload();

      const localTombstone: SyncTombstone = {
        id: 'tomb-local',
        entityId: 'task-resurrected',
        entityType: 'tasks',
        deletedAt: '2026-05-30T10:00:00.000Z',
      };
      local.tombstones.push(localTombstone);

      const remoteTask: Task = {
        id: 'task-resurrected',
        title: 'Resurrected Task',
        status: 'todo',
        priority: 'medium',
        createdAt: '2026-05-30T09:00:00.000Z',
        updatedAt: '2026-05-30T10:05:00.000Z', // Updated AFTER the local tombstone delete
      };
      remote.tasks.push(remoteTask);

      const resolution = resolveSyncMerge(local, remote);
      expect(resolution.tasks.put).toEqual([remoteTask]);
      expect(resolution.tasks.deleteIds).toEqual([]);
      // Tombstone is deleted/revoked locally
      expect(resolution.tombstones.deleteIds).toEqual(['tomb-local']);
    });
  });

  describe('webCryptoHelpers', () => {
    it('should successfully perform encrypt/decrypt cycle using Web Crypto', async () => {
      const pin = '482051';
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveSyncKey(pin, salt);

      const payload = {
        tasks: [{ id: 'a', title: 'Hello WebRTC' }],
        notes: [],
      };

      const encrypted = await encryptPayload(payload, key);
      expect(encrypted.cipher).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.cipher.length).toBeGreaterThan(0);
      expect(encrypted.iv.length).toBe(12);

      const decrypted = await decryptPayload(encrypted.cipher, key, encrypted.iv);
      expect(decrypted).toEqual(payload);
    });

    it('should respect custom VITE_SYNC_PBKDF2_ITERATIONS environment variable', async () => {
      const pin = '482051';
      const salt = crypto.getRandomValues(new Uint8Array(16));

      const meta = import.meta as unknown as { env?: Record<string, unknown> };
      if (!meta.env) meta.env = {};
      const original = meta.env.VITE_SYNC_PBKDF2_ITERATIONS;

      meta.env.VITE_SYNC_PBKDF2_ITERATIONS = '500';
      const key = await deriveSyncKey(pin, salt);
      expect(key).toBeDefined();

      if (original === undefined) {
        delete meta.env.VITE_SYNC_PBKDF2_ITERATIONS;
      } else {
        meta.env.VITE_SYNC_PBKDF2_ITERATIONS = original;
      }
    });
  });
});
