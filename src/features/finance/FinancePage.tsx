import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Users } from 'lucide-react';
import { PageShell } from '@/components';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import type { Expense, ExpenseInput, ExpenseUpdate, SharedExpense } from '@/core/store/types';
import { useSeo } from '@/hooks/useSeo';
import { ExpenseForm } from './ExpenseForm';
import { cn } from '@/utils/cn';
import { TrajectoryForecast } from './components/TrajectoryForecast';
import { parseQuickCapture } from '@/lib/core/parserEngine';
import { dollarsToCentsSafe, getTopCategories, getWeeklyTrend } from '@/lib/core/financeEngine';
import { getFinanceItemTarget } from './financeNavigation';
import {
  useTotalBalance,
  useMonthlySpend,
  useTotalIncome,
  usePersonalExpenses,
  useSharedExpenseItems,
} from '@/core/store/selectors';

type DisplayedExpense = Pick<
  Expense,
  'id' | 'amount' | 'category' | 'createdAt' | 'linkedTaskId'
> & {
  description?: string;
  shared?: boolean;
  settlementStatus?: SharedExpense['settlementStatus'];
};

const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Rent',
  'Utilities',
  'Entertainment',
  'Health',
  'Personal',
  'Study',
  'Other',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Investment',
  'Bonus',
  'Freelance',
  'Gift',
  'Interest',
  'Dividend',
  'Rental',
  'Reimbursement',
];

export function FinancePage() {
  const navigate = useNavigate();
  useSeo({
    title: 'Money',
    description:
      'Take control of your finances. Track expenses, manage budgets, and handle shared costs with ease in a professional personal finance system.',
  });

  const currency = useSettings((s) => s.currency);
  const totalBalance = useTotalBalance();
  const monthlySpend = useMonthlySpend();
  const totalIncome = useTotalIncome();

  const personalExpenses = usePersonalExpenses();
  const sharedItems = useSharedExpenseItems();
  const expenses = useStore((s) => s.expenses);

  const topCategories = useMemo(() => getTopCategories(expenses, 3, new Date()), [expenses]);
  const weeklyTrend = useMemo(() => getWeeklyTrend(expenses, new Date()), [expenses]);

  const accounts = useStore((s) => s.accounts);
  const tasks = useStore((s) => s.tasks);
  const notes = useStore((s) => s.notes);
  const addExpense = useStore((s) => s.addExpense);
  const updateExpense = useStore((s) => s.updateExpense);

  const [viewShared, setViewShared] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isScanningViaDashboard, setIsScanningViaDashboard] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newTransactionType, setNewTransactionType] = useState<'expense' | 'income'>('expense');
  const [quickInput, setQuickInput] = useState('');

  const displayedExpenses = useMemo<DisplayedExpense[]>(() => {
    if (viewShared) {
      return sharedItems
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(
          (s): DisplayedExpense => ({
            id: s.id,
            amount: s.totalAmount,
            category: 'Split',
            createdAt: s.createdAt,
            description: s.description,
            shared: true,
            settlementStatus: s.settlementStatus,
          }),
        );
    }

    return personalExpenses
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(
        (e): DisplayedExpense => ({
          ...e,
          description: e.note,
        }),
      );
  }, [viewShared, personalExpenses, sharedItems]);

  function groupByRecency<T extends { createdAt: string }>(items: T[]) {
    const today = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    const groups: { today: T[]; yesterday: T[]; earlier: T[] } = {
      today: [],
      yesterday: [],
      earlier: [],
    };
    items.forEach((item) => {
      const d = new Date(item.createdAt).toDateString();
      if (d === today) groups.today.push(item);
      else if (d === yesterday) groups.yesterday.push(item);
      else groups.earlier.push(item);
    });
    return groups;
  }

  const groups = useMemo(() => groupByRecency(displayedExpenses), [displayedExpenses]);

  const handleQuickAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!quickInput.trim()) return;
    try {
      if (accounts.length === 0) {
        throw new Error('Please create an account first.');
      }
      const parsed = parseQuickCapture(quickInput);
      await addExpense({
        amount: parsed.amount,
        category: parsed.category,
        type: parsed.type,
        accountId: accounts[0].id,
        note: parsed.note,
        tags: [],
        isRecurring: false,
        createdAt: new Date().toISOString(),
      });
      setQuickInput('');
    } catch (err) {
      // Error handled by UI feedback
      alert(err instanceof Error ? err.message : 'Failed to add expense');
    }
  };

  return (
    <PageShell
      eyebrow="Money"
      title="Finance"
      description="Large balance first, fast actions second, and lightweight insight always in context."
    >
      <div className="space-y-6 pb-36 lg:pb-8">
        <section className="relative overflow-hidden titan-section glass-panel p-6 sm:p-10 md:p-14 border-white/5 group">
          <div className="relative z-10 flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400/60">
              Total Liquidity
            </p>
            <h1 className="titan-metric mt-6 text-white text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight text-center">
              {formatMoney(totalBalance, currency)}
            </h1>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-md">
              <div className="flex flex-col items-center border-r border-white/5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Monthly Income
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-400/90">
                  {formatMoney(totalIncome, currency)}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Monthly Spend
                </p>
                <p className="mt-1 text-xl font-bold text-blue-400/90">
                  {formatMoney(monthlySpend, currency)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button
            className="flex items-center justify-center gap-2 h-14 rounded-xl bg-blue-600 text-white font-bold active:scale-95 transition-all"
            onClick={() => {
              setEditingExpense(null);
              setNewTransactionType('expense');
              setIsExpenseFormOpen(true);
            }}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            <span className="text-sm">Expense</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 h-14 rounded-xl bg-emerald-600/90 text-white font-bold active:scale-95 transition-all"
            onClick={() => {
              setEditingExpense(null);
              setNewTransactionType('income');
              setIsExpenseFormOpen(true);
            }}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            <span className="text-sm">Income</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 h-14 rounded-xl glass-panel text-slate-300 font-bold hover:bg-white/5 active:scale-95 transition-all border-white/5"
            onClick={() => {
              setEditingExpense(null);
              setIsScanningViaDashboard(true);
              setIsExpenseFormOpen(true);
            }}
          >
            <Search className="h-5 w-5" />
            <span className="text-sm">Scan</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 h-14 rounded-xl glass-panel text-slate-300 font-bold hover:bg-white/5 active:scale-95 transition-all border-white/5"
            onClick={() => {
              void navigate('/split');
            }}
          >
            <Users className="h-5 w-5" />
            <span className="text-sm">Split</span>
          </button>
        </section>

        <TrajectoryForecast />

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-[2rem] glass-panel p-7 border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Top Categories
            </p>
            <ul className="mt-6 space-y-4">
              {topCategories.map((t) => (
                <li key={t.category} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-300">{t.category}</span>
                  <span className="text-sm font-black text-white">
                    {formatMoney(t.amount, currency)}
                  </span>
                </li>
              ))}
              {topCategories.length === 0 && (
                <li className="text-xs text-slate-600 font-bold uppercase tracking-widest text-center py-4">
                  No data yet
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-[2rem] glass-panel p-7 border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Weekly Performance
            </p>
            <div className="mt-6 flex items-end gap-3 h-20">
              {weeklyTrend.map((d) => (
                <div key={d.day} className="flex-1 group">
                  <div className="h-full flex items-end">
                    <div
                      style={{ height: `${Math.max(10, Math.min(100, (d.amount / 1000) * 100))}%` }}
                      className="w-full rounded-full bg-blue-500/20 group-hover:bg-blue-500/40 transition-all duration-300 border border-blue-500/10 shadow-glow"
                    />
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-tighter text-slate-600 text-center mt-2 group-hover:text-blue-400 transition-colors">
                    {d.day.slice(0, 1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
          <div className="inline-flex items-center p-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-xl self-start sm:self-auto">
            <button
              onClick={() => setViewShared(false)}
              className={cn(
                'relative z-10 px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-500 min-h-[36px]',
                !viewShared ? 'text-white' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {!viewShared && (
                <motion.div
                  layoutId="finance-toggle"
                  className="absolute inset-0 bg-blue-600 shadow-glow-blue rounded-full -z-10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
              Personal
            </button>
            <button
              onClick={() => setViewShared(true)}
              className={cn(
                'relative z-10 px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-500 min-h-[36px]',
                viewShared ? 'text-white' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {viewShared && (
                <motion.div
                  layoutId="finance-toggle"
                  className="absolute inset-0 bg-blue-600 shadow-glow-blue rounded-full -z-10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
              Shared
            </button>
          </div>

          <div className="relative w-full sm:w-64 group">
            <input
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleQuickAdd();
                }
              }}
              placeholder="Quick add: 'Swiggy ₹250'"
              className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-2.5 text-xs font-medium text-white placeholder:text-slate-600 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        <section className="space-y-6">
          {(['today', 'yesterday', 'earlier'] as const).map((sectionKey) => {
            const items = groups[sectionKey];
            return (
              <div key={sectionKey}>
                <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-2">
                  {sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}
                </h4>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-20">
                    <img src="/icons/falcon.png" alt="Falcon" className="h-12 w-12 grayscale" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest">
                      No entries
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {items.map((it) => (
                      <button
                        key={it.id}
                        onClick={() => {
                          const target = getFinanceItemTarget(it);
                          if (target) {
                            void navigate(target);
                          } else {
                            const expense = personalExpenses.find((e) => e.id === it.id);
                            if (expense) {
                              setEditingExpense(expense);
                              setIsExpenseFormOpen(true);
                            }
                          }
                        }}
                        className="glass-panel group flex w-full items-center justify-between rounded-2xl p-5 transition-all hover:bg-white/5 border-white/5 active:scale-[0.99]"
                      >
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-bold text-white truncate tracking-tight">
                              {it.description || it.category}
                            </div>
                            {it.shared && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[8px] uppercase tracking-widest text-blue-400 font-bold border border-blue-500/10">
                                SPLIT
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-60">
                            {it.description ? it.category : 'General'}
                            {it.linkedTaskId ? ' • Linked to Task' : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={cn(
                              'text-xl font-bold tracking-tight',
                              it.amount < 0 ? 'text-emerald-400' : 'text-blue-400',
                            )}
                          >
                            {formatMoney(it.amount, currency)}
                          </div>
                          <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5 opacity-50">
                            {new Date(it.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <ExpenseForm
          open={isExpenseFormOpen}
          title={editingExpense ? 'Edit Transaction' : 'New Transaction'}
          submitLabel={editingExpense ? 'Save Changes' : 'Record Entry'}
          expenseCategories={EXPENSE_CATEGORIES}
          incomeCategories={INCOME_CATEGORIES}
          accounts={accounts}
          tasks={tasks}
          notes={notes}
          initialValues={editingExpense ?? undefined}
          initialType={editingExpense?.type ?? newTransactionType}
          autoTriggerScan={isScanningViaDashboard}
          onOpenChange={(nextOpen) => {
            setIsExpenseFormOpen(nextOpen);
            if (!nextOpen) {
              setEditingExpense(null);
              setIsScanningViaDashboard(false);
            }
          }}
          onSubmit={async (values) => {
            try {
              const payload: ExpenseInput & ExpenseUpdate = {
                amount: dollarsToCentsSafe(values.amountDollars),
                category: values.category,
                type: values.type,
                accountId: values.accountId,
                tags: values.tags,
                area: values.area,
                note: values.note,
                isRecurring: values.isRecurring,
                recurrenceRule: values.recurrenceRule,
                linkedTaskId: values.linkedTaskId,
                linkedNoteId: values.linkedNoteId,
                createdAt: new Date(`${values.date}T12:00:00`).toISOString(),
              };
              if (editingExpense) {
                await updateExpense(editingExpense.id, payload);
              } else {
                await addExpense(payload);
              }
              setIsExpenseFormOpen(false);
            } catch (err) {
              // Error handled by UI feedback
              alert(err instanceof Error ? err.message : 'Failed to save transaction');
            }
          }}
        />
      </div>
    </PageShell>
  );
}
