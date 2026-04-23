import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="relative z-10 space-y-4">
        {children}
      </div>
    </section>
  );
}
