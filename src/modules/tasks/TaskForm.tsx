import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Dropdown } from '@/components/ui/Dropdown';
import { useStore } from '@/core/store';
import type { Task, TaskStatus, TaskPriority, TaskRecurrence } from '@/core/store/types';

interface TaskFormValues {
  title: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  energy: 'low' | 'medium' | 'high';
  area: 'work' | 'personal' | 'health' | 'finance' | 'social';
  parentTaskId?: string;
  recurrence?: TaskRecurrence;
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
  priority: 'medium',
  energy: 'medium',
  area: 'personal',
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
  
  const tasks = useStore((state) => state.tasks);
  const potentialParents = tasks.filter(t => t.id !== initialValues?.id && !t.parentTaskId);

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
      priority: initialValues?.priority ?? 'medium',
      energy: initialValues?.energy ?? 'medium',
      area: initialValues?.area ?? 'personal',
      parentTaskId: initialValues?.parentTaskId,
      recurrence: initialValues?.recurrence,
    });
  }, [initialValues, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = values.title.trim();
    if (!title) return;

    setSubmissionError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ ...values, title });
      onOpenChange(false);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-4 backdrop-blur-md sm:items-center">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            aria-label="Close task form"
            className="absolute inset-0 cursor-default"
            onClick={() => onOpenChange(false)}
          />

          <motion.form
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-lg rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/80">Task</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground">{title}</h3>
              </div>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-10 w-10 p-0 rounded-full">
                <span className="sr-only">Close</span>
                <Plus className="h-5 w-5 rotate-45" />
              </Button>
            </div>

            <div className="space-y-6">
              <label className="block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Title</span>
                <input
                  autoFocus
                  required
                  value={values.title}
                  onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                  className="h-14 w-full rounded-2xl border border-border bg-background px-5 text-base font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="What needs to be done?"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Priority</span>
                  <Dropdown
                    label="Priority"
                    value={values.priority}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, priority: value as TaskPriority }))
                    }
                    options={[
                      { label: 'Low', value: 'low' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'High', value: 'high' },
                    ]}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Status</span>
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Energy Required</span>
                  <Dropdown
                    label="Energy"
                    value={values.energy}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, energy: value as any }))
                    }
                    options={[
                      { label: 'Low', value: 'low' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'High', value: 'high' },
                    ]}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Life Area</span>
                  <Dropdown
                    label="Area"
                    value={values.area}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, area: value as any }))
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

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Due date</span>
                <DatePicker
                  ariaLabel="Due date"
                  value={values.dueDate || undefined}
                  onChange={(date) => setValues((current) => ({ ...current, dueDate: date ?? '' }))}
                  placeholder="When is it due?"
                  clearable
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Parent Task</span>
                <Dropdown
                  label="Parent Task"
                  value={values.parentTaskId || ''}
                  onChange={(value) =>
                    setValues((current) => ({ ...current, parentTaskId: value || undefined }))
                  }
                  options={[
                    { label: 'Independent Task', value: '' },
                    ...potentialParents.map(t => ({ label: t.title, value: t.id }))
                  ]}
                  className="w-full"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 group cursor-pointer">
                   <div className="relative">
                     <input 
                        type="checkbox" 
                        id="recurrence-toggle"
                        checked={!!values.recurrence}
                        onChange={(e) => setValues(curr => ({ 
                          ...curr, 
                          recurrence: e.target.checked ? { type: 'daily', interval: 1 } : undefined 
                        }))}
                        className="peer sr-only"
                     />
                     <div className="h-6 w-11 rounded-full bg-secondary transition-colors peer-checked:bg-primary" />
                     <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                   </div>
                   <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Recurring Task</span>
                </label>
                
                {values.recurrence && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 grid grid-cols-2 gap-4"
                  >
                    <Dropdown
                      label="Type"
                      value={values.recurrence.type}
                      onChange={(value) =>
                        setValues((current) => ({ 
                          ...current, 
                          recurrence: { ...current.recurrence!, type: value as TaskRecurrence['type'] } 
                        }))
                      }
                      options={[
                        { label: 'Daily', value: 'daily' },
                        { label: 'Weekly', value: 'weekly' },
                        { label: 'Monthly', value: 'monthly' },
                      ]}
                      className="w-full"
                    />
                    <input
                      type="number"
                      min="1"
                      value={values.recurrence.interval}
                      onChange={(e) => setValues(curr => ({ 
                        ...curr, 
                        recurrence: { ...curr.recurrence!, interval: parseInt(e.target.value) || 1 } 
                      }))}
                      className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Interval"
                    />
                  </motion.div>
                )}
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

            <div className="mt-10 flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="px-6 font-bold uppercase tracking-widest text-[10px]">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !values.title.trim()} className="px-8 shadow-glow font-bold uppercase tracking-widest text-[10px]">
                {submitLabel}
              </Button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
