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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Dropdown } from '@/components/ui';
import { PageShell } from '@/components';
import { useStore } from '@/core/store';
import { useSettings, hashPin } from '@/core/settings';
import { useSeo } from '@/hooks/useSeo';
import { toLocalDateString } from '@/utils/date';
import { APP_VERSION } from '@/core/version';
import { cn } from '@/utils/cn';
import { DiagnosticsDashboard } from './components/DiagnosticsDashboard';

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
  const totalItems = tasks.length + notes.length + expenses.length;
  const storageEstimate = `${totalItems} items stored locally`;
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
              <Toggle checked={animations} onChange={setAnimations} ariaLabel="Toggle animations" />
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
            action={<span className="text-xs text-muted-foreground font-mono">{APP_VERSION}</span>}
          />
        </SettingsSection>
      </div>
    </PageShell>
  );
}
