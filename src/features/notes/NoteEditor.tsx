import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link2, X, Pin, PinOff, ListTodo, List } from 'lucide-react';
import { Button, Dropdown, TagInput } from '@/components/ui';
import type { Task } from '@/core/store/types';
import { useStore } from '@/core/store';
import { cn } from '@/utils/cn';

export interface NoteEditorValues {
  content: string;
  tags: string[];
  linkedTaskIds: string[];
  linkedNoteIds: string[];
  pinned: boolean;
  area: 'work' | 'personal' | 'health' | 'finance' | 'social';
}
interface NoteEditorProps {
  open: boolean;
  title: string;
  saveLabel: string;
  tasks: Task[];
  isSaving?: boolean;
  initialValues?: NoteEditorValues;
  onOpenChange: (open: boolean) => void;
  onSave: (values: NoteEditorValues) => Promise<void>;
  onConvertToTask?: () => Promise<void>;
}
const defaultValues: NoteEditorValues = {
  content: '',
  tags: [],
  linkedTaskIds: [],
  linkedNoteIds: [],
  pinned: false,
  area: 'personal',
};

export function NoteEditor({
  open,
  title,
  saveLabel,
  tasks,
  isSaving = false,
  initialValues,
  onOpenChange,
  onSave,
  onConvertToTask,
}: NoteEditorProps) {
  const [values, setValues] = useState<NoteEditorValues>(defaultValues);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const allNotes = useStore((s) => s.notes);

  useEffect(() => {
    if (!open) {
      setValues(defaultValues);
      setSubmissionError(null);
      setIsPreviewMode(false);
      return;
    }
    setValues(initialValues ? { ...initialValues } : defaultValues);
    setSubmissionError(null);
    setIsPreviewMode(false);
  }, [initialValues, open]);
  const sortedTasks = useMemo(
    () => [...tasks].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [tasks],
  );
  const otherNotes = useMemo(
    () =>
      allNotes.filter((n) =>
        initialValues && 'id' in initialValues
          ? n.id !== (initialValues as unknown as { id: string }).id
          : true,
      ),
    [allNotes, initialValues],
  );
  const toggleTaskLink = (taskId: string) =>
    setValues((current) => {
      const selected = new Set(current.linkedTaskIds);
      if (selected.has(taskId)) selected.delete(taskId);
      else selected.add(taskId);
      return { ...current, linkedTaskIds: Array.from(selected) };
    });
  const toggleNoteLink = (noteId: string) =>
    setValues((current) => {
      const selected = new Set(current.linkedNoteIds);
      if (selected.has(noteId)) selected.delete(noteId);
      else selected.add(noteId);
      return { ...current, linkedNoteIds: Array.from(selected) };
    });
  const insertText = (prefix: string) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = values.content;
    const nextText = currentText.substring(0, start) + prefix + currentText.substring(end);
    setValues((curr) => ({ ...curr, content: nextText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = values.content.trim();
    if (!content) {
      setSubmissionError('Write something before saving this note.');
      return;
    }
    setSubmissionError(null);
    try {
      await onSave({ ...values, content });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save note. Please try again.';
      setSubmissionError(message);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-0 py-0 backdrop-blur-md sm:items-center sm:px-4 sm:py-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            aria-label="Close note editor"
            className="absolute inset-0 cursor-default"
            onClick={() => onOpenChange(false)}
          />
          <motion.form
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="glass-panel mesh-gradient relative z-10 w-full max-w-2xl rounded-t-[2.5rem] border-white/20 bg-black/60 p-10 shadow-2xl sm:rounded-[2.5rem] overflow-y-auto max-h-[95vh] custom-scrollbar"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px] animate-pulse pointer-events-none" />
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setValues((curr) => ({ ...curr, pinned: !curr.pinned }))}
                  className={cn(
                    'p-3 rounded-2xl transition-all',
                    values.pinned
                      ? 'bg-primary/20 text-primary shadow-glow-sm'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80',
                  )}
                >
                  {values.pinned ? <Pin className="h-5 w-5" /> : <PinOff className="h-5 w-5" />}
                </button>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-400 opacity-80">
                    Deep Thought
                  </p>
                  <h3 className="mt-2 text-4xl font-black tracking-tighter text-white">{title}</h3>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-10 w-10 p-0 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(false)}
                    className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all',
                      !isPreviewMode
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(true)}
                    className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all',
                      isPreviewMode
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    Preview
                  </button>
                </div>
                {!isPreviewMode && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => insertText('\n- [ ] ')}
                      className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-all hover:text-primary"
                      title="Add checklist"
                    >
                      <ListTodo className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText('\n• ')}
                      className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-all hover:text-primary"
                      title="Add bullet list"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {isPreviewMode ? (
                <div className="min-h-60 w-full rounded-3xl border border-border/70 bg-background/50 px-6 py-6 text-base leading-relaxed text-foreground transition-all overflow-y-auto prose prose-invert prose-p:leading-relaxed prose-pre:bg-secondary/50 max-w-none">
                  {values.content.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{values.content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground/50 italic text-sm">Nothing to preview</p>
                  )}
                </div>
              ) : (
                <textarea
                  autoFocus
                  value={values.content}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, content: event.target.value }))
                  }
                  placeholder="Capture your brilliance using Markdown..."
                  className="min-h-80 w-full resize-none rounded-[1.5rem] border border-white/10 bg-white/5 px-8 py-8 text-lg leading-relaxed text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
                />
              )}
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                    Tags
                  </p>
                  <TagInput
                    tags={values.tags}
                    onChange={(tags) => setValues((curr) => ({ ...curr, tags }))}
                  />
                </div>
                <div className="space-y-3">
                  <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                    <Link2 className="h-4 w-4" /> Connect Tasks
                  </p>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border border-border/50 bg-background/50 p-3 custom-scrollbar">
                    {sortedTasks.map((task) => (
                      <label
                        key={task.id}
                        className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 transition-all hover:bg-secondary/50"
                      >
                        <span className="min-w-0 truncate text-xs font-medium text-foreground/80 group-hover:text-foreground">
                          {task.title}
                        </span>
                        <input
                          type="checkbox"
                          checked={values.linkedTaskIds.includes(task.id)}
                          onChange={() => toggleTaskLink(task.id)}
                          className="h-4 w-4 rounded border-border text-primary transition-all focus:ring-primary/20"
                        />
                      </label>
                    ))}
                    {sortedTasks.length === 0 && (
                      <p className="text-[10px] text-center py-4 text-muted-foreground uppercase font-bold tracking-widest">
                        No tasks available
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                    Life Area
                  </p>
                  <Dropdown
                    label="Area"
                    value={values.area}
                    onChange={(val: string) =>
                      setValues((v) => ({ ...v, area: val as NoteEditorValues['area'] }))
                    }
                    options={[
                      { label: 'Work', value: 'work' },
                      { label: 'Personal', value: 'personal' },
                      { label: 'Health', value: 'health' },
                      { label: 'Finance', value: 'finance' },
                      { label: 'Social', value: 'social' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                  <Link2 className="h-4 w-4" /> Link Notes
                </p>
                <div className="max-h-[14rem] space-y-1 overflow-y-auto rounded-2xl border border-border/50 bg-background/50 p-3 custom-scrollbar">
                  {otherNotes.map((note) => {
                    const title = note.content.split('\n')[0] || 'Untitled Note';
                    return (
                      <label
                        key={note.id}
                        className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 transition-all hover:bg-secondary/50"
                      >
                        <span className="min-w-0 truncate text-xs font-medium text-foreground/80 group-hover:text-foreground">
                          {title}
                        </span>
                        <input
                          type="checkbox"
                          checked={values.linkedNoteIds.includes(note.id)}
                          onChange={() => toggleNoteLink(note.id)}
                          className="h-4 w-4 rounded border-border text-primary transition-all focus:ring-primary/20"
                        />
                      </label>
                    );
                  })}
                  {otherNotes.length === 0 && (
                    <p className="text-[10px] text-center py-4 text-muted-foreground uppercase font-bold tracking-widest">
                      No other notes
                    </p>
                  )}
                </div>
              </div>
            </div>
            {submissionError && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                role="alert"
                className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive"
              >
                {submissionError}
              </motion.p>
            )}
            <div className="mt-10 flex flex-wrap items-center justify-end gap-3">
              {onConvertToTask && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSubmissionError(null);
                    void (async () => {
                      try {
                        if (onConvertToTask) await onConvertToTask();
                      } catch (error) {
                        setSubmissionError(
                          error instanceof Error ? error.message : 'Failed to convert.',
                        );
                      }
                    })();
                  }}
                  disabled={isSaving || !values.content.trim()}
                  className="mr-auto text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
                >
                  <ListTodo className="mr-2 h-4 w-4" /> Convert to task
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="px-6 text-[10px] font-bold uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !values.content.trim()}
                className="px-10 h-12 bg-blue-600 text-white shadow-glow-blue text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all"
              >
                {isSaving ? 'Syncing…' : saveLabel}
              </Button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
