import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CategoryCombobox } from '@/components/ui/CategoryCombobox';
import { DatePicker } from '@/components/ui/DatePicker';
import { PageShell } from '@/components/PageShell';
import { useStore } from '@/core/store';
import type { Account } from '@/core/store/types';
import { useSeo } from '@/seo';
import { cn } from '@/utils/cn';
import { parseSmsExpense, smsExpenseCategories } from '@/utils/smsParser';

interface ShareExpenseFormState {
  amount: string;
  merchant: string;
  category: string;
  accountId: string;
  date: string;
  rawText: string;
}

const fallbackCategories = [
  ...smsExpenseCategories,
  'Travel',
  'Personal',
  'Utilities',
  'Entertainment',
];

function toInputDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toExpenseTimestamp(inputDate: string) {
  const [year, month, day] = inputDate.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date().toISOString();
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
}

function buildSharedText(params: URLSearchParams) {
  const parts = [params.get('title'), params.get('text'), params.get('url')]
    .map((part) => part?.trim())
    .filter(Boolean) as string[];

  return parts.join('\n\n');
}

function getDefaultAccountId(accounts: Account[]) {
  return accounts.find((account) => account.id === 'upi')?.id ?? accounts[0]?.id ?? '';
}

function createInitialState(rawText: string, accounts: Account[]): ShareExpenseFormState {
  const parsed = parseSmsExpense(rawText);

  return {
    amount: parsed.amount ? String(parsed.amount) : '',
    merchant: parsed.merchant,
    category: parsed.category,
    accountId: getDefaultAccountId(accounts),
    date: toInputDateString(parsed.date),
    rawText,
  };
}

function buildExpenseNote(merchant: string, rawText: string) {
  const parts: string[] = [];

  if (merchant.trim()) {
    parts.push(`Merchant: ${merchant.trim()}`);
  }

  if (rawText.trim()) {
    parts.push(`SMS: ${rawText.trim()}`);
  }

  return parts.join('\n');
}

export function ShareTargetPage() {
  useSeo({
    title: 'Review shared payment',
    description: 'Parse a shared payment SMS and save it as a Titan expense.',
    path: '/share',
  });

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const search = params.toString();
  const sharedText = useMemo(() => buildSharedText(new URLSearchParams(search)), [search]);
  const shareError = params.get('share_error') === '1';
  const accounts = useStore((state) => state.accounts);
  const addExpense = useStore((state) => state.addExpense);
  const [form, setForm] = useState<ShareExpenseFormState>(() =>
    createInitialState(sharedText, accounts),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const parsed = useMemo(() => parseSmsExpense(form.rawText), [form.rawText]);
  const categories = useMemo(() => {
    const merged = new Set([...fallbackCategories, form.category].filter(Boolean));
    return Array.from(merged);
  }, [form.category]);

  useEffect(() => {
    setForm((current) => ({
      ...createInitialState(sharedText, accounts),
      accountId: current.accountId || getDefaultAccountId(accounts),
    }));
  }, [accounts, sharedText]);

  const applyParsedFields = () => {
    const reparsed = parseSmsExpense(form.rawText);
    setForm((current) => ({
      ...current,
      amount: reparsed.amount ? String(reparsed.amount) : current.amount,
      merchant: reparsed.merchant || current.merchant,
      category: reparsed.category,
      date: toInputDateString(reparsed.date),
    }));
  };

  const updateForm = (updates: Partial<ShareExpenseFormState>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number.parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSubmissionError('Enter an amount greater than 0 before saving.');
      return;
    }

    if (!form.category.trim()) {
      setSubmissionError('Choose a category before saving.');
      return;
    }

    if (!form.accountId) {
      setSubmissionError('No account is available for this expense yet.');
      return;
    }

    setIsSaving(true);
    setSubmissionError(null);

    try {
      await addExpense({
        amountDollars: amount,
        category: form.category.trim(),
        type: 'expense',
        accountId: form.accountId,
        note: buildExpenseNote(form.merchant, form.rawText),
        tags: ['sms-import'],
        createdAt: toExpenseTimestamp(form.date),
      });
      navigate('/finance', { replace: true });
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Failed to save the shared expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const confidenceLabel =
    parsed.status === 'parsed'
      ? 'Ready to save'
      : parsed.status === 'partial'
        ? 'Needs a quick check'
        : 'Manual entry';

  return (
    <PageShell
      title="Review shared payment"
      description="Titan can read shared UPI and bank SMS text locally, then turn it into a confirmed expense."
    >
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <article className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-card/50 p-6 shadow-glass backdrop-blur-xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-[80px]" />
          <div className="relative z-10 space-y-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                SMS Capture
              </div>
              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]',
                  parsed.status === 'parsed'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-amber-500/10 text-amber-400',
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {confidenceLabel}
              </div>
            </div>

            {shareError && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                Titan opened the share target, but the shared payload could not be read. You can still paste
                the SMS below and save it manually.
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Amount
                </span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => updateForm({ amount: event.target.value })}
                  className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-2xl font-black tracking-tight text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="250.00"
                />
              </label>

              <label className="block space-y-2">
                <span className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Merchant
                </span>
                <input
                  type="text"
                  value={form.merchant}
                  onChange={(event) => updateForm({ merchant: event.target.value })}
                  className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="Swiggy, Amazon, Uber..."
                />
              </label>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Category
                </label>
                <CategoryCombobox
                  value={form.category}
                  options={categories}
                  onChange={(category) => updateForm({ category })}
                  placeholder="e.g. Food"
                />
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Date
                </label>
                <DatePicker
                  value={form.date}
                  clearable={false}
                  onChange={(date) => updateForm({ date: date ?? toInputDateString(new Date()) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Account
              </label>
              {accounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  No accounts found. Create one in Settings.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-3">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => updateForm({ accountId: account.id })}
                      className={cn(
                        'h-12 rounded-xl border px-3 text-[10px] font-bold uppercase tracking-wider transition-all',
                        form.accountId === account.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background/50 text-muted-foreground hover:bg-secondary',
                      )}
                    >
                      {account.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {submissionError && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-300">
                {submissionError}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => navigate('/finance', { replace: true })}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="shadow-glow">
                {isSaving ? 'Saving...' : 'Save Expense'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </article>

        <aside className="space-y-4 rounded-[2rem] border border-border/70 bg-card/30 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/80">
              Original SMS
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              If the bank wrote something wonderfully weird, edit the text and re-parse it. The parser stays
              offline and rule-based.
            </p>
          </div>

          <textarea
            value={form.rawText}
            onChange={(event) => updateForm({ rawText: event.target.value })}
            className="min-h-56 w-full resize-none rounded-2xl border border-border bg-background/70 p-4 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-primary"
            placeholder="Paste a payment SMS here..."
          />

          <Button type="button" variant="secondary" className="w-full" onClick={applyParsedFields}>
            <RotateCcw className="h-4 w-4" />
            Re-parse SMS
          </Button>

          <div className="rounded-2xl bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-bold uppercase tracking-wider text-foreground">Detected fields</p>
            <p className="mt-2">Amount: {parsed.amount ? parsed.amount : 'Not found'}</p>
            <p>Merchant: {parsed.merchant || 'Not found'}</p>
            <p>Category: {parsed.category}</p>
          </div>
        </aside>
      </form>
    </PageShell>
  );
}
