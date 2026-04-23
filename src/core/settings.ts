import { create } from 'zustand';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY';

export interface NotificationSettings {
  taskDueDate: boolean;
  budgetAlert: boolean;
  taskCompleted: boolean;
  sharedBalance: boolean;
}

export interface AppSettings {
  currency: CurrencyCode;
  notifications: boolean;
  notificationSettings: NotificationSettings;
  compactMode: boolean;
  animations: boolean;
  appPin?: string;
  pinEnabled: boolean;
}

const DEFAULT_PIN_SALT = 'titan-pin-salt-v1';

function resolvePinSalt(): string {
  const envSalt = (globalThis as { process?: { env?: { SALT?: string } } }).process?.env?.SALT;
  return envSalt ?? DEFAULT_PIN_SALT;
}

export async function hashPin(pin: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(`${pin}::${resolvePinSalt()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPinWithKey(pin: string, key: string): Promise<string> {
  const salt = key || resolvePinSalt();
  const msgUint8 = new TextEncoder().encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface SettingsStore extends AppSettings {
  setCurrency: (currency: CurrencyCode) => void;
  setNotifications: (enabled: boolean) => Promise<void>;
  setNotificationSetting: (setting: keyof NotificationSettings, value: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  setAnimations: (enabled: boolean) => void;
  setPin: (pin?: string) => Promise<void>;
  setPinEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'titan-settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return {
        currency: parsed.currency ?? 'USD',
        notifications: parsed.notifications ?? true,
        notificationSettings: parsed.notificationSettings ?? {
          taskDueDate: true,
          budgetAlert: true,
          taskCompleted: false,
          sharedBalance: true,
        },
        compactMode: parsed.compactMode ?? false,
        animations: parsed.animations ?? true,
        appPin: parsed.appPin,
        pinEnabled: parsed.pinEnabled ?? false,
      };
    }
  } catch {
    // ignore
  }
  return {
    currency: 'USD',
    notifications: true,
    notificationSettings: {
      taskDueDate: true,
      budgetAlert: true,
      taskCompleted: false,
      sharedBalance: true,
    },
    compactMode: false,
    animations: true,
    pinEnabled: false
  };
}

function persist(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function makeUpdater<K extends keyof AppSettings>(key: K) {
  return (store: SettingsStore, value: AppSettings[K]): Partial<SettingsStore> => {
    const next = { ...store, [key]: value } as AppSettings;
    persist(next);
    return { [key]: value };
  };
}

const initial = loadSettings();

export const useSettings = create<SettingsStore>((set, get) => ({
  ...initial,

  setCurrency: (currency) => set(makeUpdater('currency')(get(), currency)),
  setNotifications: async (notifications) => {
    let nextNotifications = notifications;
    if (notifications && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        nextNotifications = false;
      }
    }
    set((state) => makeUpdater('notifications')(state, nextNotifications));
  },
  setNotificationSetting: (setting, value) => {
    const current = get().notificationSettings;
    set(makeUpdater('notificationSettings')(get(), {
      ...current,
      [setting]: value,
    }));
  },
  setCompactMode: (compactMode) => set(makeUpdater('compactMode')(get(), compactMode)),
  setAnimations: (animations) => set(makeUpdater('animations')(get(), animations)),
  setPin: async (appPin) => {
    const hashed = appPin ? await hashPin(appPin) : undefined;
    set(makeUpdater('appPin')(get(), hashed));
  },
  setPinEnabled: (pinEnabled) => set(makeUpdater('pinEnabled')(get(), pinEnabled)),
}));

/**
 * Format a cent-integer amount using the user's preferred currency.
 */
export function formatMoney(cents: number, currency: CurrencyCode): string {
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    // Explicitly handle zero-decimal currencies if needed, 
    // although Intl.NumberFormat usually handles this based on the currency code.
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  };

  return new Intl.NumberFormat(undefined, formatOptions)
    .format(cents / 100);
}
