import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative space-y-3 overflow-x-hidden">
        <div className="absolute -left-4 top-0 h-full w-1 bg-gradient-to-b from-primary to-transparent rounded-r-md"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-primary pl-2">
          Overview
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground drop-shadow-md pl-2">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base pl-2 border-l border-border/50">
          {description}
        </p>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}
