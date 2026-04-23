import { CircleDollarSign } from 'lucide-react';
import { useSettings } from '@/core/settings';

interface LargeMoneyInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  helper: string;
  autoFocus?: boolean;
}

export function LargeMoneyInput({ value, placeholder, onChange, helper, autoFocus }: LargeMoneyInputProps) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <CircleDollarSign className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
      <label className="mt-8 flex items-center justify-center gap-3">
        <span className="text-5xl font-black tracking-tight text-primary sm:text-7xl">
          {useSettings.getState().currency === 'INR' ? '₹' : '$'}
        </span>
        <input
          autoFocus={autoFocus}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={helper}
          className="min-w-0 max-w-[min(24rem,68vw)] bg-transparent text-center text-5xl font-black tracking-tight text-foreground outline-none placeholder:text-muted-foreground/25 sm:text-7xl"
        />
      </label>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{helper}</p>
    </div>
  );
}
