import type { Note } from '@/core/store/types';
import { sanitizeString, sanitizeTags, sanitizeDateString, stripHtml } from '@/utils/sanitizer';

export function normalizeNote(payload: unknown): Note {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    const time = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      content: '',
      tags: [],
      area: 'personal',
      pinned: false,
      linkedTaskIds: [],
      linkedNoteIds: [],
      createdAt: time,
      updatedAt: time,
    };
  }
  const p = payload as Record<string, unknown>;
  // Strip HTML and then sanitize to prevent XSS
  const content = sanitizeString(stripHtml(typeof p.content === 'string' ? p.content : ''));

  const noteId = typeof p.id === 'string' && p.id.length > 0 ? p.id : crypto.randomUUID();

  const validAreas = ['work', 'personal', 'health', 'finance', 'social'] as const;
  const area =
    typeof p.area === 'string' && (validAreas as readonly string[]).includes(p.area)
      ? (p.area as (typeof validAreas)[number])
      : 'personal';

  const fallbackTime = new Date().toISOString();
  const createdAt = sanitizeDateString(p.createdAt) || fallbackTime;
  const updatedAt = sanitizeDateString(p.updatedAt) || createdAt;

  return {
    id: noteId,
    content: content || '',
    tags: sanitizeTags(p.tags),
    area,
    pinned: typeof p.pinned === 'boolean' ? p.pinned : false,
    linkedTaskIds: Array.isArray(p.linkedTaskIds)
      ? p.linkedTaskIds.filter((id): id is string => typeof id === 'string')
      : [],
    // Filter out self-references in note links
    linkedNoteIds: Array.isArray(p.linkedNoteIds)
      ? p.linkedNoteIds.filter((id): id is string => typeof id === 'string' && id !== noteId)
      : [],
    createdAt,
    updatedAt,
  };
}

export function noteTitle(content: string): string {
  const firstLine = content.split('\n')[0]?.trim() ?? '';
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine || 'Untitled Note';
}

export function notePreview(content: string): string {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const snippet = lines.slice(1).join(' ').slice(0, 80);
  return snippet ? `${snippet}…` : '';
}
