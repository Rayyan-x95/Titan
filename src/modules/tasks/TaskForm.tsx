import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Task, TaskStatus } from '@/core/store/types';

interface TaskFormValues {
  title: string;
  dueDate: string;
  status: TaskStatus;
}

interface TaskFormProps {
  open: boolean;
  title: string;
  submitLabel: string;
  initialValues?: Task;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

const defaultValues: TaskFormValues = {
  title: '',
  dueDate: '',
  status: 'todo',
};

export function TaskForm({
  open,
  title,
  submitLabel,
  initialValues,
  onOpenChange,
  onSubmit,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setValues(defaultValues);
      setIsSubmitting(false);
      return;
    }

    setValues({
      title: initialValues?.title ?? '',
      dueDate: initialValues?.dueDate ?? '',
      status: initialValues?.status ?? 'todo',
    });
  }, [initialValues, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        dueDate: values.dueDate,
        status: values.status,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 py-4 backdrop-blur-sm sm:items-center">
      <button
        type="button"
        aria-label="Close task form"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg rounded-[1.5rem] border border-border bg-card p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Task</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">{title}</h3>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Title</span>
            <input
              autoFocus
              required
              value={values.title}
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              placeholder="Write a task title"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Due date</span>
            <input
              type="date"
              value={values.dueDate}
              onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Status</span>
            <select
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({ ...current, status: event.target.value as TaskStatus }))
              }
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
            >
              <option value="todo">Todo</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !values.title.trim()}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}