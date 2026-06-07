import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X, Check, Coffee, Brain } from 'lucide-react';
import { Button } from '@/components/ui';
import { useStore } from '@/core/store';
import type { Task } from '@/core/store/types';
import { cn } from '@/utils/cn';

interface FocusTimerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

type TimerMode = 'focus' | 'short' | 'long';

const MODE_CONFIGS: Record<TimerMode, { label: string; duration: number; icon: typeof Brain }> = {
  focus: { label: 'Focus Session', duration: 25 * 60, icon: Brain },
  short: { label: 'Short Break', duration: 5 * 60, icon: Coffee },
  long: { label: 'Long Break', duration: 15 * 60, icon: Coffee },
};

export function FocusTimerSheet({ open, onOpenChange, task }: FocusTimerSheetProps) {
  const addFocusSession = useStore((s) => s.addFocusSession);

  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIGS.focus.duration);
  const [isActive, setIsActive] = useState(false);
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const totalDuration = MODE_CONFIGS[mode].duration;
  const timeSpentRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when mode changes
  useEffect(() => {
    setTimeLeft(MODE_CONFIGS[mode].duration);
    setIsActive(false);
    setIsCompleted(false);
    timeSpentRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [mode]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer tick logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        if (mode === 'focus') {
          timeSpentRef.current += 1;
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsCompleted(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Play a simple beep sound
      try {
        const audioCtx = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } catch {
        // Silently fail if sound playback fails
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalDuration);
    setIsCompleted(false);
    timeSpentRef.current = 0;
  };

  const handleSaveSession = async () => {
    if (!task) return;
    try {
      const durationSeconds = timeSpentRef.current;
      if (durationSeconds > 0) {
        await addFocusSession({
          taskId: task.id,
          durationSeconds,
          notes: notes.trim() || undefined,
        });
      }
      onOpenChange(false);
      setNotes('');
      setIsCompleted(false);
      timeSpentRef.current = 0;
    } catch {
      // Error handled by UI feedback
      alert('Failed to save focus session');
    }
  };

  // Format time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // SVG Progress Arc Circle Math
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalDuration) * circumference;

  const IconComponent = MODE_CONFIGS[mode].icon;

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        {/* Backdrop glass blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />

        {/* Modal Timer Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
          className="relative glass-panel w-full max-w-md max-h-[95vh] overflow-y-auto rounded-[2.5rem] p-8 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 text-center"
        >
          {/* Close Header button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all"
            aria-label="Close Focus mode"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Task title indicator */}
          <div className="mb-6 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">
              Focusing On
            </span>
            <h2 className="text-lg font-black text-white tracking-tight truncate px-8">
              {task?.title || 'Personal Focus Session'}
            </h2>
          </div>

          {/* Mode switch pills */}
          <div className="flex rounded-full bg-slate-950/60 p-1 border border-white/5 max-w-xs mx-auto mb-8">
            {(['focus', 'short', 'long'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300',
                  mode === m
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-500 hover:text-slate-300',
                )}
              >
                {m === 'focus' ? 'Focus' : m === 'short' ? 'Short' : 'Long'}
              </button>
            ))}
          </div>

          {/* Circular SVG Timer dial */}
          <div className="relative h-48 w-48 mx-auto mb-8 flex items-center justify-center">
            {/* SVG Circle Progress */}
            <svg className="absolute inset-0 h-full w-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-white/[0.03]"
                strokeWidth="10"
                fill="none"
              />
              <motion.circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-blue-500 shadow-glow-blue"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>

            {/* Inner Content (Clock text & Mode Icon) */}
            <div className="flex flex-col items-center select-none">
              <IconComponent className="h-6 w-6 text-blue-400 animate-pulse mb-1" />
              <span className="text-3xl font-black text-white tracking-tighter leading-none">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {MODE_CONFIGS[mode].label}
              </span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={resetTimer}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-90"
              aria-label="Reset Timer"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={toggleTimer}
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-[1.5rem] transition-all duration-300 active:scale-95 border-none',
                isActive
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-glow-amber'
                  : 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-glow-blue',
              )}
              aria-label={isActive ? 'Pause Session' : 'Start Focus Session'}
            >
              {isActive ? (
                <Pause className="h-6 w-6 fill-current" />
              ) : (
                <Play className="h-6 w-6 fill-current ml-1" />
              )}
            </button>
            <button
              onClick={() => setIsCompleted(true)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-90"
              aria-label="Complete Session"
            >
              <Check className="h-5 w-5" />
            </button>
          </div>

          {/* Post-focus completed notes save form */}
          <AnimatePresence>
            {(isCompleted || timeSpentRef.current > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 border-t border-white/5 pt-6 space-y-4 text-left"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="focus-notes"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1"
                  >
                    What did you accomplish?
                  </label>
                  <input
                    id="focus-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Wrote outline, resolved lint errors..."
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => {
                      setIsCompleted(false);
                      setNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 h-11"
                    onClick={() => {
                      void handleSaveSession();
                    }}
                  >
                    Save Focus Session
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
