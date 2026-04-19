import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function DashboardCard({ title, subtitle, children, action }: DashboardCardProps) {
  return (
    <Card className="p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-primary/20 transition-all duration-500"></div>
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary/80">{title}</p>
          {subtitle ? <h3 className="text-xl font-bold tracking-tight text-foreground/90">{subtitle}</h3> : null}
        </div>
        {action}
      </div>
      <div className="mt-8 relative z-10">{children}</div>
    </Card>
  );
}
