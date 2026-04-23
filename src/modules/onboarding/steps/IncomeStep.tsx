import type { OnboardingStepProps } from '../types';
import { LargeMoneyInput } from '../components/LargeMoneyInput';
import { useSettings } from '@/core/settings';

export default function IncomeStep({ incomeInput, onIncomeInputChange }: OnboardingStepProps) {
  return (
    <LargeMoneyInput
      autoFocus
      value={incomeInput}
      onChange={onIncomeInputChange}
      placeholder="75000"
      helper={`Monthly income in ${useSettings.getState().currency === 'INR' ? 'INR' : 'USD'}`}
    />
  );
}
