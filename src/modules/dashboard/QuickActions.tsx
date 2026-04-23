import { useState, useRef, KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Landmark, NotebookPen, Plus, SquareCheckBig, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/core/store';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = 'task' | 'note' | 'expense' | null;

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

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
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-md sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={onClose}
        >
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            className="ui-surface w-full max-w-lg rounded-t-3xl border border-border/70 bg-card p-5 pb-8 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border/60 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-secondary"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Add Task Form ────────────────────────────────────────────────────────────

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
      setTimeout(onDone, 600);
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
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKey}
        placeholder="Task title…"
        className="w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        onClick={submit}
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

// ─── Add Note Form ────────────────────────────────────────────────────────────

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
      setTimeout(onDone, 600);
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
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your note…"
        className="w-full resize-none rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <Button
        id="qa-note-submit"
        variant="primary"
        className="w-full"
        onClick={submit}
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

// ─── Add Expense Form ─────────────────────────────────────────────────────────

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
      setTimeout(onDone, 600);
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
        onClick={submit}
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

// ─── Action Button ────────────────────────────────────────────────────────────

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
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
      onClick={onClick}
      className={cn(
        'flex h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-semibold transition-colors',
        active
          ? 'border-primary/50 bg-primary/15 text-primary'
          : 'border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/30 hover:bg-secondary/70 hover:text-foreground',
      )}
      aria-label={`Add ${label}`}
      aria-pressed={active}
    >
      <Icon className="h-5 w-5" />
      {label}
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const sheetConfig: Record<
  Exclude<ActionType, null>,
  { title: string; description: string }
> = {
  task: { title: 'New Task', description: 'Add a task and optional due date' },
  note: { title: 'New Note', description: 'Jot something down instantly' },
  expense: { title: 'Log Expense', description: 'Record a spend with category' },
};

export function QuickActions() {
  const navigate = useNavigate();
  const [active, setActive] = useState<ActionType>(null);

  const toggle = (type: ActionType) => setActive((prev) => (prev === type ? null : type));
  const close = () => setActive(null);

  const handleDone = (type: Exclude<ActionType, null>) => {
    close();
    // Navigate to relevant page after a brief delay so user sees confirmation
    setTimeout(() => navigate(`/${type === 'expense' ? 'finance' : type + 's'}`), 900);
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

      {/* Bottom sheets for each action */}
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
