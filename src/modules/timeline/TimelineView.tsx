import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  FileText, 
  CircleDollarSign, 
  Users, 
  ArrowRight,
  Clock,
  Calendar as CalendarIcon,
  Search,
  Zap,
  Layers,
  Heart,
  Briefcase,
  Wallet
} from 'lucide-react';
import { useStore } from '@/core/store';
import type { TimelineItem } from '@/core/store/useStore';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { useSettings, formatMoney } from '@/core/settings';

const AreaIcon = ({ area, className }: { area: string, className?: string }) => {
  switch (area) {
    case 'work': return <Briefcase className={className} />;
    case 'health': return <Heart className={className} />;
    case 'finance': return <Wallet className={className} />;
    case 'social': return <Users className={className} />;
    default: return <Zap className={className} />;
  }
};

const TimelineCard = ({ item }: { item: TimelineItem }) => {
  const { type, data, timestamp } = item;

  const getDetails = () => {
    switch (type) {
      case 'task':
        return {
          title: data.title,
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          meta: (data as any).status,
          color: 'bg-emerald-500/10 text-emerald-500',
        };
      case 'note':
        const title = data.content.split('\n')[0] || 'Untitled Note';
        return {
          title,
          icon: <FileText className="h-5 w-5 text-blue-500" />,
          meta: `${data.tags.length} tags`,
          color: 'bg-blue-500/10 text-blue-500',
        };
      case 'expense':
        return {
          title: data.category,
          icon: <CircleDollarSign className={cn("h-5 w-5", data.type === 'income' ? 'text-emerald-500' : 'text-rose-500')} />,
          meta: formatMoney(data.amount, useSettings.getState().currency),
          color: data.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500',
        };
      case 'split':
        return {
          title: data.description,
          icon: <Users className="h-5 w-5 text-purple-500" />,
          meta: formatMoney(data.totalAmount, useSettings.getState().currency),
          color: 'bg-purple-500/10 text-purple-500',
        };
    }
  };

  const details = getDetails();
  if (!details) return null;
  const area = (data as any).area || 'personal';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group relative flex gap-6 pb-10"
    >
      {/* Connector Line */}
      <div className="absolute left-[23px] top-10 bottom-0 w-[2px] bg-border/40 group-last:hidden" />

      {/* Type Icon */}
      <div className={cn(
        "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-glass transition-all group-hover:scale-110",
        details.color
      )}>
        {details.icon}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold tracking-tight text-foreground">{details.title}</h4>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-2 py-0.5">
              <AreaIcon area={area} className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{area}</span>
            </div>
          </div>
          <time className="text-[10px] font-bold text-muted-foreground/60">{format(new Date(timestamp), 'h:mm a')}</time>
        </div>
        
        <p className="text-xs font-medium text-muted-foreground/80">{details.meta}</p>

        {(data as any).note && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground/60 line-clamp-2 italic">
            "{ (data as any).note }"
          </p>
        )}
      </div>
    </motion.div>
  );
};

export const TimelineView = () => {
  const getTimelineItems = useStore(state => state.getTimelineItems);
  const items = getTimelineItems();

  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    items.forEach(item => {
      const date = format(new Date(item.timestamp), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [items]);

  const dates = Object.keys(groupedItems).sort((a, b) => b.localeCompare(a));

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateStr === format(today, 'yyyy-MM-dd')) return 'Today';
    if (dateStr === format(yesterday, 'yyyy-MM-dd')) return 'Yesterday';
    return format(date, 'MMMM do, yyyy');
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 leading-none">Narrative</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-foreground leading-tight">Life Timeline</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card shadow-glass text-muted-foreground hover:text-primary transition-colors cursor-pointer">
          <Search className="h-5 w-5" />
        </div>
      </header>

      <div className="space-y-16">
        {dates.map(date => (
          <section key={date} className="relative">
            <div className="sticky top-0 z-20 -mx-4 mb-8 flex items-center gap-4 bg-background/80 px-4 py-2 backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-glow-sm">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/80">
                {getDateLabel(date)}
              </h3>
              <div className="h-[1px] flex-1 bg-border/40" />
            </div>

            <div className="ml-2">
              {groupedItems[date].map((item, idx) => (
                <TimelineCard key={(item.data as any).id || idx} item={item} />
              ))}
            </div>
          </section>
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-secondary/30 text-muted-foreground/30">
              <Clock className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Your story starts here</h3>
            <p className="mt-2 text-sm text-muted-foreground/60 max-w-xs">
              Every task, note, and expense you capture will show up in this chronological narrative.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
