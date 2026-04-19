import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  /** Highlight these date strings (YYYY-MM-DD) with a dot indicator */
  markedDates?: string[];
  className?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function Calendar({ value, onChange, markedDates = [], className }: CalendarProps) {
  const [cursor, setCursor] = useState<Date>(() => {
    const base = value ? new Date(value) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const { year, month, firstDay, daysInMonth, prevDaysInMonth } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDaysInMonth = new Date(year, month, 0).getDate();
    return { year, month, firstDay, daysInMonth, prevDaysInMonth };
  }, [cursor]);

  const todayStr = toYMD(new Date());
  const selectedStr = value ? toYMD(value) : '';
  const markedSet = new Set(markedDates);

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDaysInMonth - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  return (
    <div className={cn('w-[280px] select-none rounded-3xl border border-border bg-card p-4 shadow-glass', className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setCursor(new Date())}
          aria-label={`Current month: ${cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
          className="flex-1 text-center text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          {cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </button>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAYS_OF_WEEK.map((d) => (
          <span key={d} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {d}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, idx) => {
          const offsetMonth = idx < firstDay - 1 ? month - 1 : idx >= firstDay - 1 + daysInMonth ? month + 1 : month;
          const cellDate = new Date(year, offsetMonth, cell.day, 12);
          const dateStr = cell.current
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
            : '';
          const isSelected = cell.current && dateStr === selectedStr;
          const isToday = cell.current && dateStr === todayStr;
          const isMarked = cell.current && markedSet.has(dateStr);
          const ariaLabel = cellDate.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          return (
            <div key={idx} className="relative flex flex-col items-center">
              <button
                type="button"
                disabled={!cell.current}
                onClick={() => cell.current && onChange?.(new Date(year, month, cell.day, 12))}
                aria-label={`${ariaLabel}${isSelected ? ', selected' : ''}`}
                className={cn(
                  'h-8 w-8 rounded-full text-sm transition-all duration-150',
                  !cell.current && 'pointer-events-none text-muted-foreground/25',
                  cell.current && !isSelected && !isToday && 'text-foreground hover:bg-secondary',
                  isToday && !isSelected && 'font-bold text-primary ring-1 ring-primary/50',
                  isSelected && 'bg-primary font-bold text-primary-foreground shadow-glow scale-110',
                )}
              >
                {cell.day}
              </button>
              {isMarked && !isSelected && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary/70" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
