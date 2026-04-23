import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  showClose = true,
}: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "bs-title" : undefined}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-2xl',
              'rounded-t-3xl border-t border-border/50',
              'bg-card/95 backdrop-blur-xl shadow-2xl',
              'max-h-[85vh] overflow-hidden flex flex-col',
              className,
            )}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              {title ? (
                <h2 id="bs-title" className="text-lg font-semibold text-foreground">{title}</h2>
              ) : (
                <div />
              )}
              {showClose && (
                <button
                  onClick={onClose}
                  aria-label="Close sheet"
                  className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
