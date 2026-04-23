import { useMemo, useState } from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import { computeSettlements } from '@/lib/core/splitEngine';

interface SettleUpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  balances: { friendId: string; amount: number }[];
  members: { id: string; name: string }[];
}

export function SettleUpSheet({ open, onOpenChange, groupId, balances, members }: SettleUpSheetProps) {
  const { addSharedExpense } = useStore();
  const { currency } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const settlements = useMemo(() => {
    const balanceEntries = balances.map(b => ({ id: b.friendId, balance: b.amount }));
    return computeSettlements(balanceEntries);
  }, [balances]);

  if (!open) return null;

  const handleSettle = async (from: string, to: string, amount: number) => {
    setIsSaving(true);
    try {
      const fromName = members.find(m => m.id === from)?.name || 'Someone';
      const toName = members.find(m => m.id === to)?.name || 'Someone';
      
      await addSharedExpense({
        description: `Settlement: ${fromName} paid ${toName}`,
        totalAmount: amount,
        paidBy: from,
        groupId: groupId,
        participants: [{ id: to, amount }],
        note: 'Group balance settlement',
      });
      // We don't close the sheet automatically if there are more settlements, 
      // but let's close it for simplicity as the store updates will refresh the view.
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 px-4 py-4 backdrop-blur-md sm:items-center">
      <button
        type="button"
        aria-label="Close settle up sheet"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Settle Up</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">Suggested Payments</h3>
          </div>
          <button
            type="button"
            aria-label="Close settle up sheet"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-8 py-6 space-y-4">
          {settlements.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <p className="text-sm font-bold">Everyone is settled up!</p>
            </div>
          ) : (
            settlements.map((s, i) => {
              const fromName = members.find(m => m.id === s.from)?.name || 'Unknown';
              const toName = members.find(m => m.id === s.to)?.name || 'Unknown';
              
              return (
                <div key={i} className="flex flex-col rounded-2xl border border-border/50 bg-secondary/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">From</p>
                      <p className="text-sm font-black">{fromName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">To</p>
                      <p className="text-sm font-black">{toName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <p className="text-lg font-black tracking-tight">{formatMoney(s.amount, currency)}</p>
                    <Button 
                      size="sm" 
                      onClick={() => handleSettle(s.from, s.to, s.amount)}
                      disabled={isSaving}
                      className="rounded-full px-5"
                    >
                      Record Payment
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border/50 bg-secondary/10 px-8 py-6">
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </div>
    </div>
  );
}
