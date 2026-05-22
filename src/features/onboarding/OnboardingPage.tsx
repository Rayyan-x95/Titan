import {
  Suspense,
  lazy,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '@/core/settings';
import {
  useStore,
  type FinancialGoal,
  type OnboardingProfile,
  type OnboardingUpdate,
} from '@/core/store';
import { useSeo } from '@/hooks/useSeo';
import { OnboardingControls } from './components/OnboardingControls';
import { OnboardingStepper } from './components/OnboardingStepper';
import {
  centsToMoney,
  clampStep,
  canSkipOnboarding,
  getOnboardingValidationError,
  normalizeMoneyInput,
  onboardingSteps,
  moneyToCents,
  type OnboardingStepId,
} from './onboardingFlow';
import type { OnboardingStepProps } from './types';

const stepComponents: Record<
  OnboardingStepId,
  LazyExoticComponent<ComponentType<OnboardingStepProps>>
> = {
  welcome: lazy(() => import('./steps/WelcomeStep')),
  name: lazy(() => import('./steps/NameStep')),
  currency: lazy(() => import('./steps/CurrencyStep')),
  phone: lazy(() => import('./steps/PhoneStep')),
  dob: lazy(() => import('./steps/DobStep')),
  income: lazy(() => import('./steps/IncomeStep')),
  expense: lazy(() => import('./steps/ExpenseStep')),
  goals: lazy(() => import('./steps/GoalsStep')),
  preferences: lazy(() => import('./steps/PreferencesStep')),
  ready: lazy(() => import('./steps/ReadyStep')),
};

function mergeOnboardingProfile(
  current: OnboardingProfile,
  updates: OnboardingUpdate,
): OnboardingProfile {
  return {
    ...current,
    ...updates,
    preferences: updates.preferences
      ? { ...current.preferences, ...updates.preferences }
      : current.preferences,
    updatedAt: new Date().toISOString(),
  };
}

function toPersistedUpdate(profile: OnboardingProfile): OnboardingUpdate {
  return {
    name: profile.name,
    phoneNumber: profile.phoneNumber,
    upiId: profile.upiId,
    dob: profile.dob,
    income: profile.income,
    avgExpense: profile.avgExpense,
    goals: profile.goals,
    preferences: profile.preferences,
    currentStep: profile.currentStep,
  };
}

export function OnboardingPage() {
  useSeo({
    title: 'Onboarding',
    description: 'Set up Titan locally without an account.',
    path: '/onboarding',
  });

  const navigate = useNavigate();
  const onboarding = useStore((state) => state.onboarding);
  const updateOnboarding = useStore((state) => state.updateOnboarding);
  const completeOnboarding = useStore((state) => state.completeOnboarding);
  const skipOnboarding = useStore((state) => state.skipOnboarding);
  const setNotifications = useSettings((state) => state.setNotifications);
  const setCurrency = useSettings((state) => state.setCurrency);

  const [draft, setDraft] = useState(onboarding);
  const draftRef = useRef(draft);
  const persistQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [activeStep, setActiveStep] = useState(() => clampStep(onboarding.currentStep));
  const [incomeInput, setIncomeInput] = useState(() => centsToMoney(onboarding.income));
  const [expenseInput, setExpenseInput] = useState(() => centsToMoney(onboarding.avgExpense));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const step = onboardingSteps[activeStep];
  const StepComponent = stepComponents[step.id];
  const incomeCents = moneyToCents(incomeInput);
  const expenseCents = moneyToCents(expenseInput);
  const firstName = draft.name.trim().split(/\s+/)[0] || 'there';

  const validationError = useMemo(
    () => getOnboardingValidationError(step.id, draft, incomeInput, expenseInput),
    [draft, expenseInput, incomeInput, step.id],
  );

  const persistProfile = useCallback(
    (updates: OnboardingUpdate) => {
      const next = mergeOnboardingProfile(draftRef.current, updates);
      draftRef.current = next;
      setDraft(next);

      const persistedUpdate = toPersistedUpdate(next);
      persistQueueRef.current = persistQueueRef.current
        .catch(() => undefined)
        .then(() => updateOnboarding(persistedUpdate));
    },
    [updateOnboarding],
  );

  const goToStep = useCallback(
    (nextStep: number) => {
      const clamped = clampStep(nextStep);
      setActiveStep(clamped);
      setError(null);
      persistProfile({ currentStep: clamped });
    },
    [persistProfile],
  );

  const handleNext = () => {
    if (validationError) {
      setError(validationError);
      return;
    }

    goToStep(activeStep + 1);
  };

  const handleBack = () => {
    goToStep(activeStep - 1);
  };

  const handleSkip = async () => {
    setIsSaving(true);
    try {
      await persistQueueRef.current.catch(() => undefined);
      await skipOnboarding();
      void navigate('/', { replace: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await persistQueueRef.current.catch(() => undefined);

      const profile = draftRef.current;
      await completeOnboarding({
        name: profile.name.trim(),
        phoneNumber: profile.phoneNumber?.trim(),
        upiId: profile.upiId?.trim(),
        dob: profile.dob,
        income: incomeCents,
        avgExpense: expenseCents,
        goals: profile.goals,
        currency: profile.currency,
        preferences: profile.preferences,
      });

      setCurrency(profile.currency);
      void setNotifications(profile.preferences.notifications);
      void navigate('/', { replace: true });
    } catch (completeError) {
      setError(
        completeError instanceof Error ? completeError.message : 'Could not finish onboarding.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileChange = (updates: OnboardingUpdate) => {
    setError(null);
    persistProfile(updates);
  };

  const handleIncomeInputChange = (value: string) => {
    setError(null);
    const normalized = normalizeMoneyInput(value);
    setIncomeInput(normalized);
    persistProfile({ income: moneyToCents(normalized) });
  };

  const handleExpenseInputChange = (value: string) => {
    setError(null);
    const normalized = normalizeMoneyInput(value);
    setExpenseInput(normalized);
    persistProfile({ avgExpense: moneyToCents(normalized) });
  };

  const handleGoalToggle = (goal: FinancialGoal) => {
    const currentGoals = draftRef.current.goals;
    const goals = currentGoals.includes(goal)
      ? currentGoals.filter((item) => item !== goal)
      : [...currentGoals, goal];

    persistProfile({ goals });
  };

  const handlePreferenceChange = (preferences: Partial<OnboardingProfile['preferences']>) => {
    const nextPreferences = { ...draftRef.current.preferences, ...preferences };
    persistProfile({ preferences: nextPreferences });
  };

  const stepProps: OnboardingStepProps = {
    profile: draft,
    firstName,
    incomeInput,
    expenseInput,
    incomeCents,
    expenseCents,
    onProfileChange: handleProfileChange,
    onIncomeInputChange: handleIncomeInputChange,
    onExpenseInputChange: handleExpenseInputChange,
    onGoalToggle: handleGoalToggle,
    onPreferenceChange: handlePreferenceChange,
  };

  const skipDisabled = isSaving || !canSkipOnboarding(activeStep, draft.upiId);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Premium Backdrop Blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-blob-morph" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/10 blur-[120px] animate-blob-morph animate-delay-3000" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8">
        <OnboardingStepper
          currentStep={activeStep}
          totalSteps={onboardingSteps.length}
          onSkip={() => {
            void handleSkip();
          }}
          disabled={skipDisabled}
        />

        <div className="grid flex-1 place-items-center py-10">
          <div className="w-full">
            <div className="mx-auto mb-8 max-w-3xl text-center">
              <motion.p
                key={`${step.id}-eyebrow`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400"
              >
                {step.eyebrow}
              </motion.p>
              <motion.h1
                key={`${step.id}-title`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="titan-metric mt-4 text-4xl tracking-tighter text-white sm:text-6xl"
              >
                {step.title}
              </motion.h1>
              <motion.p
                key={`${step.id}-subtitle`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 font-bold sm:text-base"
              >
                {step.subtitle}
              </motion.p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 28, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.98 }}
                transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <Suspense
                  fallback={
                    <div className="glass-panel mx-auto h-48 max-w-xl animate-pulse rounded-[2.5rem] border-white/5 bg-white/5" />
                  }
                >
                  <StepComponent {...stepProps} />
                </Suspense>
              </motion.div>
            </AnimatePresence>

            {error && activeStep > 0 && activeStep < onboardingSteps.length - 1 ? (
              <p
                aria-live="polite"
                className="mt-8 text-center text-sm font-semibold text-amber-300"
              >
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <OnboardingControls
          stepId={step.id}
          canGoBack={activeStep > 0}
          isSaving={isSaving}
          onBack={handleBack}
          onNext={handleNext}
          onComplete={() => {
            void handleComplete();
          }}
        />
      </section>
    </main>
  );
}
