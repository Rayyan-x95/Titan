import { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { Plus } from 'lucide-react';
import { PageShell } from '@/components';
import { cn } from '@/utils/cn';
import { useStore } from '@/core/store';
import type { Note, Task } from '@/core/store/types';
import { useSeo } from '@/hooks/useSeo';
import { NoteEditor, type NoteEditorValues } from './NoteEditor';
import { NoteItem } from './NoteItem';

function normalizeTags(tags: string[]) {
  const deduped = new Set(tags.map((tag) => tag.trim()).filter(Boolean));
  return Array.from(deduped);
}

function createTaskTitleFromNote(content: string) {
  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return 'Untitled task';
  return firstLine.length > 80 ? `${firstLine.slice(0, 80)}...` : firstLine;
}

export function NotesPage() {
  useSeo({
    title: 'Thoughts',
    description:
      'Capture ideas and build your knowledge base. Link thoughts to tasks and expenses for a truly connected life operating system.',
    path: '/thoughts',
  });

  const notes = useStore((state) => state.notes);
  const tasks = useStore((state) => state.tasks);
  const hydrated = useStore((state) => state.hydrated);
  const addNote = useStore((state) => state.addNote);
  const updateNote = useStore((state) => state.updateNote);
  const deleteNote = useStore((state) => state.deleteNote);
  const addTask = useStore((state) => state.addTask);
  const updateTask = useStore((state) => state.updateTask);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tagFilter, setTagFilter] = useState('all');

  const sortedNotes = useMemo(
    () =>
      [...notes].sort((left, right) => {
        if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
        return right.createdAt.localeCompare(left.createdAt);
      }),
    [notes],
  );
  const allTags = useMemo(
    () =>
      Array.from(
        new Set(notes.flatMap((note) => note.tags.map((tag) => tag.trim()).filter(Boolean))),
      ).sort((left, right) => left.localeCompare(right)),
    [notes],
  );

  const visibleNotes = useMemo(
    () =>
      tagFilter === 'all'
        ? sortedNotes
        : sortedNotes.filter((note) => note.tags.includes(tagFilter)),
    [sortedNotes, tagFilter],
  );

  const linkedTasksByNoteId = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.noteId) continue;
      const current = map.get(task.noteId) ?? [];
      current.push(task);
      map.set(task.noteId, current);
    }
    return map;
  }, [tasks]);

  const openCreateEditor = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };
  const openEditEditor = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };
  const closeEditor = () => {
    if (isSaving) return;
    setIsEditorOpen(false);
    setEditingNote(null);
  };

  const syncTaskLinks = async (noteId: string, selectedTaskIds: string[]) => {
    const selectedSet = new Set(selectedTaskIds);
    const linkedTaskIds = tasks.filter((task) => task.noteId === noteId).map((task) => task.id);
    const linkUpdates = tasks
      .filter((task) => selectedSet.has(task.id) && task.noteId !== noteId)
      .map((task) => updateTask(task.id, { noteId }));
    const unlinkUpdates = linkedTaskIds
      .filter((taskId) => !selectedSet.has(taskId))
      .map((taskId) => updateTask(taskId, { noteId: undefined }));
    await Promise.all([...linkUpdates, ...unlinkUpdates]);
  };

  const handleSaveNote = async (values: NoteEditorValues) => {
    const cleanedTags = normalizeTags(values.tags);
    const cleanedContent = values.content.trim();
    setIsSaving(true);
    try {
      if (editingNote) {
        await updateNote(editingNote.id, {
          content: cleanedContent,
          tags: cleanedTags,
          pinned: values.pinned,
          linkedNoteIds: values.linkedNoteIds,
        });
        await syncTaskLinks(editingNote.id, values.linkedTaskIds);
      } else {
        const created = await addNote({
          content: cleanedContent,
          tags: cleanedTags,
          linkedTaskIds: [],
          linkedNoteIds: values.linkedNoteIds,
          pinned: values.pinned,
          area: values.area,
        });
        await syncTaskLinks(created.id, values.linkedTaskIds);
      }
      setIsEditorOpen(false);
      setEditingNote(null);
    } catch (err) {
      // Error handled by UI feedback
      alert(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (note: Note) => {
    if (!window.confirm('Delete this note? Linked task references will be removed.')) return;
    try {
      await deleteNote(note.id);
      if (editingNote?.id === note.id) {
        setIsEditorOpen(false);
        setEditingNote(null);
      }
    } catch (err) {
      // Error handled by UI feedback
      alert(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };
  const handleConvertToTask = async (note: Note) => {
    try {
      await addTask({
        title: createTaskTitleFromNote(note.content),
        status: 'todo',
        noteId: note.id,
      });
    } catch (err) {
      // Error handled by UI feedback
      alert(err instanceof Error ? err.message : 'Failed to convert to task');
    }
  };

  return (
    <PageShell
      eyebrow="Knowledge"
      title="Notes"
      description="Capture quickly, connect with backlinks, and keep ideas structured and retrievable."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setTagFilter('all')}
            className={cn(
              'rounded-2xl px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300',
              tagFilter === 'all'
                ? 'bg-blue-600 text-white shadow-glow-blue border border-blue-500/50 scale-105'
                : 'glass-panel text-slate-500 hover:text-slate-300 hover:border-white/20 hover:bg-white/5',
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tag)}
              className={cn(
                'rounded-2xl px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300',
                tagFilter === tag
                  ? 'bg-blue-600 text-white shadow-glow-blue border border-blue-500/50 scale-105'
                  : 'glass-panel text-slate-500 hover:text-slate-300 hover:border-white/20 hover:bg-white/5',
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
        <button
          onClick={openCreateEditor}
          className="hidden sm:flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-glow-blue active:scale-95 transition-all"
          aria-label="Create note"
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
          <span>New</span>
        </button>
      </div>

      {!hydrated ? (
        <div className="glass-panel p-20 text-center animate-pulse rounded-[2.5rem]">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">
            Retrieving Wisdom...
          </p>
        </div>
      ) : visibleNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-8 py-24 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
            <img
              src="/icons/falcon.png"
              alt="Falcon"
              className="relative h-32 w-32 opacity-20 grayscale hover:opacity-40 transition-opacity duration-700"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-black text-white tracking-tighter">A Clean Mind</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              Capture your first thought or adjust filters.
            </p>
          </div>
        </div>
      ) : (
        <LayoutGroup>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {visibleNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  linkedTasks={linkedTasksByNoteId.get(note.id) ?? []}
                  onOpen={() => openEditEditor(note)}
                  onDelete={() => handleDeleteNote(note)}
                />
              ))}
            </AnimatePresence>
          </section>
        </LayoutGroup>
      )}

      <button
        onClick={openCreateEditor}
        className="fixed bottom-24 right-6 h-16 w-16 flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-glow-blue active:scale-90 transition-all sm:hidden"
        aria-label="Create note"
      >
        <Plus className="h-7 w-7" strokeWidth={3} />
      </button>

      <NoteEditor
        open={isEditorOpen}
        title={editingNote ? 'Edit note' : 'New note'}
        saveLabel={editingNote ? 'Save changes' : 'Save note'}
        tasks={tasks}
        isSaving={isSaving}
        initialValues={
          editingNote
            ? {
                content: editingNote.content,
                tags: editingNote.tags,
                linkedTaskIds: tasks
                  .filter((task) => task.noteId === editingNote.id)
                  .map((task) => task.id),
                linkedNoteIds: editingNote.linkedNoteIds ?? [],
                pinned: editingNote.pinned ?? false,
                area: editingNote.area || 'personal',
              }
            : undefined
        }
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeEditor();
            return;
          }
          setIsEditorOpen(true);
        }}
        onSave={handleSaveNote}
        onConvertToTask={
          editingNote
            ? async () => {
                await handleConvertToTask(editingNote);
              }
            : undefined
        }
      />
    </PageShell>
  );
}
