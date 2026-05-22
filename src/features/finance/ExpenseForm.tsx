import { useEffect, useState, useRef } from 'react';
import { Scan, Loader2 } from 'lucide-react';
import { Button, CategoryCombobox, DatePicker, Dropdown, TagInput } from '@/components/ui';
import type { Expense, Task, Account, Note } from '@/core/store/types';
import { cn } from '@/utils/cn';
import { useSettings } from '@/core/settings';
import { parseFile } from '@/utils/parserEngine';

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
  expenseCategories: string[];
  incomeCategories: string[];
  accounts: Account[];
  tasks: Task[];
  notes: Note[];
  initialValues?: Expense;
  initialType?: ExpenseFormValues['type'];
  isSubmitting?: boolean;
  autoTriggerScan?: boolean;
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
  expenseCategories,
  incomeCategories,
  accounts,
  tasks,
  notes,
  initialValues,
  initialType = 'expense',
  isSubmitting = false,
  autoTriggerScan = false,
  onOpenChange,
  onSubmit,
}: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(defaultValues);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currency = useSettings((state) => state.currency);

  useEffect(() => {
    if (!open) {
      setValues(defaultValues);
      setSubmissionError(null);
      return;
    }

    if (!initialValues) {
      setValues({ ...defaultValues, type: initialType, accountId: accounts[0]?.id || 'cash' });
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
      area: initialValues.area || 'finance',
    });
    setSubmissionError(null);
  }, [initialValues, open, accounts, initialType]);

  useEffect(() => {
    if (open && autoTriggerScan && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [open, autoTriggerScan]);

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
    const finalValues = {
      ...values,
      category: values.category.trim() || (values.type === 'income' ? 'Income' : values.category),
    };

    setSubmissionError(null);
    try {
      await onSubmit(finalValues);
      onOpenChange(false);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Failed to save transaction.');
    }
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setSubmissionError(null);

    try {
      const result = await parseFile(file);

      if (result.errors.length > 0) {
        setSubmissionError(`Scan Error: ${result.errors[0]}`);
      } else if (result.transactions.length > 0) {
        const t = result.transactions[0];
        setValues((v) => ({
          ...v,
          amountDollars: t.amount,
          category: t.category === 'Other' ? expenseCategories[0] || 'Other' : t.category,
          note: t.merchant ? `Parsed from receipt: ${t.merchant}` : v.note,
          tags: [...new Set([...v.tags, 'receipt'])],
          type: t.type,
        }));
      } else {
        setSubmissionError('No transaction data found in image.');
      }
    } catch (error) {
      console.error('Scan failed', error);
      setSubmissionError('OCR Engine failed. Please try a clearer photo.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-5 py-4 sm:px-8 sm:py-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Transaction
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight">{title}</h3>
            </div>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(event) => {
                  void handleScanReceipt(event);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="rounded-full shadow-sm"
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Scan className="h-4 w-4 mr-2 text-primary" />
                )}
                {isScanning ? 'Scanning...' : 'Scan Receipt'}
              </Button>
            </div>
          </div>
          <div className="flex gap-1.5 rounded-full bg-secondary p-1">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValues((v) => ({ ...v, type: t }))}
                className={cn(
                  'px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all',
                  values.type === t
                    ? t === 'expense'
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-500 text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto px-5 py-4 sm:px-8 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Amount
                </span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                    {currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    value={values.amountDollars || ''}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, amountDollars: parseFloat(e.target.value) }))
                    }
                    className="h-14 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-xl font-bold text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </label>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Account
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setValues((v) => ({ ...v, accountId: acc.id }))}
                      className={cn(
                        'h-12 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all',
                        values.accountId === acc.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-secondary text-muted-foreground',
                      )}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Category
                </label>
                <CategoryCombobox
                  value={values.category}
                  options={values.type === 'expense' ? expenseCategories : incomeCategories}
                  onChange={(cat) => setValues((v) => ({ ...v, category: cat }))}
                  placeholder={values.type === 'expense' ? 'e.g. Food' : 'e.g. Salary'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Date
                </label>
                <DatePicker
                  value={values.date}
                  onChange={(date) =>
                    setValues((v) => ({ ...v, date: date ?? toInputDateString(new Date()) }))
                  }
                  clearable={false}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Life Area
                </label>
                <Dropdown
                  label="Area"
                  value={values.area}
                  onChange={(val) => setValues((v) => ({ ...v, area: val }))}
                  options={[
                    { label: 'Work', value: 'work' },
                    { label: 'Personal', value: 'personal' },
                    { label: 'Health', value: 'health' },
                    { label: 'Finance', value: 'finance' },
                    { label: 'Social', value: 'social' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Tags
                </label>
                <TagInput
                  tags={values.tags}
                  onChange={(tags) => setValues((v) => ({ ...v, tags }))}
                />
              </div>
            </div>

            <div className="space-y-6">
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Note (Optional)
                </span>
                <textarea
                  value={values.note || ''}
                  onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
                  className="h-32 w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="What was this for?"
                />
              </label>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Link Context
                </label>
                <div className="space-y-2">
                  <Dropdown
                    label="Linked Task"
                    value={values.linkedTaskId || ''}
                    onChange={(val) => setValues((v) => ({ ...v, linkedTaskId: val || undefined }))}
                    options={[
                      { label: 'No linked task', value: '' },
                      ...tasks.map((t) => ({ label: t.title, value: t.id })),
                    ]}
                  />
                  <Dropdown
                    label="Linked Note"
                    value={values.linkedNoteId || ''}
                    onChange={(val) => setValues((v) => ({ ...v, linkedNoteId: val || undefined }))}
                    options={[
                      { label: 'No linked note', value: '' },
                      ...notes.map((n) => ({
                        label: n.content.split('\n')[0] || 'Untitled Note',
                        value: n.id,
                      })),
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {submissionError && (
          <div
            role="alert"
            className="mx-5 sm:mx-8 mb-4 rounded-xl bg-rose-500/10 p-3 text-xs font-semibold text-rose-500"
          >
            {submissionError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-secondary/10 px-5 py-4 sm:px-8 sm:py-6">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="px-8 shadow-glow">
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
