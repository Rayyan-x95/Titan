import { createContext, useContext, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalContextValue {
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within a Modal provider');
  }
  return context;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Modal({ open, onClose, children, className, id }: ModalProps) {
  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  return (
    <ModalContext.Provider value={{ onClose }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-md sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            id={id}
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
              className={cn(
                'ui-surface w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-[2.5rem] border border-border/70 p-8 pb-10 shadow-2xl sm:rounded-[2.5rem]',
                className,
              )}
              onClick={(event) => event.stopPropagation()}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

interface ModalHeaderProps {
  title: string;
  description?: string;
  showClose?: boolean;
}

Modal.Header = function ModalHeader({ title, description, showClose = true }: ModalHeaderProps) {
  const { onClose } = useModalContext();

  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/80">
          Action Required
        </p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm font-medium text-muted-foreground/80 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {showClose && (
        <button
          type="button"
          className="ui-button ui-button-ghost h-10 w-10 rounded-full p-0 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

Modal.Content = function ModalContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('relative', className)}>{children}</div>;
};

Modal.Footer = function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mt-10 flex flex-wrap items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
};
