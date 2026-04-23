import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Link2, PencilLine, Trash2, Pin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { Note, Task } from '@/core/store/types';

interface NoteItemProps {
  note: Note;
  linkedTasks: Task[];
  onOpen: () => void;
  onDelete: () => Promise<void>;
  onConvertToTask: () => Promise<void>;
}

function toPreview(content: string) {
  const compact = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' ')
    .trim();

  if (!compact) {
    return 'Empty note';
  }

  return compact.length > 180 ? `${compact.slice(0, 180)}…` : compact;
}

export function NoteItem({ note, linkedTasks, onOpen, onDelete, onConvertToTask }: NoteItemProps) {
  const [isConverting, setIsConverting] = useState(false);

  const createdAtFormatted = useMemo(() => {
    const date = new Date(note.createdAt);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
  }, [note.createdAt]);

  const preview = useMemo(() => toPreview(note.content), [note.content]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/40 p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-glass backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 text-left focus:outline-none"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              <Clock className="h-3 w-3" />
              <span>{createdAtFormatted}</span>
            </div>
            {note.pinned && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Pin className="h-3 w-3 fill-current" />
              </div>
            )}
          </div>

          <p className="text-base font-medium leading-relaxed text-foreground/90 selection:bg-primary/20">
            {preview}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {note.tags.map((tag) => (
              <span 
                key={tag} 
                className="rounded-lg bg-secondary/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground"
              >
                #{tag}
              </span>
            ))}
            
            {(linkedTasks.length > 0 || (note.linkedNoteIds?.length ?? 0) > 0) && (
              <div className="flex items-center gap-3 border-l border-border/50 pl-2 ml-1">
                {linkedTasks.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary/60">
                    <Link2 className="h-3 w-3" />
                    {linkedTasks.length}
                  </span>
                )}
                {(note.linkedNoteIds?.length ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent/60">
                    <Link2 className="h-3 w-3" />
                    {note.linkedNoteIds!.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </button>

        <div className="flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onOpen} 
            className="h-8 w-8 p-0 rounded-lg bg-secondary/50 hover:bg-secondary"
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async (e) => {
              e.stopPropagation();
              setIsConverting(true);
              try {
                await onConvertToTask();
              } finally {
                setIsConverting(false);
              }
            }}
            disabled={isConverting || !note.content.trim()}
            className="h-8 w-8 p-0 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary"
          >
            <ArrowUpRight className={cn("h-4 w-4", isConverting && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="h-8 w-8 p-0 rounded-lg bg-destructive/5 hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
