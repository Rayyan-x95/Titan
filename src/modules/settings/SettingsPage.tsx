import {
  Sun,
  Moon,
  Download,
  Trash2,
  Database,
  Info,
  Smartphone,
  Globe,
  Palette,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { PageShell } from '@/components/PageShell';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/core/store';
import { useSettings, hashPin } from '@/core/settings';
import type { CurrencyCode } from '@/core/settings';
import { APP_VERSION } from '@/core/version';
import { useSeo } from '@/seo';

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}

function SettingsRow({ icon, title, description, action }: SettingsRowProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-5 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground/90 leading-relaxed font-medium">{description}</p>
        </div>
      </div>
      <div className="shrink-0 pl-14 sm:pl-0">{action}</div>
    </div>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
      <p className="text-xs font-semibold text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, ariaLabel }: { checked: boolean; onChange: (v: boolean) => void; ariaLabel: string }) {
  return (
    <button
      type="button"
      aria-label={`${ariaLabel}: ${checked ? 'On' : 'Off'}`}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        checked ? 'bg-primary shadow-glow' : 'bg-secondary'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function SettingsPage() {
  useSeo({
    title: 'Settings',
    description: 'Customize Titan — switch themes, manage data, set your currency, and control notifications. Your data never leaves your device.',
    path: '/settings',
    keywords: 'settings, preferences, theme, dark mode, data export, privacy, currency settings',
  });

  const { theme, toggleTheme } = useTheme();
  const tasks = useStore((state) => state.tasks);
  const notes = useStore((state) => state.notes);
  const expenses = useStore((state) => state.expenses);
  const importBackup = useStore((state) => state.importBackup);
  const clearAll = useStore((state) => state.clearAll);
  const recomputeSnapshots = useStore((state) => state.recomputeSnapshots);

  const { 
    currency, compactMode, animations, appPin, pinEnabled,
    setCurrency, setCompactMode, setAnimations, setPin, setPinEnabled 
  } = useSettings();

  const totalItems = tasks.length + notes.length + expenses.length;
  const storageEstimate = `${totalItems} items stored locally`;

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      tasks,
      notes,
      expenses,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `titan-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async () => {
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
      'This will permanently delete ALL your tasks, notes, and expenses. This action cannot be undone. Are you sure?'
    );
    if (!confirmed) return;
    const secondConfirm = window.confirm('Are you absolutely sure? All your data will be lost forever.');
    if (!secondConfirm) return;
    await clearAll();
    window.alert('All local data has been cleared.');
  };

  return (
    <PageShell
      title="Settings"
      description="Customize your Titan experience — appearance, data, and behavior all in one place."
    >
      <div className="space-y-6">

        {/* Appearance */}
        <SettingsSection title="Appearance">
          <SettingsRow
            icon={theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            title="Theme"
            description="Toggle between dark mode and light mode for the entire app."
            action={
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              </Button>
            }
          />
          <SettingsRow
            icon={<Palette className="h-5 w-5" />}
            title="Compact Mode"
            description="Reduce spacing between cards and list items for a denser layout."
            action={<Toggle checked={compactMode} onChange={setCompactMode} ariaLabel="Toggle compact mode" />}
          />
          <SettingsRow
            icon={<Smartphone className="h-5 w-5" />}
            title="Animations"
            description="Enable or disable motion animations and micro-interactions."
            action={<Toggle checked={animations} onChange={setAnimations} ariaLabel="Toggle animations" />}
          />
        </SettingsSection>

        {/* Finance */}
        <SettingsSection title="Finance">
          <SettingsRow
            icon={<Globe className="h-5 w-5" />}
            title="Currency"
            description="Select the currency used for all expense tracking."
            action={
              <Dropdown
                label="Currency"
                value={currency}
                onChange={(value) => setCurrency(value as CurrencyCode)}
                options={[
                  { label: 'USD ($)', value: 'USD' },
                  { label: 'EUR (€)', value: 'EUR' },
                  { label: 'GBP (£)', value: 'GBP' },
                  { label: 'INR (₹)', value: 'INR' },
                  { label: 'JPY (¥)', value: 'JPY' },
                ]}
                className="w-48"
              />
            }
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security">
          <SettingsRow
            icon={<ShieldCheck className="h-5 w-5" />}
            title="App PIN Lock"
            description="Require a 4-digit PIN to access Titan. This adds an extra layer of privacy."
            action={
              <div className="flex items-center gap-3">
                {pinEnabled && (
                  <Button variant="outline" size="sm" onClick={async () => {
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
                  }}>
                    Change PIN
                  </Button>
                )}
                <Toggle 
                  checked={pinEnabled} 
                  onChange={async (val) => {
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
                  }} 
                  ariaLabel="Toggle PIN lock" 
                />
              </div>
            }
          />
        </SettingsSection>

        {/* Data & Storage */}
        <SettingsSection title="Data & Storage">
          <SettingsRow
            icon={<Database className="h-5 w-5" />}
            title="Local Storage"
            description={`All your data is stored on-device only. ${storageEstimate}.`}
            action={
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
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
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                100% Private
              </span>
            }
          />
          <SettingsRow
            icon={<RefreshCw className="h-5 w-5" />}
            title="Recompute Snapshots"
            description="Rebuild your daily life snapshots from existing data. Use this if the dashboard looks incorrect."
            action={
              <Button variant="outline" size="sm" onClick={async () => {
                await recomputeSnapshots();
                window.alert('Snapshots recomputed successfully.');
              }}>
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

        {/* About */}
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

      </div>
    </PageShell>
  );
}
