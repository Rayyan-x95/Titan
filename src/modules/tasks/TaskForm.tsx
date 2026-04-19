import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Dropdown } from '@/components/ui/Dropdown';
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
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setValues(defaultValues);
      setIsSubmitting(false);
      setSubmissionError(null);
      return;
    }

    setSubmissionError(null);
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

    const title = values.title.trim();

    if (!title) {
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        dueDate: values.dueDate,
        status: values.status,
      });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save task. Please try again.';
      setSubmissionError(message);
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
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
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

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Due date</span>
            <DatePicker
              ariaLabel="Due date"
              value={values.dueDate || undefined}
              onChange={(date) => setValues((current) => ({ ...current, dueDate: date ?? '' }))}
              placeholder="Select due date"
              clearable
            />
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Status</span>
            <Dropdown
              label="Status"
              value={values.status}
              onChange={(value) =>
                setValues((current) => ({ ...current, status: value as TaskStatus }))
              }
              options={[
                { label: 'Todo', value: 'todo' },
                { label: 'Doing', value: 'doing' },
                { label: 'Done', value: 'done' },
              ]}
              className="w-full"
            />
          </label>
        </div>

        {submissionError ? (
          <p role="alert" className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submissionError}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
