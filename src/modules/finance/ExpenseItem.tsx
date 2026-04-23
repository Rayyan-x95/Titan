import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PencilLine, Trash2, Link2, Landmark, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSettings, formatMoney } from '@/core/settings';
import type { Expense, Task, Account, Note } from '@/core/store/types';
import { cn } from '@/utils/cn';

interface ExpenseItemProps {
  expense: Expense;
  account?: Account;
  linkedTask?: Task;
  linkedNote?: Note;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function ExpenseItem({ expense, account, linkedTask, linkedNote, onEdit, onDelete }: ExpenseItemProps) {
  const { currency } = useSettings();
  const isExpense = expense.type === 'expense';
  
  const amountFormatted = useMemo(() => {
    const formatted = formatMoney(expense.amount, currency);
    return isExpense ? `-${formatted}` : `+${formatted}`;
  }, [expense.amount, expense.type, currency]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/40 p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-glass backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
             <div className={cn(
               "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
               isExpense ? "bg-rose-500/10 text-rose-500 shadow-glow-sm" : "bg-emerald-500/10 text-emerald-500 shadow-glow-sm"
             )}>
               {isExpense ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
             </div>
             <div>
               <p className={cn(
                 "text-2xl font-black tracking-tighter selection:bg-primary/20",
                 isExpense ? "text-rose-500" : "text-emerald-500"
               )}>
                 {amountFormatted}
               </p>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                 <span>{expense.category}</span>
                 <span className="h-1 w-1 rounded-full bg-border" />
                 <span className="flex items-center gap-1">
                   <Landmark className="h-3 w-3" />
                   {account?.name || 'Default'}
                 </span>
               </div>
             </div>
          </div>

          {(linkedTask || linkedNote || expense.note) && (
            <div className="space-y-2 rounded-[1.25rem] bg-secondary/20 p-4 border border-border/30">
              {expense.note && (
                <p className="text-xs font-medium leading-relaxed text-foreground/80 italic">“{expense.note}”</p>
              )}
              <div className="flex flex-wrap gap-3">
                {linkedTask && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                    <Link2 className="h-3 w-3" />
                    <span>{linkedTask.title}</span>
                  </div>
                )}
                {linkedNote && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent/70">
                    <FileText className="h-3 w-3" />
                    <span>Contextual Note</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="h-8 w-8 p-0 rounded-lg bg-secondary/50 hover:bg-secondary"
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="h-8 w-8 p-0 rounded-lg text-destructive bg-destructive/5 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
