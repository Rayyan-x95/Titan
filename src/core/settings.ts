import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  biometricEnabled: boolean;
}

const DEFAULT_PIN_SALT = 'titan-pin-salt-v1';
const PBKDF2_ITERATIONS = 100000;

function resolvePinSalt(): string {
  const envSalt = (globalThis as { process?: { env?: { SALT?: string } } }).process?.env?.SALT;
  return envSalt ?? DEFAULT_PIN_SALT;
}

/**
 * Advanced PIN hashing using PBKDF2 to prevent local brute-force
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = encoder.encode(resolvePinSalt());
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ]);

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );

  const hashArray = Array.from(new Uint8Array(derivedKey));
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
  setBiometricEnabled: (enabled: boolean) => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set, get) => ({
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
      pinEnabled: false,
      biometricEnabled: false,

      setCurrency: (currency) => set({ currency }),
      setNotifications: async (notifications) => {
        let nextNotifications = notifications;
        if (notifications && 'Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            nextNotifications = false;
          }
        }
        set({ notifications: nextNotifications });
      },
      setNotificationSetting: (setting, value) => {
        const current = get().notificationSettings;
        set({
          notificationSettings: {
            ...current,
            [setting]: value,
          },
        });
      },
      setCompactMode: (compactMode) => set({ compactMode }),
      setAnimations: (animations) => set({ animations }),
      setPin: async (appPin) => {
        const hashed = appPin ? await hashPin(appPin) : undefined;
        set({ appPin: hashed });
      },
      setPinEnabled: (pinEnabled) => set({ pinEnabled }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
    }),
    {
      name: 'titan-settings',
    },
  ),
);

/**
 * Format a cent-integer amount using the user's preferred currency.
 */
export function formatMoney(cents: number, currency: CurrencyCode): string {
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  };

  return new Intl.NumberFormat(undefined, formatOptions).format(cents / 100);
}
