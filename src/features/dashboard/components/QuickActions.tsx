import { useState, useRef, KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Landmark, NotebookPen, Plus, SquareCheckBig, X, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { useStore } from '@/core/store';
import { cn } from '@/utils/cn';

type ActionType = 'task' | 'note' | 'expense' | null;

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={onClose}
        >
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            className="glass-panel w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[2.5rem] p-8 pb-[calc(2rem+var(--safe-area-bottom))] shadow-2xl sm:rounded-[2.5rem] touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/20 active:bg-white/40 transition-colors sm:hidden" />
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="titan-metric text-2xl text-white">{title}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Quick Capture
                </p>
              </div>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-90"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative z-10">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AddTaskForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const addTask = useStore((s) => s.addTask);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await addTask({ title: title.trim(), status: 'todo', dueDate: dueDate || undefined });
      setSuccess(true);
      setTitle('');
      setDueDate('');
      setTimeout(() => setSuccess(false), 3000);
      onDone();
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void submit();
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        autoFocus
        id="qa-task-title"
        type="text"
        inputMode="text"
        enterKeyHint="done"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKey}
        placeholder="What needs to be done?"
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-base font-medium text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:shadow-glow-blue transition-all"
      />
      <input
        id="qa-task-due"
        type="date"
        aria-label="Task due date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <Button
        id="qa-task-submit"
        variant="primary"
        className="w-full"
        onClick={() => {
          void submit();
        }}
        disabled={!title.trim() || loading}
      >
        {success ? (
          <>
            <Check className="h-4 w-4" /> Task added!
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add Task
          </>
        )}
      </Button>
    </div>
  );
}

function AddNoteForm({ onDone }: { onDone: () => void }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const addNote = useStore((s) => s.addNote);

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await addNote({ content: content.trim(), tags: [] });
      setSuccess(true);
      setContent('');
      setTimeout(() => setSuccess(false), 3000);
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        autoFocus
        id="qa-note-content"
        rows={4}
        inputMode="text"
        enterKeyHint="enter"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your note…"
        className="w-full resize-none rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <Button
        id="qa-note-submit"
        variant="primary"
        className="w-full"
        onClick={() => {
          void submit();
        }}
        disabled={!content.trim() || loading}
      >
        {success ? (
          <>
            <Check className="h-4 w-4" /> Note saved!
          </>
        ) : (
          <>
            <NotebookPen className="h-4 w-4" /> Save Note
          </>
        )}
      </Button>
    </div>
  );
}

function AddExpenseForm({ onDone }: { onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const addExpense = useStore((s) => s.addExpense);

  const submit = async () => {
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
    setLoading(true);
    try {
      await addExpense({
        amountDollars: parsedAmount,
        category: category.trim() || 'Uncategorized',
      });
      setSuccess(true);
      setAmount('');
      setCategory('');
      setTimeout(() => setSuccess(false), 3000);
      onDone();
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void submit();
  };

  return (
    <div className="space-y-3">
      <input
        autoFocus
        id="qa-expense-amount"
        type="number"
        inputMode="decimal"
        enterKeyHint="next"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={onKey}
        placeholder="Amount (e.g. 500)"
        className="w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <input
        id="qa-expense-category"
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        onKeyDown={onKey}
        placeholder="Category (optional)"
        className="w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <Button
        id="qa-expense-submit"
        variant="primary"
        className="w-full"
        onClick={() => {
          void submit();
        }}
        disabled={!amount || Number.isNaN(parseFloat(amount)) || loading}
      >
        {success ? (
          <>
            <Check className="h-4 w-4" /> Expense added!
          </>
        ) : (
          <>
            <Landmark className="h-4 w-4" /> Log Expense
          </>
        )}
      </Button>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  Icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  id: string;
}

function ActionButton({ label, Icon, active, onClick, id }: ActionButtonProps) {
  return (
    <motion.button
      id={id}
      type="button"
      whileHover={{ scale: 1.05, translateY: -2 }}
      whileTap={{ scale: 0.92, rotate: -1 }}
      onClick={onClick}
      className={cn(
        'flex h-28 flex-col items-center justify-center gap-2 rounded-[2.5rem] border transition-all duration-300 active:bg-white/10',
        active
          ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-glow-blue'
          : 'glass-panel border-white/5 bg-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300',
      )}
      aria-label={`Add ${label}`}
      aria-pressed={active}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
          active ? 'bg-blue-500/20' : 'bg-white/5',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </motion.button>
  );
}

const sheetConfig: Record<Exclude<ActionType, null>, { title: string; description: string }> = {
  task: { title: 'New Task', description: 'Add a task and optional due date' },
  note: { title: 'New Note', description: 'Jot something down instantly' },
  expense: { title: 'Log Expense', description: 'Record a spend with category' },
};

export function QuickActions() {
  const [active, setActive] = useState<ActionType>(null);

  const toggle = (type: ActionType) => setActive((prev) => (prev === type ? null : type));
  const close = () => setActive(null);

  const handleDone = (_type: Exclude<ActionType, null>) => {
    close();
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <ActionButton
          id="qa-btn-task"
          label="Task"
          Icon={SquareCheckBig}
          active={active === 'task'}
          onClick={() => toggle('task')}
        />
        <ActionButton
          id="qa-btn-note"
          label="Note"
          Icon={NotebookPen}
          active={active === 'note'}
          onClick={() => toggle('note')}
        />
        <ActionButton
          id="qa-btn-expense"
          label="Expense"
          Icon={Landmark}
          active={active === 'expense'}
          onClick={() => toggle('expense')}
        />
      </div>

      {(['task', 'note', 'expense'] as const).map((type) => (
        <BottomSheet
          key={type}
          open={active === type}
          onClose={close}
          title={sheetConfig[type].title}
        >
          {type === 'task' && <AddTaskForm onDone={() => handleDone('task')} />}
          {type === 'note' && <AddNoteForm onDone={() => handleDone('note')} />}
          {type === 'expense' && <AddExpenseForm onDone={() => handleDone('expense')} />}
        </BottomSheet>
      ))}
    </>
  );
}
