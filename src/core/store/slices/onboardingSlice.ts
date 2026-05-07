import { StateCreator } from 'zustand';
import { db } from '@/core/db/db';
import type { OnboardingProfile, OnboardingUpdate } from '../types';
import type { CoreStoreState } from '../useStore';
import { buildBudgetSuggestions } from '@/lib/core/financeEngine';
import { createDefaultOnboardingProfile, upsertItem } from '../utils';

export interface OnboardingSlice {
  onboarding: OnboardingProfile;
  updateOnboarding: (updates: OnboardingUpdate) => Promise<OnboardingProfile>;
  completeOnboarding: (updates?: OnboardingUpdate) => Promise<OnboardingProfile>;
  skipOnboarding: () => Promise<OnboardingProfile>;
}

export const createOnboardingSlice: StateCreator<CoreStoreState, [], [], OnboardingSlice> = (
  set,
  get,
) => ({
  onboarding: createDefaultOnboardingProfile(),

  updateOnboarding: async (updates) => {
    const current = get().onboarding;
    const now = new Date().toISOString();
    const next: OnboardingProfile = {
      ...current,
      ...updates,
      preferences: updates.preferences
        ? { ...current.preferences, ...updates.preferences }
        : current.preferences,
      updatedAt: now,
    };

    await db.onboarding.put(next);
    set({ onboarding: next });
    return next;
  },

  completeOnboarding: async (updates = {}) => {
    const current = get().onboarding;
    const now = new Date().toISOString();
    const next: OnboardingProfile = {
      ...current,
      ...updates,
      preferences: updates.preferences
        ? { ...current.preferences, ...updates.preferences }
        : current.preferences,
      currentStep: Math.max(current.currentStep, 7),
      completedAt: now,
      skippedAt: undefined,
      updatedAt: now,
    };
    const budgetSuggestions = buildBudgetSuggestions(next, get().budgets);

    await db.transaction('rw', [db.onboarding, db.budgets], async () => {
      await db.onboarding.put(next);
      if (budgetSuggestions.length > 0) {
        await db.budgets.bulkPut(budgetSuggestions);
      }
    });

    set((state) => ({
      onboarding: next,
      budgets: budgetSuggestions.reduce(
        (acc, budget) => upsertItem(acc, budget),
        state.budgets,
      ),
    }));
    return next;
  },

  skipOnboarding: async () => {
    const current = get().onboarding;
    const now = new Date().toISOString();
    const next: OnboardingProfile = {
      ...current,
      skippedAt: now,
      updatedAt: now,
    };

    await db.onboarding.put(next);
    set({ onboarding: next });
    return next;
  },
});
