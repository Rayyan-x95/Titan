import { useState, useEffect, useMemo, useCallback, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, FileText, CreditCard, Settings, ArrowRight, CheckCircle2, History } from 'lucide-react';
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
        { id: 'nav-tasks', title: 'Go to Tasks', icon: Calendar, action: () => navigate('/tasks'), type: 'action' as const },
        { id: 'nav-notes', title: 'Go to Notes', icon: FileText, action: () => navigate('/notes'), type: 'action' as const },
        { id: 'nav-finance', title: 'Go to Finance', icon: CreditCard, action: () => navigate('/finance'), type: 'action' as const },
        { id: 'nav-settings', title: 'Settings', icon: Settings, action: () => navigate('/settings'), type: 'action' as const },
      ];
    }

    const lowQuery = query.toLowerCase();
    const list: CommandPaletteItem[] = [];

    // Search Tasks
    tasks.filter(t => t.title.toLowerCase().includes(lowQuery)).slice(0, 3).forEach(t => {
      list.push({ id: `task-${t.id}`, title: t.title, icon: CheckCircle2, action: () => navigate('/tasks'), type: 'task', subtitle: t.status });
    });

    // Search Notes
    notes.filter(n => n.content.toLowerCase().includes(lowQuery)).slice(0, 3).forEach(n => {
      list.push({ id: `note-${n.id}`, title: n.content.split('\n')[0] || 'Untitled Note', icon: FileText, action: () => navigate('/notes'), type: 'note' });
    });

    // Search Expenses
    expenses.filter(e => e.category.toLowerCase().includes(lowQuery)).slice(0, 2).forEach(e => {
      list.push({ id: `expense-${e.id}`, title: `${e.category}: ${formatMoney(e.amount, currency)}`, icon: History, action: () => navigate('/finance'), type: 'finance' });
    });

    return list;
  }, [query, tasks, notes, expenses, currency, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
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
        className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Search tasks, notes, or run commands..."
            className="flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground/60"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
            <span className="text-[10px] font-bold text-muted-foreground">ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); close(); }}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all",
                      isSelected ? "bg-primary text-primary-foreground shadow-glow" : "hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      isSelected ? "bg-white/20" : "bg-secondary"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold tracking-tight truncate">{item.title}</p>
                        {isSelected && <ArrowRight className="h-4 w-4 opacity-70" />}
                      </div>
                      {item.subtitle && (
                        <p className={cn("text-[10px] uppercase tracking-widest font-bold", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                      isSelected ? "bg-white/20" : "bg-secondary text-muted-foreground"
                    )}>
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-white/5 px-6 py-3">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold">↑↓</span>
              <span className="text-[10px] text-muted-foreground">Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold">ENTER</span>
              <span className="text-[10px] text-muted-foreground">Select</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-primary tracking-wider uppercase">Titan Search</p>
        </div>
      </div>
    </div>
  );
}
