import { useState } from 'react';
import { X, UserPlus, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/core/store';

interface AddFriendSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFriendSheet({ open, onOpenChange }: AddFriendSheetProps) {
  const { addFriend } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await addFriend({
        name: name.trim(),
        phoneNumber: phone.trim() || undefined,
      });
      onOpenChange(false);
      setName('');
      setPhone('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-4 backdrop-blur-md sm:items-center">
      <button
        type="button"
        aria-label="Close add friend sheet"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />

      <form
        onSubmit={handleSave}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Contacts</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">Add Friend</h3>
          </div>
          <button
            type="button"
            aria-label="Close add friend sheet"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Friend's Name</span>
            <input
              autoFocus
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-background px-6 text-lg font-bold text-foreground outline-none focus:border-primary transition-colors"
              placeholder="e.g. Rahul, Sarah"
            />
          </label>

          <label className="block space-y-2">
            <div className="flex items-center justify-between ml-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number (Optional)</span>
              <Phone className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-background px-6 text-lg font-bold text-foreground outline-none focus:border-primary transition-colors"
              placeholder="+91 00000 00000"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-secondary/10 px-8 py-6">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving || !name.trim()} className="px-8 shadow-glow">
            {isSaving ? 'Adding...' : 'Add Friend'}
          </Button>
        </div>
      </form>
    </div>
  );
}
