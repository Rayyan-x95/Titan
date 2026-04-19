import { useMemo } from 'react';
import { ChevronRight, PencilLine, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task, TaskStatus } from '@/core/store/types';

interface TaskItemProps {
  task: Task;
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

export function TaskItem({ task, onEdit, onToggleStatus, onDelete }: TaskItemProps) {
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

  const nextStatusLabel =
    task.status === 'todo' ? 'Start' : task.status === 'doing' ? 'Complete' : 'Reset';

  return (
    <article className="rounded-3xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[task.status]}`}>
              {statusLabels[task.status]}
            </span>
            {formattedDueDate ? (
              <span className="text-xs text-muted-foreground">Due {formattedDueDate}</span>
            ) : null}
          </div>
          <h3 className="break-words text-base font-semibold leading-6 text-foreground">{task.title}</h3>
        </div>

        <Button variant="ghost" size="sm" onClick={() => onToggleStatus(task)} aria-label="Advance task status">
          {nextStatusLabel}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Created {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(task.createdAt))}
        </p>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(task)} aria-label="Edit task">
            <PencilLine className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task)}
            aria-label="Delete task"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}