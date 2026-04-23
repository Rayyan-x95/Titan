import type { Note } from '@/core/store/types';
import { sanitizeString, sanitizeTags, sanitizeDateString } from '@/utils/sanitizer';

export function normalizeNote(payload: any): Note {
  const content = sanitizeString(payload.content);
  
  return {
    id: typeof payload.id === 'string' && payload.id.length > 0 ? payload.id : crypto.randomUUID(),
    content: content || '',
    tags: sanitizeTags(payload.tags),
    area: ['work', 'personal', 'health', 'finance', 'social'].includes(payload.area) ? payload.area : 'personal',
    pinned: typeof payload.pinned === 'boolean' ? payload.pinned : false,
    linkedTaskIds: Array.isArray(payload.linkedTaskIds) 
      ? payload.linkedTaskIds.filter((id: any) => typeof id === 'string') 
      : [],
    linkedNoteIds: Array.isArray(payload.linkedNoteIds) 
      ? payload.linkedNoteIds.filter((id: any) => typeof id === 'string') 
      : [],
    createdAt: sanitizeDateString(payload.createdAt) || new Date().toISOString(),
  };
}

export function noteTitle(content: string): string {
  const firstLine = content.split('\n')[0]?.trim() ?? '';
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine || 'Untitled Note';
}

export function notePreview(content: string): string {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const snippet = lines.slice(1).join(' ').slice(0, 80);
  return snippet ? `${snippet}…` : '';
}
