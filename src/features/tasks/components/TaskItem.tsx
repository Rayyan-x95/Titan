import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, PencilLine, Trash2, Repeat, Calendar, Flag, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Task, TaskStatus } from '@/core/store/types';

interface TaskItemProps {
  task: Task;
  subtasks?: Task[];
  onEdit: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask?: (parentId: string) => void;
  onFocus?: (task: Task) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done',
};

export const TaskItem = memo(function TaskItem({
  task,
  subtasks,
  onEdit,
  onToggleStatus,
  onDelete,
  onAddSubtask,
  onFocus,
}: TaskItemProps) {
  const formattedDueDate = useMemo(() => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    if (Number.isNaN(date.getTime())) return task.dueDate;
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  }, [task.dueDate]);

  const createdAtFormatted = useMemo(() => {
    if (!task.createdAt) return '-';
    const date = new Date(task.createdAt);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  }, [task.createdAt]);

  const nextStatusLabel =
    task.status === 'todo' ? 'Start' : task.status === 'doing' ? 'Complete' : 'Reset';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel group relative overflow-hidden rounded-[2rem] p-7 transition-all hover:shadow-glow-blue"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 flex-1 w-full">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border border-white/5 bg-white/5',
                task.status === 'done'
                  ? 'text-emerald-400'
                  : task.status === 'doing'
                    ? 'text-amber-400'
                    : 'text-slate-400',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
              {statusLabels[task.status]}
            </span>

            <span
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border border-white/5 bg-white/5',
                task.priority === 'high'
                  ? 'text-red-400'
                  : task.priority === 'medium'
                    ? 'text-amber-400'
                    : 'text-blue-400',
              )}
            >
              <Flag className="h-2.5 w-2.5" />
              {task.priority}
            </span>

            {task.recurrence && (
              <span className="flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border border-white/5 bg-white/5 text-slate-500">
                <Repeat className="h-2.5 w-2.5" />
                {task.recurrence.type}
              </span>
            )}

            {formattedDueDate && (
              <span className="flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border border-white/5 bg-white/5 text-slate-500">
                <Calendar className="h-2.5 w-2.5" />
                {formattedDueDate}
              </span>
            )}
          </div>

          <h3
            className={cn(
              'text-base font-bold tracking-tight leading-tight transition-all',
              task.status === 'done'
                ? 'text-muted-foreground line-through opacity-40'
                : 'text-foreground',
            )}
          >
            {task.title}
          </h3>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
              {createdAtFormatted}
            </p>
          </div>

          {subtasks && subtasks.length > 0 && (
            <div className="mt-5">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-blue-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                  style={{
                    width: `${(subtasks.filter((s) => s.status === 'done').length / subtasks.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t border-white/5 sm:border-t-0">
          <button
            onClick={() => onToggleStatus(task)}
            className={cn(
              'h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border flex-1 sm:flex-none',
              task.status === 'done'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-glow-green'
                : 'bg-blue-600 text-white border-blue-500 shadow-glow-blue active:scale-95',
            )}
          >
            {nextStatusLabel}
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="flex gap-2 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 shrink-0">
            {task.status !== 'done' && onFocus && (
              <button
                aria-label={`Start focus session for ${task.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onFocus(task);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all active:scale-90"
              >
                <Clock className="h-5 w-5" />
              </button>
            )}
            <button
              aria-label={`Edit ${task.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-90"
            >
              <PencilLine className="h-5 w-5" />
            </button>
            <button
              aria-label={`Delete ${task.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-90"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {subtasks && subtasks.length > 0 && (
        <div className="mt-6 space-y-3 pl-6 border-l border-border/50">
          {subtasks.map((st) => (
            <TaskItem
              key={st.id}
              task={st}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onFocus={onFocus}
            />
          ))}
        </div>
      )}
    </motion.article>
  );
});
