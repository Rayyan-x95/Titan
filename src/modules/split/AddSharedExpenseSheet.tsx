import { useState, useMemo } from 'react';
import { X, Receipt, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/core/store';
import type { Group } from '@/core/store/types';
import { cn } from '@/utils/cn';
import { useSettings } from '@/core/settings';
import { splitEqual } from '@/lib/core/splitEngine';

interface AddSharedExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  members: { id: string; name: string }[];
}

export function AddSharedExpenseSheet({ open, onOpenChange, group, members }: AddSharedExpenseSheetProps) {
  const { addSharedExpense } = useStore();
  const { currency } = useSettings();
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [paidBy, setPaidBy] = useState('user');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(members.map(m => m.id));
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(amountInput) * 100);
    if (!description.trim() || isNaN(amountCents) || amountCents <= 0) return;
    if (selectedParticipants.length === 0) return;
    
    setIsSaving(true);
    try {
      const shares = splitEqual(amountCents, selectedParticipants.map(id => ({ id })));
      
        await addSharedExpense({
          description: description.trim(),
          totalAmount: amountCents,
          paidBy,
          groupId: group.id,
          participants: shares,
        });
        
        const today = new Date().toISOString().split('T')[0];
        await useStore.getState().updateSnapshot(today, 'split', amountCents);
        
        onOpenChange(false);
      setDescription('');
      setAmountInput('');
      setPaidBy('user');
      setSelectedParticipants(members.map(m => m.id));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 px-4 py-4 backdrop-blur-md sm:items-center">
      <button
        type="button"
        aria-label="Close add shared expense sheet"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />

      <form
        onSubmit={handleSave}
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Expense</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">Add Group Expense</h3>
          </div>
          <button
            type="button"
            aria-label="Close add shared expense sheet"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-8 py-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</span>
              <input
                autoFocus
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-14 w-full rounded-2xl border border-border bg-background px-6 text-sm font-bold text-foreground outline-none focus:border-primary transition-colors"
                placeholder="What was it for?"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Amount</span>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                  {currency === 'INR' ? '₹' : '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-border bg-background pl-10 pr-6 text-xl font-black text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="0.00"
                />
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Paid By</span>
            <div className="flex flex-wrap gap-2">
              {members.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setPaidBy(member.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                    paidBy === member.id 
                      ? "border-primary bg-primary text-white shadow-glow-sm" 
                      : "border-border bg-background/50 text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Split With</span>
              <span className="text-[10px] font-bold text-primary uppercase">{selectedParticipants.length} Participants</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {members.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleParticipant(member.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-all",
                    selectedParticipants.includes(member.id) 
                      ? "border-primary bg-primary/5 text-foreground" 
                      : "border-border bg-background/50 text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  <span className="text-[11px] font-bold truncate pr-2">{member.name}</span>
                  {selectedParticipants.includes(member.id) && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-secondary/10 px-8 py-6">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving || !description.trim() || !amountInput} className="px-8 shadow-glow">
            {isSaving ? 'Saving...' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
}
