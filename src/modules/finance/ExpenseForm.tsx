import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CategoryCombobox } from '@/components/ui/CategoryCombobox';
import { DatePicker } from '@/components/ui/DatePicker';
import { Dropdown } from '@/components/ui/Dropdown';
import type { Expense, Task, Account, Note } from '@/core/store/types';
import { cn } from '@/utils/cn';
import { useSettings } from '@/core/settings';

export interface ExpenseFormValues {
  amountDollars: number;
  category: string;
  type: 'expense' | 'income';
  accountId: string;
  date: string;
  note?: string;
  tags: string[];
  isRecurring: boolean;
  recurrenceRule?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  linkedTaskId?: string;
  linkedNoteId?: string;
  area: 'work' | 'personal' | 'health' | 'finance' | 'social';
}

interface ExpenseFormProps {
  open: boolean;
  title: string;
  submitLabel: string;
  categories: string[];
  accounts: Account[];
  tasks: Task[];
  notes: Note[];
  initialValues?: Expense;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
}

function toInputDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isoToDateInput(value?: string) {
  if (!value) return toInputDateString(new Date());
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return toInputDateString(new Date());
  return toInputDateString(date);
}

const defaultValues: ExpenseFormValues = {
  amountDollars: 0,
  category: '',
  type: 'expense',
  accountId: 'cash',
  date: toInputDateString(new Date()),
  tags: [],
  isRecurring: false,
  area: 'finance',
};

export function ExpenseForm({
  open,
  title,
  submitLabel,
  categories,
  accounts,
  tasks,
  notes,
  initialValues,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(defaultValues);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setValues(defaultValues);
      setSubmissionError(null);
      return;
    }

    if (!initialValues) {
      setValues({ ...defaultValues, accountId: accounts[0]?.id || 'cash' });
      setSubmissionError(null);
      return;
    }

    setValues({
      amountDollars: initialValues.amount / 100,
      category: initialValues.category,
      type: initialValues.type,
      accountId: initialValues.accountId,
      date: isoToDateInput(initialValues.createdAt),
      note: initialValues.note,
      tags: initialValues.tags,
      isRecurring: initialValues.isRecurring,
      recurrenceRule: initialValues.recurrenceRule,
      linkedTaskId: initialValues.linkedTaskId,
      linkedNoteId: initialValues.linkedNoteId,
      area: (initialValues as any).area || 'finance',
    });
    setSubmissionError(null);
  }, [initialValues, open, accounts]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.amountDollars || values.amountDollars <= 0) {
      setSubmissionError('Amount must be greater than 0.');
      return;
    }
    if (!values.category.trim() && values.type === 'expense') {
      setSubmissionError('Category is required for expenses.');
      return;
    }
    
    // Default category for income if left empty
    const finalValues = {
      ...values,
      category: values.category.trim() || (values.type === 'income' ? 'Income' : values.category)
    };

    setSubmissionError(null);
    try {
      await onSubmit(finalValues);
      onOpenChange(false);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Failed to save transaction.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-4 backdrop-blur-md sm:items-center">
      <button
        type="button"
        aria-label="Close expense form"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Transaction</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">{title}</h3>
          </div>
          <div className="flex gap-1.5 rounded-full bg-secondary p-1">
             {(['expense', 'income'] as const).map(t => (
               <button
                key={t}
                type="button"
                onClick={() => setValues(v => ({ ...v, type: t }))}
                className={cn(
                  "px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                  values.type === t ? (t === 'expense' ? "bg-rose-500 text-white" : "bg-emerald-500 text-white") : "text-muted-foreground hover:text-foreground"
                )}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Amount</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                    {useSettings.getState().currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    required
                    value={values.amountDollars || ''}
                    onChange={(e) => setValues(v => ({ ...v, amountDollars: parseFloat(e.target.value) }))}
                    className="h-14 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-xl font-bold text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </label>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Account</label>
                <div className="grid grid-cols-3 gap-2">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setValues(v => ({ ...v, accountId: acc.id }))}
                      className={cn(
                        "h-12 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all",
                        values.accountId === acc.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</label>
                <CategoryCombobox
                  value={values.category}
                  options={categories}
                  onChange={(cat) => setValues(v => ({ ...v, category: cat }))}
                  placeholder="e.g. Food"
                />
              </div>

               <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Date</label>
                <DatePicker
                  value={values.date}
                  onChange={(date) => setValues(v => ({ ...v, date: date ?? toInputDateString(new Date()) }))}
                  clearable={false}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Life Area</label>
                <Dropdown
                  label="Area"
                  value={values.area}
                  onChange={(val) => setValues(v => ({ ...v, area: val as any }))}
                  options={[
                    { label: 'Work', value: 'work' },
                    { label: 'Personal', value: 'personal' },
                    { label: 'Health', value: 'health' },
                    { label: 'Finance', value: 'finance' },
                    { label: 'Social', value: 'social' },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-6">
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Note (Optional)</span>
                <textarea
                  value={values.note || ''}
                  onChange={(e) => setValues(v => ({ ...v, note: e.target.value }))}
                  className="h-32 w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="What was this for?"
                />
              </label>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Link Context</label>
                <div className="space-y-2">
                   <Dropdown
                    label="Linked Task"
                    value={values.linkedTaskId || ''}
                    onChange={(val) => setValues(v => ({ ...v, linkedTaskId: val || undefined }))}
                    options={[{ label: 'No linked task', value: '' }, ...tasks.map(t => ({ label: t.title, value: t.id }))]}
                  />
                  <Dropdown
                    label="Linked Note"
                    value={values.linkedNoteId || ''}
                    onChange={(val) => setValues(v => ({ ...v, linkedNoteId: val || undefined }))}
                    options={[{ label: 'No linked note', value: '' }, ...notes.map(n => ({ label: n.content.split('\n')[0] || 'Untitled Note', value: n.id }))]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {submissionError && (
          <div className="mx-8 mb-4 rounded-xl bg-rose-500/10 p-3 text-xs font-semibold text-rose-500">
            {submissionError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-secondary/10 px-8 py-6">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="px-8 shadow-glow">
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
