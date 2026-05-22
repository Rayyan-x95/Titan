import {
  IndianRupee,
  DollarSign,
  Euro,
  PoundSterling,
  Coins,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/utils/cn';
import type { OnboardingStepProps } from '../types';
import type { CurrencyCode } from '@/core/settings';

const currencies: {
  id: CurrencyCode;
  label: string;
  symbol: string;
  icon: ComponentType<LucideProps>;
}[] = [
  { id: 'INR', label: 'Indian Rupee', symbol: '₹', icon: IndianRupee },
  { id: 'USD', label: 'US Dollar', symbol: '$', icon: DollarSign },
  { id: 'EUR', label: 'Euro', symbol: '€', icon: Euro },
  { id: 'GBP', label: 'British Pound', symbol: '£', icon: PoundSterling },
  { id: 'JPY', label: 'Japanese Yen', symbol: '¥', icon: Coins },
];

export default function CurrencyStep({ profile, onProfileChange }: OnboardingStepProps) {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {currencies.map((currency) => {
          const Icon = currency.icon;
          const isSelected = profile.currency === currency.id;

          return (
            <button
              key={currency.id}
              onClick={() => onProfileChange({ currency: currency.id })}
              className={cn(
                'group relative flex items-center gap-4 rounded-[2rem] border p-6 text-left transition-all duration-300',
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 shadow-glow-blue'
                  : 'border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/5',
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300',
                  isSelected
                    ? 'bg-blue-500 text-white shadow-glow'
                    : 'bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300',
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p
                  className={cn(
                    'text-sm font-black uppercase tracking-widest transition-colors',
                    isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white',
                  )}
                >
                  {currency.id}
                </p>
                <p className="text-[11px] font-bold text-slate-600 group-hover:text-slate-500 transition-colors">
                  {currency.label}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500 shadow-glow" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 pt-4">
        More currencies can be added in settings later.
      </p>
    </div>
  );
}
