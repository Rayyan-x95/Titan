import { describe, expect, it } from 'vitest';
import { canSkipOnboarding, onboardingSteps } from './onboardingFlow';

describe('onboarding flow', () => {
  it('allows users to skip setup before payment details are requested', () => {
    const welcomeStep = onboardingSteps.findIndex((step) => step.id === 'welcome');
    const nameStep = onboardingSteps.findIndex((step) => step.id === 'name');
    const phoneStep = onboardingSteps.findIndex((step) => step.id === 'phone');

    expect(canSkipOnboarding(welcomeStep, '')).toBe(true);
    expect(canSkipOnboarding(nameStep, '')).toBe(true);
    expect(canSkipOnboarding(phoneStep, '')).toBe(false);
    expect(canSkipOnboarding(phoneStep, 'rayyan@upi')).toBe(true);
  });
});
