import { useMemo, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Landmark,
  TrendingDown,
  Search,
  ChevronRight,
  NotebookPen,
  SquareCheckBig,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PageShell } from '@/components/PageShell';
import { Card } from '@/components/ui/Card';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import type { Note, Task } from '@/core/store/types';
import { useSeo } from '@/seo';
import { cn } from '@/utils/cn';
import { parseQuickCapture } from '@/lib/core/parserEngine';
import { calculateTotalOwed } from '@/lib/core/splitEngine';
import { DashboardCard } from './DashboardCard';
import { QuickActions } from './QuickActions';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_TASK_ITEMS = 5;
const MAX_NOTE_ITEMS = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Date to YYYY-MM-DD string in local time */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Tasks that are due today */
function getTodayTasks(tasks: Task[]): Task[] {
  const today = toLocalDateString(new Date());
  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const d = new Date(task.dueDate);
    if (Number.isNaN(d.getTime())) return false;
    return toLocalDateString(d) === today;
  });
}

/** Active tasks: todo OR doing */
function getActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'todo' || t.status === 'doing');
}

/** Tasks completed today (done + due/created today) */
function getCompletedTodayTasks(tasks: Task[]): Task[] {
  const today = toLocalDateString(new Date());
  return tasks.filter((task) => {
    if (task.status !== 'done') return false;
    if (task.dueDate && toLocalDateString(new Date(task.dueDate)) === today) return true;
    return toLocalDateString(new Date(task.createdAt)) === today;
  });
}

/** Most recently created/updated notes */
function getRecentNotes(notes: Note[]): Note[] {
  return [...notes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_NOTE_ITEMS);
}

/** Extract a readable title from note content (first line, capped at 60 chars) */
function noteTitle(content: string): string {
  const firstLine = content.split('\n')[0]?.trim() ?? '';
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine || 'Untitled note';
}

/** Preview snippet from note (skips first line) */
function notePreview(content: string): string {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const snippet = lines.slice(1).join(' ').slice(0, 80);
  return snippet ? `${snippet}…` : '';
}

/** Sum of expenses created today, returned in cents */
function getTodayExpensesCents(expenses: { amount: number; createdAt: string }[]): number {
  const today = toLocalDateString(new Date());
  return expenses
    .filter((e) => toLocalDateString(new Date(e.createdAt)) === today)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Get top 3 urgent/important tasks */
function getPriorityTasks(tasks: Task[]): Task[] {
  return [...tasks]
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const pMap = { high: 0, medium: 1, low: 2 };
      if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 3);
}

/** Human-friendly greeting based on hour */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}


// ─── Quick Capture Component ──────────────────────────────────────────────────

function QuickCapture() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const addExpense = useStore((s) => s.addExpense);
  const addTask = useStore((s) => s.addTask);

  // Focus on mount for instant capture
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !value.trim()) return;

    try {
      const parsed = parseQuickCapture(value);

      const task = await addTask({
        title: parsed.title,
        status: 'todo',
        dueDate: parsed.dueDate,
      });

      if (parsed.amount !== undefined) {
        await addExpense({
          amount: parsed.amount,
          category: parsed.category,
          type: parsed.type,
          linkedTaskId: task.id,
          note: parsed.note,
        });
      }

      setValue('');
      setStatus('success');
      
      const today = new Date().toISOString().split('T')[0];
      await useStore.getState().updateSnapshot(today, 'task', 1);
      if (parsed.amount !== undefined) {
        await useStore.getState().updateSnapshot(today, 'expense', parsed.amount);
      }

      setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const ringClass =
    status === 'success'
      ? 'ring-2 ring-emerald-500/60 border-emerald-500/40'
      : status === 'error'
        ? 'ring-2 ring-destructive/60 border-destructive/40'
        : 'focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50';

  return (
    <div
      className={`relative flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3.5 backdrop-blur-md transition-all duration-200 ${ringClass}`}
    >
      {/* Icon */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
        {status === 'success' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Search className="h-4 w-4 text-primary" />
        )}
      </div>

      <input
        ref={inputRef}
        id="quick-capture-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Capture anything… 'Buy groceries ${useSettings.getState().currency === 'INR' ? '₹' : '$'}500 tomorrow'`}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        aria-label="Quick capture"
        autoComplete="off"
        spellCheck={false}
      />

      {/* Hint badge */}
      {value.trim() ? (
        <kbd className="hidden rounded-lg border border-border/60 bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground sm:block">
          ↵ Enter
        </kbd>
      ) : (
        <span className="hidden text-[11px] font-medium text-muted-foreground/50 sm:block">
          Press ↵
        </span>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig = {
  todo: { label: 'To Do', dot: 'bg-muted-foreground/60' },
  doing: { label: 'Doing', dot: 'bg-primary' },
  done: { label: 'Done', dot: 'bg-emerald-500' },
} as const;

function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const config = statusConfig[status];
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {config.label}
      </span>
    </span>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <button
      type="button"
      id={`dashboard-task-${task.id}`}
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <SquareCheckBig className="h-4 w-4 flex-shrink-0 text-primary/70" />
      <span className="flex-1 truncate text-sm text-foreground">{task.title}</span>
      <TaskStatusBadge status={task.status} />
      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

// ─── Note Row ─────────────────────────────────────────────────────────────────

function NoteRow({ note, onClick }: { note: Note; onClick: () => void }) {
  const title = noteTitle(note.content);
  const preview = notePreview(note.content);
  return (
    <button
      type="button"
      id={`dashboard-note-${note.id}`}
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <NotebookPen className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent/70" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {preview && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{preview}</p>
        )}
      </div>
      <ChevronRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

// ─── Continue Where You Left Off ──────────────────────────────────────────────

interface ContinueItem {
  type: 'task' | 'note';
  id: string;
  title: string;
  to: string;
}

function ContinueCard({ item }: { item: ContinueItem }) {
  const navigate = useNavigate();
  const Icon = item.type === 'task' ? SquareCheckBig : NotebookPen;
  const accentClass = item.type === 'task' ? 'text-primary' : 'text-accent';
  const bgClass = item.type === 'task' ? 'bg-primary/10' : 'bg-accent/10';

  return (
    <div
      role="button"
      tabIndex={0}
      id={`dashboard-continue-${item.id}`}
      onClick={() => navigate(item.to)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(item.to)}
      className="group cursor-pointer rounded-3xl"
    >
    <Card
      className="border-primary/20 bg-primary/5 p-4 shadow-[0_0_20px_rgba(var(--primary),0.06)] transition-colors group-hover:bg-primary/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Jump back in
          </span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-3 flex items-start gap-2.5">
        <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${bgClass}`}>
          <Icon className={`h-3.5 w-3.5 ${accentClass}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {item.type}
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">{item.title}</p>
        </div>
      </div>
    </Card>
    </div>
  );
}

// ─── Snapshot Card ────────────────────────────────────────────────────────────

function SnapshotCard() {
  const navigate = useNavigate();
  const snapshots = useStore(state => state.dailySnapshots);
  const tasks = useStore(state => state.tasks);
  const notes = useStore(state => state.notes);
  const expenses = useStore(state => state.expenses);
  const currency = useSettings(s => s.currency);

  const today = format(new Date(), 'yyyy-MM-dd');
  const snapshot = snapshots.find(s => s.date === today);

  const completedCount = tasks.filter(t => t.status === 'done' && t.createdAt.startsWith(today)).length;
  const spentToday = expenses.filter(e => e.type === 'expense' && e.createdAt.startsWith(today)).reduce((sum, e) => sum + e.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-primary/20 bg-card p-8 shadow-glass transition-all hover:shadow-glow-sm"
      onClick={() => navigate('/timeline')}
    >
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/80">Life Snapshot</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">{getGreeting()}, Rayyan</h2>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-glow-sm">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tasks</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{completedCount}</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase">Done</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Notes</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{notes.filter(n => n.createdAt.startsWith(today)).length}</span>
              <span className="text-[10px] font-bold text-blue-500 uppercase">New</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Spending</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{formatMoney(spentToday, currency)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Energy</p>
            <div className="flex items-baseline gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-black text-foreground uppercase">Stable</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-2xl bg-secondary/30 p-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-bold text-muted-foreground">Viewing your life narrative in Feed</p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mini Insight Card ────────────────────────────────────────────────────────

function InsightCard({
  label,
  value,
  icon: Icon,
  accent,
  progress,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  progress?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm">
      {/* Ambient glow */}
      <div
        className={`pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl opacity-30 ${accent}`}
      />
      <div className="relative z-10">
        <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${accent.replace('bg-', 'bg-').replace('/30', '/15')}`}>
          <Icon className={`h-4 w-4 ${accent.replace('bg-', 'text-').replace('/30', '')}`} />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        
        {progress !== undefined && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
            <div 
              className={`h-full transition-all duration-500 ${progress > 100 ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  useSeo({ title: 'Dashboard', description: 'Your personal command center for tasks, notes, and finance.' });

  const navigate = useNavigate();
  const currency = useSettings((s) => s.currency);
  const tasks = useStore((s) => s.tasks);
  const notes = useStore((s) => s.notes);
  const expenses = useStore((s) => s.expenses);
  const budgets = useStore((s) => s.budgets);
  const sharedExpenses = useStore((s) => s.sharedExpenses);

  // ── Derived data (memoized) ──────────────────────────────────────────────
  const todayTasks = useMemo(() => getTodayTasks(tasks), [tasks]);
  const activeTasks = useMemo(() => getActiveTasks(tasks), [tasks]);
  const priorityTasks = useMemo(() => getPriorityTasks(tasks), [tasks]);
  const completedToday = useMemo(() => getCompletedTodayTasks(tasks), [tasks]);
  const recentNotes = useMemo(() => getRecentNotes(notes), [notes]);
  const todaySpendCents = useMemo(() => getTodayExpensesCents(expenses), [expenses]);
  const totalOwed = useMemo(() => calculateTotalOwed(sharedExpenses), [sharedExpenses]);

  // Budget progress
  const budgetSummary = useMemo(() => {
    const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0); // Simplified for now
    return { limit: totalLimit, spent: totalSpent, percent: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0 };
  }, [budgets, expenses]);

  /** Merged today + active tasks, deduplicated, capped */
  const dashboardTasks = useMemo(() => {
    const seen = new Set<string>();
    const merged: Task[] = [];
    for (const t of [...todayTasks, ...activeTasks]) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        merged.push(t);
      }
      if (merged.length >= MAX_TASK_ITEMS) break;
    }
    return merged;
  }, [todayTasks, activeTasks]);

  /** Last updated entity for "continue" card */
  const continueItem = useMemo<ContinueItem | null>(() => {
    const lastTask = tasks.length
      ? [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : null;
    const lastNote = notes.length
      ? [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : null;

    if (!lastTask && !lastNote) return null;

    if (lastTask && lastNote) {
      const useTask = lastTask.createdAt >= lastNote.createdAt;
      return useTask
        ? { type: 'task', id: lastTask.id, title: lastTask.title, to: '/tasks' }
        : { type: 'note', id: lastNote.id, title: noteTitle(lastNote.content), to: '/notes' };
    }

    if (lastTask) return { type: 'task', id: lastTask.id, title: lastTask.title, to: '/tasks' };
    if (lastNote) return { type: 'note', id: lastNote.id, title: noteTitle(lastNote!.content), to: '/notes' };
    return null;
  }, [tasks, notes]);

  const greeting = useMemo(() => getGreeting(), []);
  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  );

  const pendingCount = activeTasks.length;
  const formattedSpend = formatMoney(todaySpendCents, currency);

  return (
    <PageShell
      title=""
      description=""
    >
      {/* ── Hero Snapshot ────────────────────────────────────────────────── */}
      <SnapshotCard />

      {/* ── Date chip ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-border/50 bg-card/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
          {today}
        </span>
        <button 
          onClick={() => navigate('/timeline')}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
        >
          View Story
        </button>
      </div>

      {/* ── Quick Capture ───────────────────────────────────────────────────── */}
      <section aria-label="Quick capture">
        <QuickCapture />
        <p className="mt-2 px-1 text-[11px] text-muted-foreground/60">
          Type a task, add an amount (e.g. {useSettings.getState().currency === 'INR' ? '₹' : '$'}500) for expenses, mention &apos;today&apos; or &apos;tomorrow&apos; for due dates
        </p>
      </section>

      {/* ── Mini Insights ───────────────────────────────────────────────────── */}
      <section aria-label="Today's insights">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Today
        </p>
        <div className="grid grid-cols-3 gap-3">
          <InsightCard
            label="Done"
            value={completedToday.length}
            icon={CheckCircle2}
            accent="bg-emerald-500/30"
          />
          <InsightCard
            label="Pending"
            value={pendingCount}
            icon={Clock}
            accent="bg-primary/30"
          />
          <InsightCard
            label="Spent"
            value={formattedSpend}
            icon={TrendingDown}
            accent="bg-accent/30"
            progress={budgetSummary.limit > 0 ? budgetSummary.percent : undefined}
          />
        </div>
      </section>

      {/* ── Shared Balances ─────────────────────────────────────────────────── */}
      {totalOwed !== 0 && (
        <section aria-label="Shared balances">
          <div 
            role="button"
            tabIndex={0}
            onClick={() => navigate('/split')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/split')}
            className="group cursor-pointer"
          >
            <Card className="relative overflow-hidden border-primary/20 bg-primary/5 p-5 transition-colors hover:bg-primary/10">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Shared Balance</p>
                    <p className={cn(
                      "mt-1 text-2xl font-black tracking-tight",
                      totalOwed > 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {totalOwed > 0 ? '+' : ''}{formatMoney(totalOwed, currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                    {totalOwed > 0 ? 'To receive' : 'To pay'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* ── Priority Focus ─────────────────────────────────────────────────── */}
      {priorityTasks.length > 0 && (
        <DashboardCard
          title="Priority Focus"
          subtitle="Top urgent tasks"
          icon={<Zap className="h-4 w-4 text-amber-500" />}
        >
          <div className="space-y-0.5">
            {priorityTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={() => navigate('/tasks')}
              />
            ))}
          </div>
        </DashboardCard>
      )}

      {/* ── Tasks + Continue grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        {/* Tasks Overview */}
        <DashboardCard
          title="Tasks"
          subtitle={`${dashboardTasks.length} active`}
          action={
            <button
              type="button"
              id="dashboard-view-all-tasks"
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary opacity-80 transition-opacity hover:opacity-100"
            >
              All <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          {dashboardTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <SquareCheckBig className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No tasks for today</p>
              <button
                type="button"
                id="dashboard-add-first-task"
                onClick={() => navigate('/tasks')}
                className="mt-1 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Add your first task
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {dashboardTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onClick={() => navigate('/tasks')}
                />
              ))}
            </div>
          )}
        </DashboardCard>

        {/* Continue Where Left Off */}
        {continueItem && (
          <div className="flex flex-col gap-4">
            <ContinueCard item={continueItem} />

            {/* Today's Spend spotlight */}
            <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-accent/10 to-primary/5 p-5">
              <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-accent/80" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Today&apos;s Spend
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {formattedSpend}
                </p>
                <button
                  type="button"
                  id="dashboard-view-finance"
                  onClick={() => navigate('/finance')}
                  className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-accent/80 transition-colors hover:text-accent"
                >
                  View Finance <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* If no continue item, show spend card full-width alternative */}
        {!continueItem && (
          <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-accent/10 to-primary/5 p-5">
            <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-accent/80" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Today&apos;s Spend
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {formattedSpend}
              </p>
              <button
                type="button"
                id="dashboard-view-finance-alt"
                onClick={() => navigate('/finance')}
                className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-accent/80 transition-colors hover:text-accent"
              >
                View Finance <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* ── Recent Notes ─────────────────────────────────────────────────────── */}
      <DashboardCard
        title="Recent Notes"
        subtitle={`${notes.length} total`}
        action={
          <button
            type="button"
            id="dashboard-view-all-notes"
            onClick={() => navigate('/notes')}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary opacity-80 transition-opacity hover:opacity-100"
          >
            All <ArrowRight className="h-3 w-3" />
          </button>
        }
      >
        {recentNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <NotebookPen className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <button
              type="button"
              id="dashboard-add-first-note"
              onClick={() => navigate('/notes')}
              className="mt-1 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {recentNotes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                onClick={() => navigate('/notes')}
              />
            ))}
          </div>
        )}
      </DashboardCard>

      {/* ── Quick Actions ─────────────────────────────────────────────────────── */}
      <section aria-label="Quick actions">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Quick Actions
          </p>
        </div>
        <QuickActions />
      </section>
    </PageShell>
  );
}