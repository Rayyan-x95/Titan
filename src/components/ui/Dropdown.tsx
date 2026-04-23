import { useEffect, useMemo, useRef, useState, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DropdownOption<T extends string> {
  label: string;
  value: T;
}

interface DropdownProps<T extends string> {
  label: string;
  value: T;
  options: Array<DropdownOption<T>>;
  onChange: (value: T) => void;
  className?: string;
}

export function Dropdown<T extends string>({ label, value, options, onChange, className }: DropdownProps<T>) {
  const reactId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: PointerEvent) => {
      const root = rootRef.current;

      if (!root) {
        return;
      }

      if (!root.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setOpen(false);
      buttonRef.current?.focus();
    };

    window.addEventListener('pointerdown', handlePointer);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointer);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    const index = Math.max(0, options.findIndex((option) => option.value === value));
    setActiveIndex(index);
  }, [options, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const target = itemRefs.current[activeIndex] ?? itemRefs.current[0];
    target?.focus();
  }, [activeIndex, open]);

  const menuId = `dropdown-${reactId}-menu`;

  const focusItem = (index: number) => {
    const bounded = Math.max(0, Math.min(options.length - 1, index));
    setActiveIndex(bounded);
    itemRefs.current[bounded]?.focus();
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {open ? (
        <button
          ref={buttonRef}
          type="button"
          className="ui-button ui-button-secondary h-12 w-full min-w-44 flex items-center justify-between rounded-xl px-4"
          aria-haspopup="menu"
          aria-expanded="true"
          aria-controls={menuId}
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setTimeout(() => {
                focusItem(activeIndex);
              }, 0);
            }
          }}
        >
          <span className="flex flex-col items-start text-left">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
            <span className="text-sm font-semibold text-foreground">{selected?.label ?? ''}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 rotate-180" />
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          className="ui-button ui-button-secondary h-12 w-full min-w-44 flex items-center justify-between rounded-xl px-4"
          aria-haspopup="menu"
          aria-expanded="false"
          onClick={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setOpen(true);
              setTimeout(() => {
                focusItem(activeIndex);
              }, 0);
            }
          }}
        >
          <span className="flex flex-col items-start text-left">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
            <span className="text-sm font-semibold text-foreground">{selected?.label ?? ''}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
        </button>
      )}

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
            className="ui-surface absolute right-0 top-[calc(100%+0.5rem)] z-40 min-w-44 overflow-hidden rounded-xl border border-border/70 p-1 shadow-2xl"
            aria-label={label}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                focusItem(activeIndex + 1);
              }

              if (event.key === 'ArrowUp') {
                event.preventDefault();
                focusItem(activeIndex - 1);
              }

              if (event.key === 'Home') {
                event.preventDefault();
                focusItem(0);
              }

              if (event.key === 'End') {
                event.preventDefault();
                focusItem(options.length - 1);
              }

              if (event.key === 'Enter') {
                event.preventDefault();
                const option = options[activeIndex];

                if (option) {
                  onChange(option.value);
                  setOpen(false);
                  buttonRef.current?.focus();
                }
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                buttonRef.current?.focus();
              }

              if (event.key === 'Tab') {
                event.preventDefault();
                if (event.shiftKey) {
                  focusItem(activeIndex - 1);
                } else {
                  focusItem(activeIndex + 1);
                }
              }
            }}
          >
            <ul role="menu" aria-label={label} className="m-0 list-none p-0">
              {options.map((option, index) => {
                const isSelected = option.value === value;

                return (
                  <li key={option.value} role="none">
                    {isSelected ? (
                      <button
                        ref={(element) => {
                          itemRefs.current[index] = element;
                        }}
                        type="button"
                        role="menuitemradio"
                        aria-checked="true"
                        tabIndex={activeIndex === index ? 0 : -1}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                          'bg-primary/15 text-primary',
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                          buttonRef.current?.focus();
                        }}
                      >
                        {option.label}
                      </button>
                    ) : (
                      <button
                        ref={(element) => {
                          itemRefs.current[index] = element;
                        }}
                        type="button"
                        role="menuitemradio"
                        aria-checked="false"
                        tabIndex={activeIndex === index ? 0 : -1}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                          activeIndex === index ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary/70',
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                          buttonRef.current?.focus();
                        }}
                      >
                        {option.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
