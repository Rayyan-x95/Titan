import { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Delete } from 'lucide-react';
import { useSettings, hashPin } from '@/core/settings';
import { cn } from '@/utils/cn';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { appPin, pinEnabled } = useSettings();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pinEnabled || !appPin) {
      onUnlock();
    }
  }, [pinEnabled, appPin, onUnlock]);

  const handlePress = async (num: string) => {
    if (input.length >= 4) return;
    setError(false);
    const next = input + num;
    setInput(next);

    if (next.length >= 4) {
      const hashedInput = await hashPin(next);
      if (hashedInput === appPin) {
        onUnlock();
      } else {
        setError(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setInput('');
          setError(false);
        }, 3000);
      }
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
    setError(false);
  };

  if (!pinEnabled || !appPin) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-8 w-full max-w-xs animate-in slide-in-from-bottom-8 duration-500">
        <div className={cn(
          "flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 transition-all duration-300",
          error ? "bg-rose-500/20 animate-shake" : "text-primary"
        )}>
          {error ? <Lock className="h-10 w-10 text-rose-500" /> : <Unlock className="h-10 w-10" />}
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Titan Locked</h2>
          <p className="mt-2 text-sm text-muted-foreground">Enter PIN to continue</p>
        </div>

        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-4 w-4 rounded-full border-2 transition-all duration-200",
                input.length > i ? "bg-primary border-primary scale-110 shadow-glow-sm" : "border-primary/30",
                error && "border-rose-500 bg-rose-500"
              )} 
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => handlePress(n.toString())}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 text-xl font-bold hover:bg-secondary hover:scale-105 active:scale-95 transition-all"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => handlePress('0')}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 text-xl font-bold hover:bg-secondary hover:scale-105 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            aria-label="Delete digit"
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
