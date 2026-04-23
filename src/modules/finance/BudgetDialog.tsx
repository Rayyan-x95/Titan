import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Target, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import { cn } from '@/utils/cn';

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetDialog({ open, onOpenChange }: BudgetDialogProps) {
  const { budgets, addBudget, deleteBudget } = useStore();
  const { currency } = useSettings();
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || !newLimit) return;

    await addBudget({
      category: newCategory,
      limit: parseFloat(newLimit) * 100,
      period,
    });

    setNewCategory('');
    setNewLimit('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Finance</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Manage Budgets</h3>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Add New Budget */}
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                <input 
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Food"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    {currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input 
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="0.00"
                    className="h-12 w-full rounded-xl border border-border bg-background pl-8 pr-4 text-sm font-bold outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
               <div className="flex rounded-xl bg-secondary/50 p-1">
                 {(['weekly', 'monthly'] as const).map(p => (
                   <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                   >
                     {p}
                   </button>
                 ))}
               </div>
               <Button type="submit" size="sm" className="px-6 rounded-xl shadow-glow">
                 <Plus className="h-4 w-4 mr-2" />
                 Add Budget
               </Button>
            </div>
          </form>

          {/* Budget List */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Active Goals</p>
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
              {budgets.map(budget => (
                <div 
                  key={budget.id}
                  className="flex items-center justify-between rounded-2xl border border-border/50 bg-secondary/10 p-4 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{budget.category}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{budget.period} limit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-black text-foreground">{formatMoney(budget.limit, currency)}</p>
                    <button 
                      onClick={() => deleteBudget(budget.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {budgets.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-border rounded-[2rem]">
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No budgets set</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-border/50 bg-secondary/10 px-8 py-6">
          <Button onClick={() => onOpenChange(false)} className="px-8 rounded-xl">Done</Button>
        </div>
      </motion.div>
    </div>
  );
}
