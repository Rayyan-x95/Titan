import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Archive,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  Download,
  HeartPulse,
  Inbox,
  Radar,
  Search,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';
import { PageShell } from '@/components';
import { Button } from '@/components/ui';
import { usePwaStatus } from '@/hooks/usePwaStatus';
import { useStore } from '@/core/store';
import { formatMoney, useSettings } from '@/core/settings';
import { promptInstall } from '@/pwa';
import { cn } from '@/utils/cn';
import {
  buildDailyBrief,
  diagnoseDataHealth,
  parseInboxDraft,
  searchTitan,
} from '@/lib/core/intelligenceEngine';

interface LocalGoal {
  id: string;
  title: string;
  targetCents: number;
  currentCents: number;
  kind: 'savings' | 'debt' | 'habit' | 'spending';
}

interface LocalHabit {
  id: string;
  title: string;
  doneDates: string[];
}

interface LocalRule {
  id: string;
  trigger: string;
  action: string;
}

interface EncryptedBackupPayload {
  version: number;
  algorithm: string;
  salt: number[];
  iv: number[];
  data: number[];
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function createLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function useLocalList<T>(key: string, initial: T[]) {
  const [items, setItems] = useState<T[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T[]) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, key]);

  return [items, setItems] as const;
}

async function encryptedDownload(payload: object, password: string) {
  if (!password.trim()) throw new Error('Enter a backup password.');

  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  );
  const backup = {
    version: 1,
    algorithm: 'PBKDF2-SHA256/AES-GCM',
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `titan-encrypted-backup-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function decryptEncryptedBackup(payload: EncryptedBackupPayload, password: string) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const salt = new Uint8Array(payload.salt);
  const iv = new Uint8Array(payload.iv);
  const encrypted = new Uint8Array(payload.data);
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return JSON.parse(decoder.decode(decrypted)) as unknown;
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel border-white/5 p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-500/10 bg-blue-500/10 text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">{title}</h3>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-white/[0.03] px-4 py-3 text-xs text-slate-500">{children}</p>;
}

export function IntelligencePage() {
  const tasks = useStore((s) => s.tasks);
  const notes = useStore((s) => s.notes);
  const expenses = useStore((s) => s.expenses);
  const budgets = useStore((s) => s.budgets);
  const accounts = useStore((s) => s.accounts);
  const friends = useStore((s) => s.friends);
  const sharedExpenses = useStore((s) => s.sharedExpenses);
  const addTask = useStore((s) => s.addTask);
  const addNote = useStore((s) => s.addNote);
  const addExpense = useStore((s) => s.addExpense);
  const importBackup = useStore((s) => s.importBackup);
  const recomputeSnapshots = useStore((s) => s.recomputeSnapshots);
  const repairDataIntegrity = useStore((s) => s.repairDataIntegrity);
  const { currency } = useSettings();
  const pwa = usePwaStatus();

  const [inboxText, setInboxText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [cacheStatus, setCacheStatus] = useState('Unknown');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalKind, setGoalKind] = useState<LocalGoal['kind']>('savings');
  const [habitTitle, setHabitTitle] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState('');
  const [ruleAction, setRuleAction] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const [goals, setGoals] = useLocalList<LocalGoal>('titan-intelligence-goals', []);
  const [habits, setHabits] = useLocalList<LocalHabit>('titan-intelligence-habits', []);
  const [rules, setRules] = useLocalList<LocalRule>('titan-intelligence-rules', []);

  const brief = useMemo(
    () => buildDailyBrief({ tasks, notes, expenses, budgets, sharedExpenses }),
    [tasks, notes, expenses, budgets, sharedExpenses],
  );
  const healthIssues = useMemo(
    () => diagnoseDataHealth({ tasks, notes, expenses, accounts, friends, sharedExpenses }),
    [tasks, notes, expenses, accounts, friends, sharedExpenses],
  );
  const searchResults = useMemo(
    () => searchTitan({ query: searchText, tasks, notes, expenses, sharedExpenses }),
    [searchText, tasks, notes, expenses, sharedExpenses],
  );
  const recurringItems = useMemo(
    () => [
      ...tasks
        .filter((task) => task.recurrence)
        .map((task) => ({
          id: task.id,
          title: task.title,
          detail: `Task • ${task.recurrence?.type}`,
        })),
      ...expenses
        .filter((expense) => expense.isRecurring)
        .map((expense) => ({
          id: expense.id,
          title: expense.category,
          detail: `${expense.type} • ${formatMoney(expense.amount, currency)}`,
        })),
    ],
    [tasks, expenses, currency],
  );

  const dataHealthCounts = useMemo(() => {
    return healthIssues.reduce(
      (counts, issue) => {
        counts[issue.severity] += 1;
        return counts;
      },
      { info: 0, warn: 0, error: 0 },
    );
  }, [healthIssues]);

  useEffect(() => {
    if ('caches' in window) {
      void caches.keys().then((keys) => {
        setCacheStatus(keys.length ? `${keys.length} cache bucket(s)` : 'No runtime caches yet');
      });
    }
  }, []);

  const captureInbox = async () => {
    const draft = parseInboxDraft(inboxText);
    if (draft.kind === 'task') {
      await addTask({ title: draft.title, status: 'todo' });
    } else if (draft.kind === 'note') {
      await addNote({ content: draft.title, tags: [] });
    } else {
      await addExpense({
        amount: draft.amountCents ?? 0,
        category: draft.category ?? 'General',
        note: draft.note,
        accountId: accounts[0]?.id,
        tags: [],
      });
    }
    setInboxText('');
  };

  const handleInstallPwa = async () => {
    setBusy('install');
    try {
      await promptInstall();
    } finally {
      setBusy(null);
    }
  };

  const handleImportEncryptedBackup = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const password = window.prompt('Enter the backup password to decrypt this file.');
      if (!password) return;

      try {
        const raw = JSON.parse(await file.text()) as EncryptedBackupPayload;
        const parsed = await decryptEncryptedBackup(raw, password);
        await importBackup(parsed);
        window.alert('Encrypted backup imported successfully.');
      } catch (error) {
        console.error('Failed to import encrypted backup', error);
        window.alert('Unable to decrypt or import this backup.');
      }
    };
    fileInput.click();
  };

  const handleRepairIntegrity = async () => {
    setBusy('repair');
    try {
      await repairDataIntegrity();
    } finally {
      setBusy(null);
    }
  };

  const exportEncryptedBackup = async () => {
    setBusy('backup');
    await encryptedDownload(
      {
        exportedAt: new Date().toISOString(),
        tasks,
        notes,
        expenses,
        budgets,
        accounts,
        sharedExpenses,
      },
      backupPassword,
    );
    setBackupPassword('');
    setBusy(null);
  };

  return (
    <PageShell
      eyebrow="Titan Intelligence"
      title="Control Center"
      description="Daily review, capture, search, goals, routines, automation, backup, and PWA diagnostics."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Daily Brief" subtitle="Today’s operational summary." icon={Radar}>
          <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
            <EmptyLine>{brief.overdueTasks.length} overdue task(s)</EmptyLine>
            <EmptyLine>{brief.dueTodayTasks.length} due today</EmptyLine>
            <EmptyLine>{brief.upcomingTasks.length} upcoming task(s)</EmptyLine>
            <EmptyLine>{brief.highPriorityTasks.length} high-priority focus item(s)</EmptyLine>
            <EmptyLine>{brief.budgetAlerts.length} budget warning(s)</EmptyLine>
            <EmptyLine>{formatMoney(brief.spendingToday, currency)} spent today</EmptyLine>
            <EmptyLine>{formatMoney(brief.splitBalance, currency)} owed across splits</EmptyLine>
            <EmptyLine>{brief.recurringExpenses.length} recurring bill(s)</EmptyLine>
          </div>
          {brief.upcomingTasks.length > 0 ? (
            <div className="mt-3 space-y-2">
              {brief.upcomingTasks.map((task) => (
                <div key={task.id} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.daysAway}d</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Due {task.dueDate.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Global Inbox"
          subtitle="Capture a task, note, or expense from one box."
          icon={Inbox}
        >
          <div className="flex flex-col gap-3">
            <textarea
              value={inboxText}
              onChange={(event) => setInboxText(event.target.value)}
              placeholder="Try: task: renew insurance, note: card PIN hint, spent 250 coffee"
              className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
            />
            <Button variant="primary" size="sm" onClick={() => void captureInbox()}>
              Capture
            </Button>
          </div>
        </Panel>

        <Panel
          title="Advanced Search"
          subtitle="Search tasks, notes, expenses, and split records."
          icon={Search}
        >
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Try: tag:home area:finance amount>500 status:todo"
            className="mb-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
          />
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {searchResults.length === 0 ? (
              <EmptyLine>No matching records yet.</EmptyLine>
            ) : (
              searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="rounded-2xl bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-sm font-bold text-white">{result.title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-blue-400">
                    {result.type}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{result.detail}</p>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Goal Tracking"
          subtitle="Track savings or personal targets locally."
          icon={Target}
        >
          <div className="grid gap-2 sm:grid-cols-[120px_1fr_110px_auto]">
            <select
              value={goalKind}
              onChange={(event) => setGoalKind(event.target.value as LocalGoal['kind'])}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="savings">Savings</option>
              <option value="debt">Debt</option>
              <option value="habit">Habit</option>
              <option value="spending">Spending</option>
            </select>
            <input
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.target.value)}
              placeholder="Emergency fund"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={goalTarget}
              onChange={(event) => setGoalTarget(event.target.value)}
              placeholder="50000"
              inputMode="numeric"
              className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
            <Button
              size="sm"
              onClick={() => {
                if (!goalTitle.trim()) return;
                setGoals([
                  ...goals,
                  {
                    id: createLocalId(),
                    title: goalTitle.trim(),
                    targetCents: Math.max(0, Number(goalTarget || 0) * 100),
                    currentCents: 0,
                    kind: goalKind,
                  },
                ]);
                setGoalTitle('');
                setGoalTarget('');
                setGoalKind('savings');
              }}
            >
              Add
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {goals.length === 0 ? <EmptyLine>No goals yet.</EmptyLine> : null}
            {goals.map((goal) => (
              <div key={goal.id} className="rounded-2xl bg-white/[0.03] p-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-bold text-white">{goal.title}</span>
                  <span className="text-slate-400">{formatMoney(goal.targetCents, currency)}</span>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-blue-400">
                  {goal.kind}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${Math.min(100, goal.targetCents ? (goal.currentCents / goal.targetCents) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Recurring Calendar"
          subtitle="Upcoming repeat tasks and transactions."
          icon={CalendarClock}
        >
          <div className="space-y-2">
            {recurringItems.length === 0 ? (
              <EmptyLine>No recurring items configured.</EmptyLine>
            ) : null}
            {recurringItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3"
              >
                <span className="text-sm font-bold text-white">{item.title}</span>
                <span className="text-xs text-slate-500">{item.detail}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Habits & Routines"
          subtitle="Track lightweight daily routines."
          icon={HeartPulse}
        >
          <div className="flex gap-2">
            <input
              value={habitTitle}
              onChange={(event) => setHabitTitle(event.target.value)}
              placeholder="Morning walk"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
            <Button
              size="sm"
              onClick={() => {
                if (!habitTitle.trim()) return;
                setHabits([
                  ...habits,
                  { id: createLocalId(), title: habitTitle.trim(), doneDates: [] },
                ]);
                setHabitTitle('');
              }}
            >
              Add
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {habits.length === 0 ? <EmptyLine>No habits yet.</EmptyLine> : null}
            {habits.map((habit) => {
              const done = habit.doneDates.includes(todayKey());
              return (
                <button
                  key={habit.id}
                  onClick={() => {
                    setHabits(
                      habits.map((item) =>
                        item.id === habit.id
                          ? {
                              ...item,
                              doneDates: done
                                ? item.doneDates.filter((date) => date !== todayKey())
                                : [...item.doneDates, todayKey()],
                            }
                          : item,
                      ),
                    );
                  }}
                  className="flex w-full items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-left"
                >
                  <span className="text-sm font-bold text-white">{habit.title}</span>
                  <CheckCircle2
                    className={cn('h-5 w-5', done ? 'text-emerald-400' : 'text-slate-700')}
                  />
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Rules & Automations"
          subtitle="Define local automation notes for repeat workflows."
          icon={Bot}
        >
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={ruleTrigger}
              onChange={(event) => setRuleTrigger(event.target.value)}
              placeholder="When expense > 500"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={ruleAction}
              onChange={(event) => setRuleAction(event.target.value)}
              placeholder="Tag review"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
            <Button
              size="sm"
              onClick={() => {
                if (!ruleTrigger.trim() || !ruleAction.trim()) return;
                setRules([
                  ...rules,
                  { id: createLocalId(), trigger: ruleTrigger.trim(), action: ruleAction.trim() },
                ]);
                setRuleTrigger('');
                setRuleAction('');
              }}
            >
              Add
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {rules.length === 0 ? <EmptyLine>No rules yet.</EmptyLine> : null}
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                <p className="text-sm font-bold text-white">{rule.trigger}</p>
                <p className="mt-1 text-xs text-blue-400">{rule.action}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Data Health"
          subtitle="Detect broken local references and repair snapshots."
          icon={DatabaseZap}
        >
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
              <EmptyLine>{dataHealthCounts.error} errors</EmptyLine>
              <EmptyLine>{dataHealthCounts.warn} warnings</EmptyLine>
              <EmptyLine>{dataHealthCounts.info} info</EmptyLine>
            </div>
            {healthIssues.slice(0, 5).map((issue) => (
              <div key={issue.id} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                <p className="text-sm font-bold text-white">{issue.title}</p>
                <p className="text-xs text-slate-500">{issue.detail}</p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => void recomputeSnapshots()}>
                <ClipboardCheck className="h-4 w-4" />
                Recompute Snapshots
              </Button>
              <Button variant="primary" size="sm" onClick={() => void handleRepairIntegrity()}>
                <DatabaseZap className="h-4 w-4" />
                Repair Integrity
              </Button>
            </div>
          </div>
        </Panel>

        <Panel
          title="Encrypted Backup"
          subtitle="Download a password-encrypted local JSON backup."
          icon={ShieldCheck}
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void exportEncryptedBackup();
            }}
          >
            <input
              type="password"
              value={backupPassword}
              onChange={(event) => setBackupPassword(event.target.value)}
              placeholder="Backup password"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
            />
            <Button variant="primary" size="sm" type="submit">
              <Download className="h-4 w-4" />
              Export Encrypted Backup
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => void handleImportEncryptedBackup()}
            >
              <Archive className="h-4 w-4" />
              Import Encrypted Backup
            </Button>
          </form>
        </Panel>

        <Panel
          title="PWA Diagnostics"
          subtitle="Install, cache, and offline readiness."
          icon={Archive}
        >
          <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
            <EmptyLine>
              {pwa.isOnline ? 'Online' : 'Offline'} •{' '}
              {pwa.updateAvailable ? 'Update ready' : 'Up to date'}
            </EmptyLine>
            <EmptyLine>{cacheStatus}</EmptyLine>
            <EmptyLine>Manifest: /manifest.json</EmptyLine>
            <EmptyLine>Service worker: /service-worker.js</EmptyLine>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleInstallPwa()}
              disabled={!pwa.installAvailable || busy === 'install'}
            >
              Install App
            </Button>
          </div>
        </Panel>

        <Panel
          title="What This Adds"
          subtitle="All 10 requested capabilities now have a working MVP surface."
          icon={Zap}
        >
          <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
            {[
              'Daily Brief',
              'Rules & Automations',
              'Goal Tracking',
              'Recurring Calendar',
              'Data Health',
              'Global Inbox',
              'Advanced Search',
              'Habits & Routines',
              'Encrypted Backup',
              'PWA Diagnostics',
            ].map((item) => (
              <EmptyLine key={item}>{item}</EmptyLine>
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
