import { db } from '@/core/db/db';
import type { Task, Note, Embedding } from '@/core/store/types';

let worker: Worker | null = null;
const pendingPromises = new Map<
  string,
  { resolve: (vector: number[]) => void; reject: (err: Error) => void }
>();

/**
 * Initializes the background Web Worker for model inference.
 */
function getWorker(): Worker {
  if (worker) return worker;

  // Vite compiles worker dynamically using new URL constructor
  worker = new Worker(new URL('@/workers/embedding.worker.ts', import.meta.url), {
    type: 'module',
  });

  worker.onmessage = (event: MessageEvent) => {
    const data = event.data as { id: string; vector: number[]; error?: string; success: boolean };
    const { id, vector, error, success } = data;
    const promise = pendingPromises.get(id);
    if (!promise) return;

    pendingPromises.delete(id);
    if (success) {
      promise.resolve(vector);
    } else {
      promise.reject(new Error(error || 'Failed to compute embedding'));
    }
  };

  return worker;
}

/**
 * Generates semantic vector embedding for a block of text using Web Worker.
 */
export async function computeEmbedding(text: string): Promise<number[]> {
  if (!text || !text.trim()) return [];

  return new Promise((resolve, reject) => {
    try {
      const activeWorker = getWorker();
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      pendingPromises.set(id, { resolve, reject });
      activeWorker.postMessage({ text: text.trim(), id });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Calculates cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length === 0 || v2.length === 0 || v1.length !== v2.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Syncs the local IndexDB embeddings database with all active Tasks and Notes.
 * Automatically runs incremental indexing (only indexes new or modified items).
 */
export async function syncEmbeddings(tasks: Task[], notes: Note[]): Promise<void> {
  const existingEmbeds = await db.embeddings.toArray();
  const embedMap = new Map(existingEmbeds.map((e) => [e.entityId, e]));

  const toPut: Embedding[] = [];
  const validIds = new Set<string>();

  // Process Tasks
  for (const t of tasks) {
    validIds.add(t.id);
    const textToEmbed = `${t.title} ${t.priority} ${t.status} ${t.tags?.join(' ') || ''}`;
    const existing = embedMap.get(t.id);

    if (!existing || existing.text !== textToEmbed) {
      try {
        const vector = await computeEmbedding(textToEmbed);
        if (vector.length > 0) {
          toPut.push({
            id: existing?.id || `embed-${t.id}`,
            entityId: t.id,
            type: 'task',
            text: textToEmbed,
            vector,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn(`[SemanticSync] Failed to embed task ${t.id}:`, err);
      }
    }
  }

  // Process Notes
  for (const n of notes) {
    validIds.add(n.id);
    const textToEmbed = `${n.content} ${n.tags?.join(' ') || ''}`;
    const existing = embedMap.get(n.id);

    if (!existing || existing.text !== textToEmbed) {
      try {
        const vector = await computeEmbedding(textToEmbed);
        if (vector.length > 0) {
          toPut.push({
            id: existing?.id || `embed-${n.id}`,
            entityId: n.id,
            type: 'note',
            text: textToEmbed,
            vector,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn(`[SemanticSync] Failed to embed note ${n.id}:`, err);
      }
    }
  }

  // Save/Update new embeddings in database
  if (toPut.length > 0) {
    await db.embeddings.bulkPut(toPut);
  }

  // Cascading deletes: clean up orphaned embeddings of deleted entities
  const orphanedIds = existingEmbeds.filter((e) => !validIds.has(e.entityId)).map((e) => e.id);

  if (orphanedIds.length > 0) {
    await db.embeddings.bulkDelete(orphanedIds);
  }
}

export interface SemanticSearchResult {
  entityId: string;
  type: 'task' | 'note';
  score: number;
}

/**
 * Performs local similarity search across all indexed tasks and notes.
 */
export async function semanticSearch(query: string, limit = 5): Promise<SemanticSearchResult[]> {
  if (!query || !query.trim()) return [];

  try {
    const queryVector = await computeEmbedding(query);
    if (queryVector.length === 0) return [];

    const allEmbeddings = await db.embeddings.toArray();
    const results: SemanticSearchResult[] = allEmbeddings.map((emb) => ({
      entityId: emb.entityId,
      type: emb.type,
      score: cosineSimilarity(queryVector, emb.vector),
    }));

    // Sort descending by cosine similarity score
    return results
      .filter((r) => r.score > 0.15) // Keep relevant scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (err) {
    console.error('[SemanticSearch] Failed:', err);
    return [];
  }
}
