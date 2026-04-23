import { motion } from 'framer-motion';
import { ChevronRight, PencilLine, Trash2, Repeat, ChevronDown, Calendar, Flag } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { Task, TaskStatus, TaskPriority } from '@/core/store/types';

interface TaskItemProps {
  task: Task;
  subtasks?: Task[];
  onEdit: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done',
};

const statusStyles: Record<TaskStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  doing: 'bg-amber-500/15 text-amber-300 dark:text-amber-200',
  done: 'bg-emerald-500/15 text-emerald-300 dark:text-emerald-200',
};

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-blue-500/10 text-blue-400',
  medium: 'bg-amber-500/10 text-amber-400',
  high: 'bg-rose-500/10 text-rose-500',
};

export function TaskItem({ task, subtasks, onEdit, onToggleStatus, onDelete }: TaskItemProps) {
  const formattedDueDate = useMemo(() => {
    if (!task.dueDate) {
      return null;
    }

    const date = new Date(task.dueDate);

    if (Number.isNaN(date.getTime())) {
      return task.dueDate;
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }, [task.dueDate]);

  const createdAtFormatted = useMemo(() => {
    if (!task.createdAt) {
      return '—';
    }

    const date = new Date(task.createdAt);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
  }, [task.createdAt]);

  const nextStatusLabel =
    task.status === 'todo' ? 'Start' : task.status === 'doing' ? 'Complete' : 'Reset';

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
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
             <span className={cn(
               "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
               statusStyles[task.status]
             )}>
               <span className="h-1.5 w-1.5 rounded-full bg-current" />
               {statusLabels[task.status]}
             </span>
             
             <span className={cn(
               "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
               priorityStyles[task.priority]
             )}>
               <Flag className="h-3 w-3" />
               {task.priority}
             </span>

             {task.recurrence && (
               <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                 <Repeat className="h-3 w-3" />
                 {task.recurrence.type}
               </span>
             )}

             {formattedDueDate && (
               <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                 <Calendar className="h-3 w-3" />
                 {formattedDueDate}
               </span>
             )}
          </div>

          <h3 className={cn(
            "text-base font-semibold leading-relaxed transition-all",
            task.status === 'done' ? "text-muted-foreground line-through opacity-60" : "text-foreground"
          )}>
            {task.title}
          </h3>
          
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Created {createdAtFormatted}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onToggleStatus(task)} 
            className={cn(
              "h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              task.status === 'done' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary shadow-glow-sm"
            )}
          >
            {nextStatusLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onEdit(task); }} 
              className="h-8 w-8 p-0 rounded-lg bg-secondary/50 hover:bg-secondary"
            >
              <PencilLine className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(task); }}
              className="h-8 w-8 p-0 rounded-lg bg-destructive/5 hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {subtasks && subtasks.length > 0 && (
        <div className="mt-6 space-y-4 pl-6 border-l border-border/50">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
            <ChevronDown className="h-3 w-3" />
            Subtasks ({subtasks.length})
          </div>
          {subtasks.map((st) => (
            <TaskItem
              key={st.id}
              task={st}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </motion.article>
  );
}
