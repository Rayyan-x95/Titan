import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
}

export function PageShell({ title, description, eyebrow, children }: PageShellProps) {
  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {(title || description) && (
        <div className="glass-panel relative p-5 sm:p-8 md:p-10 border-white/10 overflow-hidden">
          <div className="relative z-10 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400/80">
              {eyebrow || 'Titan Workspace'}
            </p>
            {title && (
              <h2 className="titan-metric text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="max-w-2xl text-base font-medium leading-relaxed text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="relative z-10 space-y-4">{children}</div>
    </section>
  );
}
