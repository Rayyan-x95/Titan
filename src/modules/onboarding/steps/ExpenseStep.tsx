import { Target } from 'lucide-react';
import type { OnboardingStepProps } from '../types';
import { formatOnboardingMoney } from '../onboardingFlow';
import { useSettings } from '@/core/settings';

export default function ExpenseStep({
  expenseInput,
  incomeCents,
  expenseCents,
  onExpenseInputChange,
}: OnboardingStepProps) {
  const surplus = incomeCents - expenseCents;
  const hasEstimate = incomeCents > 0 && expenseCents > 0;

  return (
    <div className="mx-auto max-w-xl text-center">
      <Target className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
      <label className="mt-8 flex items-center justify-center gap-3">
        <span className="text-5xl font-black tracking-tight text-primary sm:text-7xl">
          {useSettings.getState().currency === 'INR' ? '₹' : '$'}
        </span>
        <input
          autoFocus
          inputMode="decimal"
          value={expenseInput}
          onChange={(event) => onExpenseInputChange(event.target.value)}
          placeholder="42000"
          aria-label={`Average monthly expense in ${useSettings.getState().currency === 'INR' ? 'INR' : 'USD'}`}
          className="min-w-0 max-w-[min(24rem,68vw)] bg-transparent text-center text-5xl font-black tracking-tight text-foreground outline-none placeholder:text-muted-foreground/25 sm:text-7xl"
        />
      </label>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {hasEstimate ? (
          <>
            Estimated monthly surplus:{' '}
            <span className={surplus >= 0 ? 'font-bold text-emerald-300' : 'font-bold text-amber-300'}>
              {formatOnboardingMoney(surplus, useSettings.getState().currency)}
            </span>
          </>
        ) : (
          `Average monthly expense in ${useSettings.getState().currency === 'INR' ? 'INR' : 'USD'}`
        )}
      </p>
    </div>
  );
}
