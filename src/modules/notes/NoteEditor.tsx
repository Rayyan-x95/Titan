import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, X, Pin, PinOff, ListTodo, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import type { Task, Note } from '@/core/store/types';
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

function normalizeTag(rawTag: string) {
  return rawTag.trim().replace(/\s+/g, '-').toLowerCase();
}

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
  const [pendingTag, setPendingTag] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const allNotes = useStore((s) => s.notes);

  useEffect(() => {
    if (!open) {
      setValues(defaultValues);
      setPendingTag('');
      setSubmissionError(null);
      return;
    }

    setValues(initialValues ? { ...initialValues, area: (initialValues as any).area || 'personal' } : defaultValues);
    setPendingTag('');
    setSubmissionError(null);
  }, [initialValues, open]);

  const sortedTasks = useMemo(
    () => [...tasks].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [tasks],
  );

  const otherNotes = useMemo(
    () => allNotes.filter(n => initialValues ? n.id !== (initialValues as any).id : true),
    [allNotes, initialValues]
  );

  const toggleTaskLink = (taskId: string) => {
    setValues((current) => {
      const selected = new Set(current.linkedTaskIds);
      if (selected.has(taskId)) selected.delete(taskId);
      else selected.add(taskId);
      return { ...current, linkedTaskIds: Array.from(selected) };
    });
  };

  const toggleNoteLink = (noteId: string) => {
    setValues((current) => {
      const selected = new Set(current.linkedNoteIds);
      if (selected.has(noteId)) selected.delete(noteId);
      else selected.add(noteId);
      return { ...current, linkedNoteIds: Array.from(selected) };
    });
  };

  const insertText = (prefix: string) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = values.content;
    const nextText = currentText.substring(0, start) + prefix + currentText.substring(end);
    
    setValues(curr => ({ ...curr, content: nextText }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const addTag = () => {
    const nextTag = normalizeTag(pendingTag);
    if (!nextTag || values.tags.includes(nextTag)) {
      setPendingTag('');
      return;
    }
    setValues((current) => ({ ...current, tags: [...current.tags, nextTag] }));
    setPendingTag('');
  };

  const removeTag = (tag: string) => {
    setValues((current) => ({
      ...current,
      tags: current.tags.filter((item) => item !== tag),
    }));
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
      const message = error instanceof Error ? error.message : 'Failed to save note. Please try again.';
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
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-2xl rounded-t-[2.5rem] border border-border bg-card p-8 shadow-2xl sm:rounded-[2.5rem] overflow-y-auto max-h-[95vh]"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setValues(curr => ({ ...curr, pinned: !curr.pinned }))}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    values.pinned ? "bg-primary/20 text-primary shadow-glow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {values.pinned ? <Pin className="h-5 w-5" /> : <PinOff className="h-5 w-5" />}
                </button>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/80">Note</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-foreground">{title}</h3>
                </div>
              </div>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-10 w-10 p-0 rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Content</span>
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
              </div>
              <textarea
                autoFocus
                value={values.content}
                onChange={(event) => setValues((current) => ({ ...current, content: event.target.value }))}
                placeholder="Capture your brilliance..."
                className="min-h-60 w-full resize-none rounded-3xl border border-border/70 bg-background/50 px-6 py-6 text-base leading-relaxed text-foreground outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Tags</p>
                  <div className="flex gap-2">
                    <input
                      value={pendingTag}
                      onChange={(event) => setPendingTag(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add tag..."
                      className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addTag} className="rounded-xl px-4">
                      Add
                    </Button>
                  </div>

                  {values.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {values.tags.map((tag) => (
                          <motion.button
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
                          >
                            #{tag}
                            <X className="h-3 w-3" />
                          </motion.button>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                    <Link2 className="h-4 w-4" />
                    Connect Tasks
                  </p>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border border-border/50 bg-background/50 p-3 custom-scrollbar">
                    {sortedTasks.map((task) => (
                      <label key={task.id} className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 transition-all hover:bg-secondary/50">
                        <span className="min-w-0 truncate text-xs font-medium text-foreground/80 group-hover:text-foreground">{task.title}</span>
                        <input
                          type="checkbox"
                          checked={values.linkedTaskIds.includes(task.id)}
                          onChange={() => toggleTaskLink(task.id)}
                          className="h-4 w-4 rounded border-border text-primary transition-all focus:ring-primary/20"
                        />
                      </label>
                    ))}
                    {sortedTasks.length === 0 && <p className="text-[10px] text-center py-4 text-muted-foreground uppercase font-bold tracking-widest">No tasks available</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Life Area</p>
                  <Dropdown
                    label="Area"
                    value={values.area}
                    onChange={(val: string) => setValues(v => ({ ...v, area: val as any }))}
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
                  <Link2 className="h-4 w-4" />
                  Link Notes
                </p>
                <div className="max-h-[14rem] space-y-1 overflow-y-auto rounded-2xl border border-border/50 bg-background/50 p-3 custom-scrollbar">
                  {otherNotes.map((note) => {
                    const title = note.content.split('\n')[0] || 'Untitled Note';
                    return (
                      <label key={note.id} className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 transition-all hover:bg-secondary/50">
                        <span className="min-w-0 truncate text-xs font-medium text-foreground/80 group-hover:text-foreground">{title}</span>
                        <input
                          type="checkbox"
                          checked={values.linkedNoteIds.includes(note.id)}
                          onChange={() => toggleNoteLink(note.id)}
                          className="h-4 w-4 rounded border-border text-primary transition-all focus:ring-primary/20"
                        />
                      </label>
                    );
                  })}
                  {otherNotes.length === 0 && <p className="text-[10px] text-center py-4 text-muted-foreground uppercase font-bold tracking-widest">No other notes</p>}
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
                  onClick={async () => {
                    setSubmissionError(null);
                    try {
                      await onConvertToTask();
                    } catch (error) {
                      setSubmissionError(error instanceof Error ? error.message : 'Failed to convert.');
                    }
                  }}
                  disabled={isSaving || !values.content.trim()}
                  className="mr-auto text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
                >
                  <ListTodo className="mr-2 h-4 w-4" />
                  Convert to task
                </Button>
              )}

              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving} className="px-6 text-[10px] font-bold uppercase tracking-widest">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !values.content.trim()} className="px-8 shadow-glow text-[10px] font-bold uppercase tracking-widest">
                {isSaving ? 'Saving…' : saveLabel}
              </Button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
