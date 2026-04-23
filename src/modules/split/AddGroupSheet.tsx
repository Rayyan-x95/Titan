import { useState } from 'react';
import { X, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/core/store';
import { cn } from '@/utils/cn';

interface AddGroupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGroupSheet({ open, onOpenChange }: AddGroupSheetProps) {
  const { friends, addGroup } = useStore();
  const [name, setName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await addGroup({
        name: name.trim(),
        memberIds: selectedFriends,
      });
      onOpenChange(false);
      setName('');
      setSelectedFriends([]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-4 backdrop-blur-md sm:items-center">
      <button
        type="button"
        aria-label="Close add group sheet"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />

      <form
        onSubmit={handleSave}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Collaboration</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">Create Group</h3>
          </div>
          <button
            type="button"
            aria-label="Close add group sheet"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Group Name</span>
            <input
              autoFocus
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-background px-6 text-lg font-bold text-foreground outline-none focus:border-primary transition-colors"
              placeholder="e.g. Goa Trip, Roommates"
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Members</span>
              <span className="text-[10px] font-bold text-primary uppercase">{selectedFriends.length} Selected</span>
            </div>
            
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
              {friends.length === 0 ? (
                <p className="text-center py-8 text-xs text-muted-foreground italic">
                  No friends added yet. Add friends first to include them in groups.
                </p>
              ) : (
                friends.map(friend => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleFriend(friend.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border p-4 transition-all",
                      selectedFriends.includes(friend.id) 
                        ? "border-primary bg-primary/5 text-foreground" 
                        : "border-border bg-background/50 text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                        selectedFriends.includes(friend.id) ? "bg-primary text-white" : "bg-secondary"
                      )}>
                        {friend.name[0]}
                      </div>
                      <span className="text-sm font-bold">{friend.name}</span>
                    </div>
                    {selectedFriends.includes(friend.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-secondary/10 px-8 py-6">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving || !name.trim()} className="px-8 shadow-glow">
            {isSaving ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </form>
    </div>
  );
}
