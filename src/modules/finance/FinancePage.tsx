import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Target, PieChart, Calendar as CalendarIcon,
  TrendingUp, CreditCard, Wallet, Landmark,
  ArrowUpRight, ArrowDownRight, Search, Filter, Upload, Users
} from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import type { Expense, Budget, BudgetInput, Account, Task, Note } from '@/core/store/types';
import { useSeo } from '@/seo';
import { ExpenseForm, type ExpenseFormValues } from './ExpenseForm';
import { ExpenseItem } from './ExpenseItem';
import { cn } from '@/utils/cn';
import { parseQuickCapture } from '@/lib/core/parserEngine';
import { SmartInput } from '@/components/ParseConfirmation';
import { SplitPage } from '../split/SplitPage';
import { BudgetDialog } from './BudgetDialog';

type FinanceTab = 'today' | 'week' | 'month' | 'split';

export function FinancePage() {
  useSeo({
    title: 'Finance',
    description: 'Monitor spending and financial activity with Titan finance tracking.',
    path: '/finance',
  });

  const { 
    expenses, budgets, accounts, tasks, notes, hydrated,
    addExpense, updateExpense, deleteExpense, 
    addBudget, deleteBudget, processRecurringTransactions 
  } = useStore();
  
  const { currency } = useSettings();

  const [activeTab, setActiveTab] = useState<FinanceTab>('month');
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (hydrated) {
      processRecurringTransactions();
    }
  }, [hydrated, processRecurringTransactions]);

  const totalBalance = useMemo(() => 
    accounts.reduce((sum, acc) => sum + acc.balance, 0),
  [accounts]);

  const monthlySpend = useMemo(() => {
    const now = new Date();
    return expenses
      .filter(e => {
        const d = new Date(e.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.type === 'expense';
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return expenses.filter(e => {
      const date = new Date(e.createdAt);
      
      // Time Filter
      if (activeTab === 'today') {
        if (date.toDateString() !== now.toDateString()) return false;
      } else if (activeTab === 'week') {
        if (date < startOfWeek) return false;
      }
      
      // Type Filter
      if (filterType !== 'all' && e.type !== filterType) return false;
      
      // Search Filter
      if (searchQuery && !e.category.toLowerCase().includes(searchQuery.toLowerCase()) && !e.note?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [expenses, activeTab, filterType, searchQuery]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.filter(e => e.type === 'expense').forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    filteredExpenses.forEach(e => {
      const date = new Date(e.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(e);
    });
    return Object.entries(groups);
  }, [filteredExpenses]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    
    if (accounts.length === 0) {
      window.alert('Please create an account first.');
      return;
    }

    const parsed = parseQuickCapture(quickInput);
    await addExpense({
      amount: parsed.amount,
      category: parsed.category,
      type: parsed.type,
      accountId: accounts[0].id,
      note: parsed.note,
    });
    setQuickInput('');
    const today = new Date().toISOString().split('T')[0];
    await useStore.getState().updateSnapshot(today, 'expense', parsed.amount);
  };

  const handleSaveExpense = async (values: ExpenseFormValues) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, {
        ...values,
        amount: Math.round(values.amountDollars * 100),
      });
    } else {
      const created = await addExpense(values);
      const today = new Date().toISOString().split('T')[0];
      await useStore.getState().updateSnapshot(today, 'expense', created.amount);
    }
  };

  return (
    <PageShell
      title="Finance"
      description="Track every coin, set boundaries, and understand your financial flow."
    >
      {/* ── Balance Overview ────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-card/40 p-10 shadow-glass backdrop-blur-xl"
        >
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-accent/5 blur-[60px]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/80">Combined Balance</p>
            </div>
            <h2 className="mt-4 text-7xl font-black tracking-tighter text-foreground selection:bg-primary/30">
              {formatMoney(totalBalance, currency)}
            </h2>
            <div className="mt-10 flex flex-wrap gap-4">
              <div className="group flex items-center gap-4 rounded-2xl bg-emerald-500/10 px-6 py-3 border border-emerald-500/20 transition-all hover:bg-emerald-500/15">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Monthly Spend</p>
                  <p className="text-xl font-bold text-emerald-400 group-hover:scale-105 transition-transform origin-left">{formatMoney(monthlySpend, currency)}</p>
                </div>
                <div className="h-8 w-px bg-emerald-500/20" />
                <div className="flex items-center gap-1.5">
                   <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                   <span className="text-sm font-black text-emerald-500">12%</span>
                </div>
              </div>
              <Button variant="secondary" className="rounded-2xl h-auto py-3 px-6 border-border/50 bg-secondary/40 backdrop-blur-md">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Analysis</span>
              </Button>
            </div>
          </div>
        </motion.article>

        <motion.article 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/70 ml-2">Accounts</p>
           <div className="grid grid-cols-1 gap-3">
             {accounts.map((acc, i) => (
               <motion.div 
                 key={acc.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 whileHover={{ x: 4 }}
                 className="flex items-center justify-between rounded-[1.5rem] border border-border/50 bg-card/30 p-5 hover:border-primary/30 transition-all hover:bg-card/50 group"
               >
                 <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {acc.id === 'cash' ? <Wallet className="h-5 w-5" /> : acc.id === 'bank' ? <Landmark className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">{acc.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Primary Account</p>
                    </div>
                 </div>
                 <p className="text-base font-black tracking-tight">{formatMoney(acc.balance, currency)}</p>
               </motion.div>
             ))}
           </div>
        </motion.article>
      </section>

      {/* ── Budget & Insights ───────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                 <Target className="h-5 w-5" />
               </div>
               <div>
                 <h3 className="font-bold tracking-tight text-foreground">Active Budgets</h3>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Spending Goals</p>
               </div>
             </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsBudgetDialogOpen(true)}
                className="h-8 rounded-lg text-[10px] uppercase font-bold tracking-widest hover:bg-secondary"
              >
                Manage
              </Button>

          </div>
          <div className="grid grid-cols-1 gap-4">
             {budgets.slice(0, 3).map(b => {
               const spent = expenses
                 .filter(e => e.category === b.category && e.type === 'expense')
                 .reduce((sum, e) => sum + e.amount, 0);
               const percent = Math.min((spent / b.limit) * 100, 100);
               const isCritical = percent > 85;

               return (
                 <div key={b.id} className="group rounded-[1.75rem] border border-border/50 bg-card/30 p-5 transition-all hover:border-primary/20 hover:bg-card/40">
                    <div className="flex justify-between items-end mb-4">
                       <div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">{b.category}</span>
                         <p className="text-sm font-bold text-foreground mt-0.5">{formatMoney(spent, currency)} spent</p>
                       </div>
                       <span className={cn(
                         "text-[10px] font-bold px-2 py-0.5 rounded-md",
                         isCritical ? "bg-rose-500/10 text-rose-500" : "bg-secondary text-muted-foreground"
                       )}>
                         {percent.toFixed(0)}%
                       </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full transition-colors", 
                          isCritical ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "bg-primary shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                        )}
                       />
                    </div>
                 </div>
               );
             })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 px-2">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
               <PieChart className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-bold tracking-tight text-foreground">Spending Insights</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Category Mix</p>
             </div>
          </div>
          <div className="rounded-[2.5rem] border border-border/50 bg-card/20 p-8 space-y-6 backdrop-blur-sm">
             {categoryBreakdown.slice(0, 4).map(([cat, amt]) => {
               const percent = monthlySpend > 0 ? (amt / monthlySpend) * 100 : 0;

               return (
                 <div key={cat} className="space-y-2.5">
                   <div className="flex justify-between items-end">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">{cat}</span>
                     <span className="text-xs font-bold text-foreground">{percent.toFixed(0)}%</span>
                   </div>
                   <div className="h-1.5 w-full rounded-full bg-secondary/40">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${percent}%` }}
                       transition={{ duration: 0.8, ease: "easeOut" }}
                       className="h-full rounded-full bg-accent shadow-[0_0_8px_rgba(168,85,247,0.3)]" 
                     />
                   </div>
                 </div>
               );
             })}
             {categoryBreakdown.length === 0 && (
               <div className="py-10 text-center">
                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No Spending Data</p>
               </div>
             )}
          </div>
        </motion.div>
      </section>

      {/* ── Transaction List ────────────────────────────────────────────── */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex rounded-xl bg-secondary/50 p-1">
                 {(['today', 'week', 'month', 'split'] as const).map(tab => (
                   <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                   >
                     {tab}
                   </button>
                 ))}
              </div>
              <div className="h-8 w-px bg-border/50 hidden sm:block" />
              <div className="flex gap-1">
                 <Button 
                  variant={filterType === 'expense' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setFilterType(t => t === 'expense' ? 'all' : 'expense')}
                  className="h-8 px-3 text-[10px] font-bold uppercase"
                 >
                   Expenses
                 </Button>
                 <Button 
                  variant={filterType === 'income' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setFilterType(t => t === 'income' ? 'all' : 'income')}
                  className="h-8 px-3 text-[10px] font-bold uppercase"
                 >
                   Income
                 </Button>
              </div>
           </div>
           <Button onClick={() => setIsExpenseFormOpen(true)} className="w-full sm:w-auto shadow-glow">
              <Plus className="h-4 w-4" />
              New Entry
           </Button>
        </div>

        {/* Quick Add Bar */}
        <form onSubmit={handleQuickAdd} className="relative group">
           <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
             <Search className="h-5 w-5" />
           </div>
           <input 
            type="text"
            placeholder={`Quick add: 'Swiggy ${currency === 'INR' ? '₹' : '$'}250' or 'Salary ${currency === 'INR' ? '₹' : '$'}5000'...`}
            className="h-14 w-full rounded-2xl border border-border/50 bg-card/30 pl-14 pr-24 text-sm font-medium outline-none focus:border-primary/50 focus:bg-card/50 transition-all placeholder:text-muted-foreground/50 shadow-inner"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
           />
           <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden md:block">Press Enter</span>
              <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                <ArrowDownRight className="h-4 w-4" />
              </Button>
           </div>
        </form>

        {/* Main List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + filterType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'split' ? (
              <SplitPage isEmbedded />
            ) : groupedExpenses.length === 0 ? (
              <article className="rounded-[2.5rem] border border-dashed border-border bg-card/20 p-16 text-center shadow-inner">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm font-bold text-foreground">No transactions found</p>
                <p className="mt-1 text-xs text-muted-foreground">Adjust filters or add a new transaction above.</p>
              </article>
            ) : (
              <div className="space-y-12">
                {groupedExpenses.map(([date, items]) => (
                  <div key={date} className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70 ml-2">
                      {date}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map(expense => (
                        <ExpenseItem
                          key={expense.id}
                          expense={expense}
                          account={accounts.find(a => a.id === expense.accountId)}
                          linkedTask={tasks.find(t => t.id === expense.linkedTaskId)}
                          linkedNote={notes.find(n => n.id === expense.linkedNoteId)}
                          onEdit={() => {
                            setEditingExpense(expense);
                            setIsExpenseFormOpen(true);
                          }}
                          onDelete={async () => {
                            await deleteExpense(expense.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ExpenseForm
        open={isExpenseFormOpen}
        title={editingExpense ? 'Edit Transaction' : 'New Transaction'}
        submitLabel={editingExpense ? 'Save Changes' : 'Record Entry'}
        categories={['Food', 'Travel', 'Study', 'Personal', 'Rent', 'Utilities', 'Entertainment', 'Salary', 'Investment']}
        accounts={accounts}
        tasks={tasks}
        notes={notes}
        initialValues={editingExpense ?? undefined}
        onOpenChange={(nextOpen) => {
          setIsExpenseFormOpen(nextOpen);
          if (!nextOpen) setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
      />

      <BudgetDialog 
        open={isBudgetDialogOpen}
        onOpenChange={setIsBudgetDialogOpen}
      />
    </PageShell>
  );
}
