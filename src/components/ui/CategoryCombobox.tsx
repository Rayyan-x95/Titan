import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Tag } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CategoryComboboxProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function CategoryCombobox({
  value,
  options,
  onChange,
  placeholder = 'e.g. Food',
  id,
}: CategoryComboboxProps) {
  const reactId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const baseId = id ?? `category-combobox-${reactId}`;
  const listboxId = `${baseId}-listbox`;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const trimmedQuery = query.trim();
  const filtered = trimmedQuery
    ? options.filter((option) => option.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : options;
  const canCreateNew = trimmedQuery.length > 0 && !options.some((option) => option.toLowerCase() === trimmedQuery.toLowerCase());
  const maxIndex = canCreateNew ? filtered.length : filtered.length - 1;
  const showDropdown = open && (filtered.length > 0 || canCreateNew);
  const activeDescendantId = open && activeIndex >= 0 && (activeIndex < filtered.length ? filtered[activeIndex] : true)
    ? `${listboxId}-option-${activeIndex}`
    : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  const commit = (category: string) => {
    onChange(category);
    setQuery(category);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setQuery(next);
    onChange(next);
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(maxIndex, current + 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (event.key === 'Enter') {
      if (open && activeIndex >= 0) {
        event.preventDefault();
        if (activeIndex < filtered.length) {
          commit(filtered[activeIndex]);
        } else if (canCreateNew) {
          commit(trimmedQuery);
        }
        return;
      }

      if (open && canCreateNew && activeIndex === -1) {
        event.preventDefault();
        commit(trimmedQuery);
      }
    }
  };

  const triggerContent = (
    <>
      <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-activedescendant={activeDescendantId}
        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Toggle category list"
        onClick={() => {
          setOpen((current) => !current);
          inputRef.current?.focus();
        }}
        className="text-muted-foreground transition-transform duration-200"
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
      </button>
    </>
  );

  return (
    <div ref={rootRef} className="relative">
      {open ? (
        <div
          className={cn(
            'flex h-12 w-full items-center gap-2 rounded-2xl border bg-background px-4 transition-colors',
            'border-primary ring-2 ring-primary/20',
          )}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-label="Category"
        >
          {triggerContent}
        </div>
      ) : (
        <div
          className={cn(
            'flex h-12 w-full items-center gap-2 rounded-2xl border bg-background px-4 transition-colors',
            'border-border',
          )}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls={listboxId}
          aria-label="Category"
        >
          {triggerContent}
        </div>
      )}

      <AnimatePresence>
        {showDropdown && (
          <div id={listboxId} role="listbox" aria-label="Category suggestions" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50">
            <motion.div
              ref={listRef}
              initial={{ opacity: 0, scale: 0.97, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
              className="ui-surface overflow-hidden rounded-xl border border-border/60 p-1 shadow-2xl"
            >
              {filtered.map((category, index) => {
                const isSelected = category === value;
                const isActive = index === activeIndex;
                const optionId = `${listboxId}-option-${index}`;

                if (isSelected) {
                  return (
                    <div
                      key={category}
                      id={optionId}
                      role="option"
                      aria-selected="true"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => commit(category)}
                      className={cn(
                        'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        isActive || isSelected
                          ? 'bg-primary/12 text-primary'
                          : 'text-foreground hover:bg-secondary/60',
                      )}
                    >
                      <span>{category}</span>
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    </div>
                  );
                }

                return (
                  <div
                    key={category}
                    id={optionId}
                    role="option"
                    aria-selected="false"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(category)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isActive || isSelected
                        ? 'bg-primary/12 text-primary'
                        : 'text-foreground hover:bg-secondary/60',
                    )}
                  >
                    <span>{category}</span>
                  </div>
                );
              })}

              {canCreateNew && (
                <div
                  role="option"
                  aria-selected="false"
                  onClick={() => commit(trimmedQuery)}
                  className="mt-0.5 flex w-full cursor-pointer items-center gap-2 rounded-lg border-t border-border/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                >
                  <span className="text-primary">+</span>
                  Use &ldquo;{trimmedQuery}&rdquo; as new category
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}