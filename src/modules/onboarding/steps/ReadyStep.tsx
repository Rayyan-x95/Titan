import { Sparkles } from 'lucide-react';
import type { OnboardingStepProps } from '../types';
import { formatOnboardingMoney } from '../onboardingFlow';
import { useSettings } from '@/core/settings';

export default function ReadyStep({ firstName, incomeCents, expenseCents, profile }: OnboardingStepProps) {
  const monthlyRoom = incomeCents - expenseCents;
  const selectedGoals = profile.goals.length;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 shadow-[0_0_60px_rgba(16,185,129,0.22)]">
        <Sparkles className="h-9 w-9" aria-hidden="true" />
      </div>
      <h2 className="mt-8 text-5xl font-black tracking-tight text-foreground sm:text-7xl">Ready, {firstName}.</h2>
      <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
        Titan has enough signal to shape your first dashboard and create starter monthly budgets.
      </p>

      <div className="mx-auto mt-8 grid max-w-xl gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 text-left sm:grid-cols-3">
        <div className="bg-background/75 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Income</p>
          <p className="mt-2 text-lg font-black text-foreground">{formatOnboardingMoney(incomeCents, useSettings.getState().currency)}</p>
        </div>
        <div className="bg-background/75 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Room</p>
          <p className={monthlyRoom >= 0 ? 'mt-2 text-lg font-black text-emerald-300' : 'mt-2 text-lg font-black text-amber-300'}>
            {formatOnboardingMoney(monthlyRoom, useSettings.getState().currency)}
          </p>
        </div>
        <div className="bg-background/75 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Goals</p>
          <p className="mt-2 text-lg font-black text-foreground">{selectedGoals || 'Optional'}</p>
        </div>
      </div>
    </div>
  );
}
