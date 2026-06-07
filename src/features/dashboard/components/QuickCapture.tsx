import { useState, useRef, useEffect, useTransition, type FormEvent } from 'react';
import { CheckCircle2, Search, Loader2 } from 'lucide-react';
import { useStore } from '@/core/store';
import { useSettings } from '@/core/settings';
import { parseQuickCapture } from '@/lib/core/parserEngine';

type CaptureStatus = 'idle' | 'success' | 'error';

export function QuickCapture() {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { currency } = useSettings();
  const addExpense = useStore((s) => s.addExpense);
  const addTask = useStore((s) => s.addTask);
  const [isPending, startTransition] = useTransition();

  // Handle status with a simple state for the animation duration
  const [status, setStatus] = useState<CaptureStatus>('idle');

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCapture = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const text = value.trim();
    if (!text) return;

    startTransition(async () => {
      try {
        const parsed = parseQuickCapture(text);
        const hasAmount = parsed.amount !== undefined;
        const hasDueDate = !!parsed.dueDate;

        if (hasAmount && !hasDueDate) {
          await addExpense({
            amount: parsed.amount!,
            category: parsed.category,
            type: parsed.type,
            note: parsed.note,
          });
        } else if (!hasAmount) {
          await addTask({
            title: parsed.title,
            status: 'todo',
            dueDate: parsed.dueDate,
          });
        } else {
          const task = await addTask({
            title: parsed.title,
            status: 'todo',
            dueDate: parsed.dueDate,
          });

          await addExpense({
            amount: parsed.amount!,
            category: parsed.category,
            type: parsed.type,
            linkedTaskId: task.id,
            note: parsed.note,
          });
        }

        setValue('');
        setStatus('success');
        setTimeout(() => setStatus('idle'), 1800);
      } catch {
        // Error handled by UI feedback
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    });
  };

  const statusClass =
    status === 'success'
      ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
      : status === 'error'
        ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
        : 'border-white/10 focus-within:border-blue-500/50 focus-within:shadow-glow';

  return (
    <form
      onSubmit={handleCapture}
      className={`glass-panel relative flex items-center gap-4 px-6 py-4 transition-all duration-300 ${statusClass}`}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl transition-colors ${
          status === 'success'
            ? 'bg-emerald-500/20 text-emerald-400'
            : isPending
              ? 'bg-blue-500/10 text-blue-400'
              : 'bg-white/5 text-blue-400'
        }`}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Search className="h-5 w-5" />
        )}
      </div>

      <input
        ref={inputRef}
        name="capture"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isPending}
        placeholder={`Natural language capture... e.g. "Buy milk ${currency === 'INR' ? '₹' : '$'}100 tomorrow"`}
        className="flex-1 bg-transparent text-base font-medium text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
        aria-label="Quick capture"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
      />

      <div className="flex items-center gap-2">
        {isPending ? (
          <span className="text-[10px] font-black text-blue-400 animate-pulse uppercase tracking-widest">
            Processing...
          </span>
        ) : value.trim() ? (
          <kbd className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black text-blue-400 sm:block uppercase tracking-widest">
            ↵ Enter
          </kbd>
        ) : (
          <span className="hidden text-[10px] font-black text-slate-600 sm:block uppercase tracking-[0.2em]">
            Natural Language
          </span>
        )}
      </div>
    </form>
  );
}
