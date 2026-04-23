import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface PremiumInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  size?: 'default' | 'large';
}

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(function PremiumInput(
  { label, error, prefix, suffix, size = 'default', className, id, ...props },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const errorId = `${inputId}-error`;
  const isLarge = size === 'large';

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'mb-2 block text-sm font-medium text-muted-foreground',
            isLarge && 'text-base mb-3',
          )}
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative flex items-center rounded-2xl border bg-background/50 backdrop-blur-sm transition-all duration-200',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
          isLarge ? 'h-16 px-5' : 'h-12 px-4',
          className,
        )}
      >
        {prefix && (
          <span className={cn('mr-2 text-muted-foreground', isLarge ? 'text-xl' : 'text-base')}>
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none',
            isLarge ? 'text-3xl font-semibold' : 'text-base',
          )}
          aria-describedby={error ? errorId : undefined}
          placeholder=" "
          {...props}
        />
        {suffix && (
          <span className={cn('ml-2 text-muted-foreground', isLarge ? 'text-lg' : 'text-sm')}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});
