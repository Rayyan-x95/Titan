import { useState, useRef, useEffect } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar } from './Calendar';
import { cn } from '@/utils/cn';

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  clearable?: boolean;
  markedDates?: string[];
  className?: string;
}

function parseToLocalDate(str: string): Date {
  // Parse YYYY-MM-DD safely without UTC shift
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

function formatDisplay(str: string): string {
  return parseToLocalDate(str).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select a date',
  label,
  ariaLabel,
  clearable = true,
  markedDates,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const hasValue = Boolean(value);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {/* Trigger */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'group flex h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border px-4 text-left text-sm transition-all duration-200',
            'bg-background/60 backdrop-blur-sm',
            open
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CalendarDays className={cn('h-4 w-4 shrink-0 transition-colors', hasValue ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
            <span className={cn('truncate', hasValue ? 'text-foreground' : 'text-muted-foreground')}>
              {hasValue ? formatDisplay(value!) : placeholder}
            </span>
          </div>
        </button>
        {hasValue && clearable && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Floating calendar */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+8px)] z-50"
          >
            {label && (
              <p className="mb-1.5 pl-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                {label}
              </p>
            )}
            <Calendar
              value={hasValue ? parseToLocalDate(value!) : undefined}
              markedDates={markedDates}
              onChange={(date) => {
                onChange(toYMD(date));
                setOpen(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
