import { useState, useEffect, useMemo, useCallback, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  FileText,
  CreditCard,
  Settings,
  ArrowRight,
  CheckCircle2,
  History,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/core/store';
import { formatMoney } from '@/core/settings';
import { useSettings } from '@/core/settings';
import { cn } from '@/utils/cn';

interface CommandPaletteItem {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  action: () => void;
  type: 'action' | 'task' | 'note' | 'finance';
  subtitle?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();
  const tasks = useStore((state) => state.tasks);
  const notes = useStore((state) => state.notes);
  const expenses = useStore((state) => state.expenses);
  const { currency } = useSettings();

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const [semanticResults, setSemanticResults] = useState<CommandPaletteItem[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setSemanticResults((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      import('@/lib/core/semanticEngine')
        .then(async (m) => {
          const semRes = await m.semanticSearch(query, 3);
          const list: CommandPaletteItem[] = [];

          semRes.forEach((r) => {
            if (r.type === 'task') {
              const task = tasks.find((t) => t.id === r.entityId);
              if (task) {
                list.push({
                  id: `semantic-task-${task.id}`,
                  title: task.title,
                  icon: Sparkles,
                  action: () => {
                    void navigate('/tasks');
                  },
                  type: 'task',
                  subtitle: `AI Semantic Match (${Math.round(r.score * 100)}%) • ${task.status}`,
                });
              }
            } else {
              const note = notes.find((n) => n.id === r.entityId);
              if (note) {
                list.push({
                  id: `semantic-note-${note.id}`,
                  title: note.content.split('\n')[0] || 'Untitled Note',
                  icon: Sparkles,
                  action: () => {
                    void navigate('/notes');
                  },
                  type: 'note',
                  subtitle: `AI Semantic Match (${Math.round(r.score * 100)}%)`,
                });
              }
            }
          });
          setSemanticResults(list);
        })
        .catch((_err) => {
          // Semantic search is optional; fail silently
        });
    }, 250); // 250ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query, tasks, notes, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close, isOpen]);

  const results = useMemo<CommandPaletteItem[]>(() => {
    if (!query.trim()) {
      return [
        {
          id: 'nav-tasks',
          title: 'Go to Tasks',
          icon: Calendar,
          action: () => {
            void navigate('/tasks');
          },
          type: 'action' as const,
        },
        {
          id: 'nav-notes',
          title: 'Go to Notes',
          icon: FileText,
          action: () => {
            void navigate('/notes');
          },
          type: 'action' as const,
        },
        {
          id: 'nav-finance',
          title: 'Go to Finance',
          icon: CreditCard,
          action: () => {
            void navigate('/finance');
          },
          type: 'action' as const,
        },
        {
          id: 'nav-intelligence',
          title: 'Go to Intelligence',
          icon: Sparkles,
          action: () => {
            void navigate('/intelligence');
          },
          type: 'action' as const,
        },
        {
          id: 'nav-settings',
          title: 'Settings',
          icon: Settings,
          action: () => {
            void navigate('/settings');
          },
          type: 'action' as const,
        },
      ];
    }

    const lowQuery = query.toLowerCase();
    const list: CommandPaletteItem[] = [];

    // Search Tasks
    tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(lowQuery) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(lowQuery))),
      )
      .slice(0, 5)
      .forEach((t) => {
        list.push({
          id: `task-${t.id}`,
          title: t.title,
          icon: CheckCircle2,
          action: () => {
            void navigate('/tasks');
          },
          type: 'task',
          subtitle: t.status,
        });
      });

    // Search Notes
    notes
      .filter(
        (n) =>
          n.content.toLowerCase().includes(lowQuery) ||
          (n.tags && n.tags.some((tag) => tag.toLowerCase().includes(lowQuery))),
      )
      .slice(0, 5)
      .forEach((n) => {
        list.push({
          id: `note-${n.id}`,
          title: n.content.split('\n')[0] || 'Untitled Note',
          icon: FileText,
          action: () => {
            void navigate('/notes');
          },
          type: 'note',
        });
      });

    // Search Expenses
    expenses
      .filter(
        (e) =>
          e.category.toLowerCase().includes(lowQuery) ||
          (e.note && e.note.toLowerCase().includes(lowQuery)) ||
          (e.tags && e.tags.some((tag) => tag.toLowerCase().includes(lowQuery))),
      )
      .slice(0, 5)
      .forEach((e) => {
        list.push({
          id: `expense-${e.id}`,
          title: `${e.category}: ${formatMoney(e.amount, currency)}`,
          icon: History,
          action: () => {
            void navigate('/finance');
          },
          type: 'finance',
        });
      });

    return list;
  }, [query, tasks, notes, expenses, currency, navigate]);

  const combinedResults = useMemo<CommandPaletteItem[]>(() => {
    const standard = results;
    const standardEntityIds = new Set(
      standard.map((item) => item.id.replace(/^(task-|note-|finance-)/, '')),
    );
    const filteredSemantic = semanticResults.filter((item) => {
      const entityId = item.id.replace('semantic-task-', '').replace('semantic-note-', '');
      return !standardEntityIds.has(entityId);
    });
    return [...standard, ...filteredSemantic];
  }, [results, semanticResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (combinedResults.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % combinedResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + combinedResults.length) % combinedResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedResults[selectedIndex]) {
        combinedResults[selectedIndex].action();
        close();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[15vh] px-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="glass-panel w-full max-w-2xl overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10 animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-white/5 px-8 py-6">
          <Search className="h-6 w-6 text-slate-500" />
          <input
            autoFocus
            placeholder="Search tasks, notes, or run commands..."
            className="flex-1 bg-transparent text-xl font-medium text-white outline-none placeholder:text-slate-600"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 shadow-inner">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              ESC
            </span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {combinedResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {combinedResults.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      close();
                    }}
                    className={cn(
                      'flex w-full items-center gap-5 rounded-3xl px-5 py-4 text-left transition-all duration-300',
                      isSelected
                        ? 'bg-blue-600 text-white shadow-glow-blue scale-[1.02]'
                        : 'hover:bg-white/5',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300',
                        isSelected
                          ? 'bg-white/20 border-white/20'
                          : 'bg-white/5 border-white/5 text-slate-500',
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-black tracking-tight truncate">{item.title}</p>
                        {isSelected && <ArrowRight className="h-5 w-5 opacity-70" />}
                      </div>
                      {item.subtitle && (
                        <p
                          className={cn(
                            'text-[10px] uppercase tracking-[0.2em] font-black mt-0.5',
                            isSelected ? 'text-white/70' : 'text-slate-600',
                          )}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border',
                        isSelected
                          ? 'bg-white/20 border-white/10 text-white'
                          : 'bg-white/5 border-white/5 text-slate-600',
                      )}
                    >
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-white/5 px-8 py-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-white border border-white/5 shadow-inner">
                ↑↓
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Navigate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-white border border-white/5 shadow-inner">
                ENTER
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Select
              </span>
            </div>
          </div>
          <p className="text-[10px] font-black text-blue-400 tracking-[0.3em] uppercase">
            Titan Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
