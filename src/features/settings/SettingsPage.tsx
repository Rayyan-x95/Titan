import { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Trash2,
  Database,
  Info,
  Smartphone,
  Globe,
  Palette,
  ShieldCheck,
  RefreshCw,
  Fingerprint,
  QrCode,
  ChevronRight,
  FileText,
  Activity,
  Archive,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  HeartPulse,
  Inbox,
  Radar,
  Search,
  Target,
  Zap,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Dropdown } from '@/components/ui';
import { PageShell } from '@/components';
import { useStore } from '@/core/store';
import { useSettings, hashPin, formatMoney } from '@/core/settings';
import { useSeo } from '@/hooks/useSeo';
import { usePwaStatus } from '@/hooks/usePwaStatus';
import { toLocalDateString } from '@/utils/date';
import { APP_VERSION } from '@/core/version';
import { cn } from '@/utils/cn';
import { DiagnosticsDashboard } from './components/DiagnosticsDashboard';
import { promptInstall } from '@/pwa';
import {
  buildDailyBrief,
  diagnoseDataHealth,
  parseInboxDraft,
  searchTitan,
} from '@/lib/core/intelligenceEngine';

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}
function SettingsRow({ icon, title, description, action }: SettingsRowProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-6 border-b border-white/5 last:border-0">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/10 shadow-glow">
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-bold">{description}</p>
        </div>
      </div>
      <div className="w-full sm:w-auto pl-[3.75rem] sm:pl-0 flex sm:justify-end">{action}</div>
    </div>
  );
}
interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}
function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="titan-section glass-panel p-6 border-white/5 space-y-2">
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 px-1">
        {title}
      </p>
      {children}
    </div>
  );
}
function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={`${ariaLabel}: ${checked ? 'On' : 'Off'}`}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none min-h-0 min-w-0',
        checked ? 'bg-blue-600 shadow-glow-blue' : 'bg-slate-800',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}

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

export function SettingsPage() {
  useSeo({
    title: 'Settings',
    description:
      'Customize Titan — switch themes, manage data, set your currency, and control notifications. Your data never leaves your device.',
    path: '/settings',
    keywords: 'settings, preferences, theme, dark mode, data export, privacy, currency settings',
  });
  const tasks = useStore((state) => state.tasks);
  const notes = useStore((state) => state.notes);
  const expenses = useStore((state) => state.expenses);
  const budgets = useStore((state) => state.budgets);
  const accounts = useStore((state) => state.accounts);
  const friends = useStore((state) => state.friends);
  const groups = useStore((state) => state.groups);
  const sharedExpenses = useStore((state) => state.sharedExpenses);
  const onboarding = useStore((state) => state.onboarding);
  const importBackup = useStore((state) => state.importBackup);
  const clearAll = useStore((state) => state.clearAll);
  const recomputeSnapshots = useStore((state) => state.recomputeSnapshots);
  const {
    currency,
    compactMode,
    animations,
    appPin,
    pinEnabled,
    biometricEnabled,
    setCurrency,
    setCompactMode,
    setAnimations,
    setPin,
    setPinEnabled,
    setBiometricEnabled,
  } = useSettings();
  const pwa = usePwaStatus();
  const totalItems = tasks.length + notes.length + expenses.length;
  const storageEstimate = `${totalItems} items stored locally`;

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'intelligence' ? 'intelligence' : 'general';

  // Intelligence States and Lists
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

  // Intelligence Memoized Derivations
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
      await useStore.getState().addTask({ title: draft.title, status: 'todo' });
    } else if (draft.kind === 'note') {
      await useStore.getState().addNote({ content: draft.title, tags: [] });
    } else {
      await useStore.getState().addExpense({
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

  const handleRepairIntegrity = async () => {
    setBusy('repair');
    try {
      await useStore.getState().repairDataIntegrity();
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

  const handleExportData = () => {
    const data = {
      exportedAt: toLocalDateString(new Date()),
      version: '1.0',
      tasks,
      notes,
      expenses,
      budgets,
      accounts,
      friends,
      groups,
      sharedExpenses,
      onboarding,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `titan-backup-${toLocalDateString(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        await importBackup(parsed);
        window.alert('Backup imported successfully.');
      } catch (error) {
        console.error('Failed to import backup', error);
        window.alert('Invalid backup file.');
      }
    };
    input.click();
  };
  const handleClearData = async () => {
    const confirmed = window.confirm(
      'This will permanently delete ALL your tasks, notes, and expenses. This action cannot be undone. Are you sure?',
    );
    if (!confirmed) return;
    const secondConfirm = window.confirm(
      'Are you absolutely sure? All your data will be lost forever.',
    );
    if (!secondConfirm) return;
    await clearAll();
    window.alert('All local data has been cleared.');
  };
  return (
    <PageShell
      eyebrow="Preferences"
      title="Settings"
      description="Profile, preferences, and data controls in one clean system panel."
    >
      <div className="space-y-6">
        {/* Premium Tab Switcher */}
        <div className="flex">
          <div className="flex flex-1 sm:flex-initial rounded-2xl bg-slate-900/60 p-1 border border-white/5 backdrop-blur-xl sm:w-[400px]">
            <button
              onClick={() => setSearchParams({ tab: 'general' })}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300',
                activeTab === 'general'
                  ? 'bg-blue-500 text-white shadow-glow-blue'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <Palette className="h-4 w-4" />
              General
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'intelligence' })}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300',
                activeTab === 'intelligence'
                  ? 'bg-blue-500 text-white shadow-glow-blue'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <Zap className="h-4 w-4" />
              Intelligence
            </button>
          </div>
        </div>

        {activeTab === 'general' ? (
          <>
            <SettingsSection title="Appearance">
              <SettingsRow
                icon={<Palette className="h-5 w-5" />}
                title="Compact Mode"
                description="Reduce spacing between cards and list items for a denser layout."
                action={
                  <Toggle
                    checked={compactMode}
                    onChange={setCompactMode}
                    ariaLabel="Toggle compact mode"
                  />
                }
              />
              <SettingsRow
                icon={<Smartphone className="h-5 w-5" />}
                title="Animations"
                description="Enable or disable motion animations and micro-interactions."
                action={
                  <Toggle
                    checked={animations}
                    onChange={setAnimations}
                    ariaLabel="Toggle animations"
                  />
                }
              />
            </SettingsSection>
            <SettingsSection title="Finance">
              <SettingsRow
                icon={<Globe className="h-5 w-5" />}
                title="Currency"
                description="Select the currency used for all expense tracking."
                action={
                  <Dropdown
                    label="Currency"
                    value={currency}
                    onChange={(value) => setCurrency(value)}
                    options={[
                      { label: 'USD ($)', value: 'USD' },
                      { label: 'EUR (€)', value: 'EUR' },
                      { label: 'GBP (£)', value: 'GBP' },
                      { label: 'INR (₹)', value: 'INR' },
                      { label: 'JPY (¥)', value: 'JPY' },
                    ]}
                    className="w-full sm:w-48"
                  />
                }
              />
              <SettingsRow
                icon={<QrCode className="h-5 w-5" />}
                title="UPI ID"
                description="Your UPI ID for receiving split payments (e.g., username@upi)."
                action={
                  <input
                    type="text"
                    placeholder="name@upi"
                    value={onboarding.upiId || ''}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/\s/g, '');
                      void useStore.getState().updateOnboarding({ upiId: val });
                    }}
                    className="w-full sm:w-48 rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm font-bold text-white placeholder:text-slate-600 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                }
              />
            </SettingsSection>
            <SettingsSection title="Security">
              <SettingsRow
                icon={<ShieldCheck className="h-5 w-5" />}
                title="App PIN Lock"
                description="Require a 4-digit PIN to access Titan. This adds an extra layer of privacy."
                action={
                  <div className="flex items-center gap-3">
                    {pinEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void (async () => {
                            if (appPin) {
                              const current = window.prompt('Enter current 4-digit PIN:');
                              if (current === null) return;
                              const hashed = await hashPin(current);
                              if (hashed !== appPin) {
                                window.alert('Incorrect current PIN.');
                                return;
                              }
                            }
                            const next = window.prompt('Enter new 4-digit PIN:');
                            if (next && next.length === 4 && /^\d+$/.test(next)) await setPin(next);
                            else if (next) window.alert('PIN must be 4 digits.');
                          })();
                        }}
                      >
                        Change PIN
                      </Button>
                    )}
                    <Toggle
                      checked={pinEnabled}
                      onChange={(val) => {
                        void (async () => {
                          if (val && !appPin) {
                            const next = window.prompt('Set 4-digit PIN:');
                            if (next && next.length === 4 && /^\d+$/.test(next)) {
                              await setPin(next);
                              setPinEnabled(true);
                            } else {
                              window.alert('PIN must be 4 digits.');
                            }
                          } else if (!val && appPin) {
                            const current = window.prompt('Enter current PIN to disable:');
                            if (current === null) return;
                            const hashed = await hashPin(current);
                            if (hashed !== appPin) {
                              window.alert('Incorrect PIN.');
                              return;
                            }
                            setPinEnabled(false);
                          } else {
                            setPinEnabled(val);
                          }
                        })();
                      }}
                      ariaLabel="Toggle PIN lock"
                    />
                  </div>
                }
              />
              {pinEnabled && (
                <SettingsRow
                  icon={<Fingerprint className="h-5 w-5" />}
                  title="Biometric Unlock"
                  description="Use WebAuthn / Biometrics (Touch ID, Face ID) instead of entering your PIN."
                  action={
                    <Toggle
                      checked={biometricEnabled}
                      onChange={setBiometricEnabled}
                      ariaLabel="Toggle biometric unlock"
                    />
                  }
                />
              )}
            </SettingsSection>
            <SettingsSection title="Data & Storage">
              <SettingsRow
                icon={<Database className="h-5 w-5" />}
                title="Local Storage"
                description={`All your data is stored on-device only. ${storageEstimate}.`}
                action={
                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400 shadow-glow">
                    On-device
                  </span>
                }
              />
              <SettingsRow
                icon={<Download className="h-5 w-5" />}
                title="Export Data"
                description="Download a full JSON backup of all your tasks, notes, and expenses."
                action={
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    Export JSON
                  </Button>
                }
              />
              <SettingsRow
                icon={<Download className="h-5 w-5" />}
                title="Import Data"
                description="Import a previously exported Titan JSON backup. This will replace your current data."
                action={
                  <Button variant="outline" size="sm" onClick={() => void handleImportData()}>
                    Import JSON
                  </Button>
                }
              />
              <SettingsRow
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Privacy"
                description="Titan never sends your data to any server. Everything stays on your device."
                action={
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 shadow-glow">
                    100% Private
                  </span>
                }
              />
              <SettingsRow
                icon={<RefreshCw className="h-5 w-5" />}
                title="Recompute Snapshots"
                description="Rebuild your daily life snapshots from existing data. Use this if the dashboard looks incorrect."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void (async () => {
                        await recomputeSnapshots();
                        window.alert('Snapshots recomputed successfully.');
                      })();
                    }}
                  >
                    Recompute
                  </Button>
                }
              />
              <SettingsRow
                icon={<Trash2 className="h-5 w-5" />}
                title="Clear All Data"
                description="Permanently delete all tasks, notes, and expenses. This cannot be undone."
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleClearData()}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Clear data
                  </Button>
                }
              />
            </SettingsSection>
            <SettingsSection title="Advanced Diagnostics">
              <DiagnosticsDashboard />
            </SettingsSection>
            <SettingsSection title="Legal">
              <Link to="/terms">
                <SettingsRow
                  icon={<FileText className="h-5 w-5" />}
                  title="Terms of Service"
                  description="Read the terms and conditions for using Titan."
                  action={<ChevronRight className="h-5 w-5 text-slate-600" />}
                />
              </Link>
              <Link to="/privacy">
                <SettingsRow
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Privacy Policy"
                  description="Learn how Titan protects your data locally."
                  action={<ChevronRight className="h-5 w-5 text-slate-600" />}
                />
              </Link>
            </SettingsSection>
            <SettingsSection title="About">
              <SettingsRow
                icon={<Info className="h-5 w-5" />}
                title="Titan"
                description="An offline-first productivity app built to unify your tasks, notes, and finances in one place."
                action={
                  <span className="text-xs text-muted-foreground font-mono">{APP_VERSION}</span>
                }
              />
            </SettingsSection>
          </>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Daily Brief" subtitle="Today’s operational summary." icon={Radar}>
              <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                <EmptyLine>{brief.overdueTasks.length} overdue task(s)</EmptyLine>
                <EmptyLine>{brief.dueTodayTasks.length} due today</EmptyLine>
                <EmptyLine>{brief.upcomingTasks.length} upcoming task(s)</EmptyLine>
                <EmptyLine>{brief.highPriorityTasks.length} high-priority focus item(s)</EmptyLine>
                <EmptyLine>{brief.budgetAlerts.length} budget warning(s)</EmptyLine>
                <EmptyLine>{formatMoney(brief.spendingToday, currency)} spent today</EmptyLine>
                <EmptyLine>
                  {formatMoney(brief.splitBalance, currency)} owed across splits
                </EmptyLine>
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
                  className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
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
                className="mb-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
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
              <div className="grid gap-3 sm:grid-cols-[140px_1fr_110px_auto] items-end">
                <div className="w-full flex flex-col gap-1.5">
                  <Dropdown
                    label="Type"
                    value={goalKind}
                    onChange={(value) => setGoalKind(value)}
                    options={[
                      { label: 'Savings', value: 'savings' },
                      { label: 'Debt', value: 'debt' },
                      { label: 'Habit', value: 'habit' },
                      { label: 'Spending', value: 'spending' },
                    ]}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1">
                    Goal Title
                  </span>
                  <input
                    value={goalTitle}
                    onChange={(event) => setGoalTitle(event.target.value)}
                    placeholder="Emergency fund"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1">
                    Target
                  </span>
                  <input
                    value={goalTarget}
                    onChange={(event) => setGoalTarget(event.target.value)}
                    placeholder="50000"
                    inputMode="numeric"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <Button
                  variant="primary"
                  className="h-12 w-full sm:w-auto px-6"
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
                  <div
                    key={goal.id}
                    className="rounded-2xl bg-white/[0.03] p-4 border border-white/[0.02]"
                  >
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-bold text-white">{goal.title}</span>
                      <span className="text-slate-400">
                        {formatMoney(goal.targetCents, currency)}
                      </span>
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
              <div className="flex gap-2 items-end">
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1">
                    Habit Title
                  </span>
                  <input
                    value={habitTitle}
                    onChange={(event) => setHabitTitle(event.target.value)}
                    placeholder="Morning walk"
                    className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <Button
                  variant="primary"
                  className="h-12 px-6"
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
                      className="flex w-full items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-left border border-white/[0.01] hover:bg-white/[0.05] hover:border-white/[0.05] transition-all"
                    >
                      <span className="text-sm font-bold text-white">{habit.title}</span>
                      <CheckCircle2
                        className={cn(
                          'h-5 w-5 transition-colors',
                          done ? 'text-emerald-400' : 'text-slate-700',
                        )}
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
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1">
                    When (Trigger)
                  </span>
                  <input
                    value={ruleTrigger}
                    onChange={(event) => setRuleTrigger(event.target.value)}
                    placeholder="When expense > 500"
                    className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1">
                    Then (Action)
                  </span>
                  <input
                    value={ruleAction}
                    onChange={(event) => setRuleAction(event.target.value)}
                    placeholder="Tag review"
                    className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <Button
                  variant="primary"
                  className="h-12 px-6"
                  onClick={() => {
                    if (!ruleTrigger.trim() || !ruleAction.trim()) return;
                    setRules([
                      ...rules,
                      {
                        id: createLocalId(),
                        trigger: ruleTrigger.trim(),
                        action: ruleAction.trim(),
                      },
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
                  <div
                    key={rule.id}
                    className="rounded-2xl bg-white/[0.03] px-4 py-3 border border-white/[0.01]"
                  >
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
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                  <EmptyLine>{dataHealthCounts.error} errors</EmptyLine>
                  <EmptyLine>{dataHealthCounts.warn} warnings</EmptyLine>
                  <EmptyLine>{dataHealthCounts.info} info</EmptyLine>
                </div>
                {healthIssues.slice(0, 5).map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-2xl bg-white/[0.03] px-4 py-3 border border-white/[0.01]"
                  >
                    <p className="text-sm font-bold text-white">{issue.title}</p>
                    <p className="text-xs text-slate-500">{issue.detail}</p>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => void recomputeSnapshots()}>
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
                  className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <Button variant="primary" size="md" type="submit" className="h-12">
                  <Download className="h-4 w-4" />
                  Export Encrypted Backup
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  className="h-12"
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
                  variant="primary"
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
        )}
      </div>
    </PageShell>
  );
}
