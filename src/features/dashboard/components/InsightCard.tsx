import React from 'react';

interface InsightCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  progress?: number;
}

export function InsightCard({ label, value, icon: Icon, accent, progress }: InsightCardProps) {
  return (
    <div className="glass-panel group relative p-3 xs:p-4 sm:p-5 transition-all hover:shadow-glow">
      <div className="relative z-10">
        <div
          className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/5 transition-colors group-hover:border-white/10 ${accent.replace('bg-', 'text-').replace('/30', '')}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</p>
        <p className="titan-metric mt-2 text-lg xs:text-xl sm:text-2xl md:text-3xl text-white break-words leading-none">
          {value}
        </p>

        {progress !== undefined && (
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
            <div
              className={`h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)] ${progress > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
