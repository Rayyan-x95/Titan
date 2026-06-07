import { useMemo, useState } from 'react';
import { Plus, Receipt, User, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useStore } from '@/core/store';
import type { Group } from '@/core/store/types';
import { useSettings, formatMoney } from '@/core/settings';
import { cn } from '@/utils/cn';
import { calculateGroupBalances } from './splitLogic';
import { AddSharedExpenseSheet } from './AddSharedExpenseSheet';
import { SettleUpSheet } from './SettleUpSheet';

interface GroupDetailViewProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupDetailView({ group, open, onOpenChange }: GroupDetailViewProps) {
  const friends = useStore((s) => s.friends);
  const sharedExpenses = useStore((s) => s.sharedExpenses);
  const deleteGroup = useStore((s) => s.deleteGroup);
  const deleteSharedExpense = useStore((s) => s.deleteSharedExpense);
  const { currency } = useSettings();

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'balances' | 'expenses'>('balances');

  const groupMembers = useMemo(
    () => [
      { id: 'user', name: 'You' },
      ...(group.memberIds
        .map((mid: string) => friends.find((f) => f.id === mid))
        .filter(Boolean) as { id: string; name: string }[]),
    ],
    [group.memberIds, friends],
  );
  const balances = useMemo(
    () =>
      calculateGroupBalances(
        group.id,
        sharedExpenses,
        groupMembers.map((m) => m.id),
      ),
    [group.id, sharedExpenses, groupMembers],
  );
  const groupExpenses = useMemo(
    () =>
      sharedExpenses
        .filter((se) => se.groupId === group.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [group.id, sharedExpenses],
  );

  if (!open) return null;

  const handleDeleteGroup = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this group? All group expenses will be removed.',
      )
    ) {
      try {
        await deleteGroup(group.id);
        onOpenChange(false);
      } catch (err) {
        // Error handled by UI feedback
        alert(err instanceof Error ? err.message : 'Failed to delete group');
      }
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-[60] flex flex-col bg-background animate-in slide-in-from-right duration-300">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            aria-label="Back to groups"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{group.name}</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {groupMembers.length} Members
            </p>
          </div>
        </div>
        <button
          aria-label="Delete group"
          onClick={() => {
            void handleDeleteGroup();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="flex px-6 mt-6">
          <div className="flex flex-1 rounded-2xl bg-secondary/30 p-1">
            {(['balances', 'expenses'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 mt-8">
          {activeTab === 'balances' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Member Balances
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSettleUpOpen(true)}
                  className="h-8 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10"
                >
                  Settle Up
                </Button>
              </div>
              <div className="grid gap-3">
                {groupMembers.map((member) => {
                  const bal = balances.find((b) => b.friendId === member.id)?.amount || 0;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-[2.5rem] border border-border/50 bg-card/30 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{member.name}</p>
                          <p
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-widest',
                              bal > 0
                                ? 'text-emerald-500'
                                : bal < 0
                                  ? 'text-rose-500'
                                  : 'text-muted-foreground',
                            )}
                          >
                            {bal > 0 ? 'Owed' : bal < 0 ? 'Owes' : 'Settled'}
                          </p>
                        </div>
                      </div>
                      <p
                        className={cn(
                          'text-lg font-black tracking-tight',
                          bal > 0
                            ? 'text-emerald-400'
                            : bal < 0
                              ? 'text-rose-400'
                              : 'text-muted-foreground',
                        )}
                      >
                        {bal === 0 ? '—' : formatMoney(Math.abs(bal), currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Recent Expenses
                </p>
                <span className="text-[10px] font-bold text-primary uppercase">
                  {groupExpenses.length} Total
                </span>
              </div>
              <div className="grid gap-3">
                {groupExpenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-10 w-10 mx-auto opacity-20 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest">No expenses yet</p>
                  </div>
                ) : (
                  groupExpenses.map((expense) => {
                    const payer =
                      groupMembers.find((m) => m.id === expense.paidBy)?.name || 'Unknown';
                    return (
                      <div
                        key={expense.id}
                        className="group relative flex items-center justify-between rounded-[2.5rem] border border-border/50 bg-card/30 p-5 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-xl',
                              expense.isSettlement
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-primary/10 text-primary',
                            )}
                          >
                            <Receipt className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold">{expense.description}</p>
                              {expense.isSettlement && (
                                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-500 border border-emerald-500/20">
                                  Settlement
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                              Paid by {payer}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {formatMoney(expense.totalAmount, currency)}
                          </p>
                          <button
                            onClick={() => {
                              void (async () => {
                                try {
                                  await deleteSharedExpense(expense.id);
                                } catch (err) {
                                  // Error handled by UI feedback
                                  alert(
                                    err instanceof Error ? err.message : 'Failed to delete expense',
                                  );
                                }
                              })();
                            }}
                            className="mt-1 text-[10px] font-bold text-rose-500/50 hover:text-rose-500 uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-10 z-20 flex justify-center px-6 pointer-events-none">
        <Button
          onClick={() => setIsAddExpenseOpen(true)}
          className="h-14 w-full max-w-sm rounded-full shadow-glow-primary pointer-events-auto"
        >
          <Plus className="h-5 w-5" />
          Add Group Expense
        </Button>
      </div>
      <AddSharedExpenseSheet
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        group={group}
        members={groupMembers}
      />
      <SettleUpSheet
        open={isSettleUpOpen}
        onOpenChange={setIsSettleUpOpen}
        groupId={group.id}
        balances={balances}
        members={groupMembers}
      />
    </div>
  );
}
