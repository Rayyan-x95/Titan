import type { FinancialGoal, OnboardingProfile } from '@/core/store';

export type OnboardingStepId =
  | 'welcome'
  | 'name'
  | 'phone'
  | 'dob'
  | 'income'
  | 'expense'
  | 'goals'
  | 'preferences'
  | 'ready';

export interface OnboardingStepMeta {
  id: OnboardingStepId;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export const onboardingSteps: OnboardingStepMeta[] = [
  {
    id: 'welcome',
    eyebrow: 'Private setup',
    title: 'Make Titan feel like yours.',
    subtitle: 'No account. No cloud sync. Just local context for a smarter start.',
  },
  {
    id: 'name',
    eyebrow: 'Identity',
    title: 'What should Titan call you?',
    subtitle: 'A name is enough. Everything stays on this device.',
  },
  {
    id: 'phone',
    eyebrow: 'Contact',
    title: 'Your phone number?',
    subtitle: 'Completely optional. Titan stays offline and structured.',
  },
  {
    id: 'dob',
    eyebrow: 'Personalization',
    title: 'Add your date of birth.',
    subtitle: 'Used later for age-aware insights and personal milestones.',
  },
  {
    id: 'income',
    eyebrow: 'Cashflow',
    title: 'Monthly income, roughly.',
    subtitle: 'This becomes the anchor for your first budget suggestions.',
  },
  {
    id: 'expense',
    eyebrow: 'Baseline',
    title: 'Average monthly expense?',
    subtitle: 'Titan uses this as your first spending boundary.',
  },
  {
    id: 'goals',
    eyebrow: 'Intent',
    title: 'Pick what matters now.',
    subtitle: 'Optional, but useful. Choose one or more goals.',
  },
  {
    id: 'preferences',
    eyebrow: 'Defaults',
    title: 'Set your app preferences.',
    subtitle: 'Keep the workspace quiet, fast, and ready for offline use.',
  },
  {
    id: 'ready',
    eyebrow: 'Ready',
    title: 'Your local command center is ready.',
    subtitle: 'Titan will open your dashboard with budget suggestions prepared.',
  },
];

export const goalOptions: { id: FinancialGoal; label: string; description: string }[] = [
  { id: 'save-money', label: 'Save money', description: 'Build more room between income and spend.' },
  { id: 'track-spending', label: 'Track spending', description: 'See where money actually goes each month.' },
  { id: 'improve-productivity', label: 'Improve productivity', description: 'Connect tasks, notes, and focus.' },
  { id: 'reduce-expenses', label: 'Reduce expenses', description: 'Start with a tighter monthly boundary.' },
];

export function clampStep(step: number) {
  return Math.max(0, Math.min(step, onboardingSteps.length - 1));
}

export function normalizeMoneyInput(value: string) {
  const numeric = value.replace(/[^\d.]/g, '');
  const [whole, ...decimalParts] = numeric.split('.');
  const decimals = decimalParts.join('').slice(0, 2);

  if (numeric.includes('.')) {
    return `${whole}.${decimals}`;
  }

  return whole;
}

export function moneyToCents(value: string) {
  const parsed = Number.parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function centsToMoney(value: number) {
  return value > 0 ? String(value / 100) : '';
}

export function formatOnboardingMoney(value: number, currency: string = 'INR') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function formatDob(value?: string) {
  if (!value) return 'Not set';

  return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function isValidDob(value?: string) {
  if (!value) return false;

  const date = new Date(`${value}T12:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return Number.isFinite(date.getTime()) && date <= today;
}

export function getOnboardingValidationError(
  stepId: OnboardingStepId,
  profile: OnboardingProfile,
  incomeInput: string,
  expenseInput: string,
) {
  if (stepId === 'name' && profile.name.trim().length < 2) {
    return 'Enter at least 2 characters.';
  }

  if (stepId === 'dob' && !isValidDob(profile.dob)) {
    return 'Choose a valid date to continue.';
  }

  if (stepId === 'income' && moneyToCents(incomeInput) <= 0) {
    return 'Enter a monthly income greater than 0.';
  }

  if (stepId === 'expense' && moneyToCents(expenseInput) <= 0) {
    return 'Enter an average expense greater than 0.';
  }

  return null;
}
