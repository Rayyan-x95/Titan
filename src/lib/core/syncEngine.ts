import type {
  Task,
  Note,
  Expense,
  Budget,
  Account,
  Friend,
  Group,
  SharedExpense,
  FocusSession,
  SyncTombstone,
} from '@/core/store/types';

export interface SyncPayload {
  tasks: Task[];
  notes: Note[];
  expenses: Expense[];
  budgets: Budget[];
  accounts: Account[];
  friends: Friend[];
  groups: Group[];
  sharedExpenses: SharedExpense[];
  focusSessions: FocusSession[];
  tombstones: SyncTombstone[];
}

export interface MergeResolution {
  tasks: { put: Task[]; deleteIds: string[] };
  notes: { put: Note[]; deleteIds: string[] };
  expenses: { put: Expense[]; deleteIds: string[] };
  budgets: { put: Budget[]; deleteIds: string[] };
  accounts: { put: Account[]; deleteIds: string[] };
  friends: { put: Friend[]; deleteIds: string[] };
  groups: { put: Group[]; deleteIds: string[] };
  sharedExpenses: { put: SharedExpense[]; deleteIds: string[] };
  focusSessions: { put: FocusSession[]; deleteIds: string[] };
  tombstones: { put: SyncTombstone[]; deleteIds: string[] };
}

/**
 * Derives a CryptoKey using PBKDF2 with SHA-256 from a pairing PIN and a salt.
 */
export async function deriveSyncKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const iterationsEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env
    ?.VITE_SYNC_PBKDF2_ITERATIONS as string;
  const parsedIterations = iterationsEnv ? parseInt(iterationsEnv, 10) : 100000;
  const iterations =
    Number.isInteger(parsedIterations) && parsedIterations > 0 ? parsedIterations : 100000;

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypts a payload object into a ciphertext array and an initialization vector.
 */
export async function encryptPayload(
  data: unknown,
  key: CryptoKey,
): Promise<{ cipher: number[]; iv: number[] }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return {
    cipher: Array.from(new Uint8Array(ciphertext)),
    iv: Array.from(iv),
  };
}

/**
 * Decrypts a ciphertext array and initialization vector back into an object.
 */
export async function decryptPayload(
  cipher: number[],
  key: CryptoKey,
  iv: number[],
): Promise<unknown> {
  const ciphertext = new Uint8Array(cipher);
  const ivArray = new Uint8Array(iv);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArray },
    key,
    ciphertext,
  );
  const plaintext = new TextDecoder().decode(decrypted);
  return JSON.parse(plaintext);
}

interface TimestampedItem {
  updatedAt?: string;
  createdAt?: string;
  deletedAt?: string;
}

function getTimestamp(item: TimestampedItem): string {
  return item.updatedAt || item.createdAt || item.deletedAt || new Date(0).toISOString();
}

/**
 * Standard pure merger for any LWW entity type.
 */
function mergeEntities<T extends { id: string } & TimestampedItem>(
  localItems: T[],
  remoteItems: T[],
  localTombstones: SyncTombstone[],
  remoteTombstones: SyncTombstone[],
  entityType: string,
): { put: T[]; deleteIds: string[]; deletedTombstoneIds: string[] } {
  const localMap = new Map(localItems.map((item) => [item.id, item]));
  const remoteMap = new Map(remoteItems.map((item) => [item.id, item]));

  const localTombMap = new Map(
    localTombstones.filter((t) => t.entityType === entityType).map((t) => [t.entityId, t]),
  );
  const remoteTombMap = new Map(
    remoteTombstones.filter((t) => t.entityType === entityType).map((t) => [t.entityId, t]),
  );

  const put: T[] = [];
  const deleteIds: string[] = [];
  const deletedTombstoneIds: string[] = [];

  // Process Remote Items
  for (const [id, remoteItem] of remoteMap.entries()) {
    const remoteTime = getTimestamp(remoteItem);
    const localTomb = localTombMap.get(id);

    if (localTomb) {
      const localTombTime = getTimestamp(localTomb);
      if (remoteTime > localTombTime) {
        // Remote update is newer than local delete. Re-insert remote item, remove local tombstone
        put.push(remoteItem);
        deletedTombstoneIds.push(localTomb.id);
      }
      // If remoteTime <= localTombTime, ignore (keep it deleted)
      continue;
    }

    const localItem = localMap.get(id);
    if (localItem) {
      const localTime = getTimestamp(localItem);
      if (remoteTime > localTime) {
        put.push(remoteItem);
      }
    } else {
      // Remote item is missing locally. Make sure we don't have a remote tombstone either
      const remoteTomb = remoteTombMap.get(id);
      if (remoteTomb) {
        const remoteTombTime = getTimestamp(remoteTomb);
        if (remoteTime <= remoteTombTime) {
          // It's already deleted remotely, so ignore
          continue;
        }
      }
      put.push(remoteItem);
    }
  }

  // Process Remote Tombstones (Deletes)
  for (const remoteTomb of remoteTombMap.values()) {
    const id = remoteTomb.entityId;
    const remoteTombTime = getTimestamp(remoteTomb);
    const localItem = localMap.get(id);

    if (localItem) {
      const localTime = getTimestamp(localItem);
      if (remoteTombTime >= localTime) {
        deleteIds.push(id);
      }
    }
  }

  return { put, deleteIds, deletedTombstoneIds };
}

/**
 * Resolves local and remote payload delta differences based on LWW and tombstones.
 */
export function resolveSyncMerge(local: SyncPayload, remote: SyncPayload): MergeResolution {
  const tasks = mergeEntities(
    local.tasks,
    remote.tasks,
    local.tombstones,
    remote.tombstones,
    'tasks',
  );
  const notes = mergeEntities(
    local.notes,
    remote.notes,
    local.tombstones,
    remote.tombstones,
    'notes',
  );
  const expenses = mergeEntities(
    local.expenses,
    remote.expenses,
    local.tombstones,
    remote.tombstones,
    'expenses',
  );
  const budgets = mergeEntities(
    local.budgets,
    remote.budgets,
    local.tombstones,
    remote.tombstones,
    'budgets',
  );
  const accounts = mergeEntities(
    local.accounts,
    remote.accounts,
    local.tombstones,
    remote.tombstones,
    'accounts',
  );
  const friends = mergeEntities(
    local.friends,
    remote.friends,
    local.tombstones,
    remote.tombstones,
    'friends',
  );
  const groups = mergeEntities(
    local.groups,
    remote.groups,
    local.tombstones,
    remote.tombstones,
    'groups',
  );
  const sharedExpenses = mergeEntities(
    local.sharedExpenses,
    remote.sharedExpenses,
    local.tombstones,
    remote.tombstones,
    'sharedExpenses',
  );
  const focusSessions = mergeEntities(
    local.focusSessions,
    remote.focusSessions,
    local.tombstones,
    remote.tombstones,
    'focusSessions',
  );

  // Collect tombstones to put locally
  const tombstonesPut: SyncTombstone[] = [];
  const localTombMap = new Map(local.tombstones.map((t) => [t.entityId + '-' + t.entityType, t]));

  // Reconcile tombstones themselves
  for (const remoteTomb of remote.tombstones) {
    const key = remoteTomb.entityId + '-' + remoteTomb.entityType;
    const localTomb = localTombMap.get(key);
    if (!localTomb) {
      tombstonesPut.push(remoteTomb);
    } else if (getTimestamp(remoteTomb) > getTimestamp(localTomb)) {
      tombstonesPut.push(remoteTomb);
    }
  }

  // Combine deleted local tombstones that got revoked by newer updates
  const deletedTombstoneIds = [
    ...tasks.deletedTombstoneIds,
    ...notes.deletedTombstoneIds,
    ...expenses.deletedTombstoneIds,
    ...budgets.deletedTombstoneIds,
    ...accounts.deletedTombstoneIds,
    ...friends.deletedTombstoneIds,
    ...groups.deletedTombstoneIds,
    ...sharedExpenses.deletedTombstoneIds,
    ...focusSessions.deletedTombstoneIds,
  ];

  return {
    tasks: { put: tasks.put, deleteIds: tasks.deleteIds },
    notes: { put: notes.put, deleteIds: notes.deleteIds },
    expenses: { put: expenses.put, deleteIds: expenses.deleteIds },
    budgets: { put: budgets.put, deleteIds: budgets.deleteIds },
    accounts: { put: accounts.put, deleteIds: accounts.deleteIds },
    friends: { put: friends.put, deleteIds: friends.deleteIds },
    groups: { put: groups.put, deleteIds: groups.deleteIds },
    sharedExpenses: { put: sharedExpenses.put, deleteIds: sharedExpenses.deleteIds },
    focusSessions: { put: focusSessions.put, deleteIds: focusSessions.deleteIds },
    tombstones: { put: tombstonesPut, deleteIds: deletedTombstoneIds },
  };
}
