import { useNavigate } from 'react-router-dom';
import { Activity, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import { useCompletedTodayTasks, useNotesToday, useSpentToday } from '@/core/store/selectors';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function SnapshotCard() {
  const navigate = useNavigate();
  const onboardingName = useStore((state) => state.onboarding.name);
  const currency = useSettings((s) => s.currency);

  const completedTasks = useCompletedTodayTasks();
  const notesToday = useNotesToday();
  const spentToday = useSpentToday();

  const completedCount = completedTasks.length;
  const notesCount = notesToday.length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      type="button"
      className="glass-panel mesh-gradient group w-full text-left focus:outline-none rounded-[2.5rem] p-6 sm:p-8 shadow-glow transition-all group-hover:shadow-glow-blue group-focus-visible:ring-2 group-focus-visible:ring-blue-500/50"
      onClick={() => {
        void navigate('/timeline');
      }}
    >
      <div className="relative z-10">
        <div className="flex flex-col-reverse xs:flex-row xs:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400/80">
              Personal Narrative
            </p>
            <h2 className="mt-2 xs:mt-3 text-3xl sm:text-4xl font-black tracking-tight text-white">
              {getGreeting()}, <span className="text-gradient">{onboardingName || 'there'}</span>
            </h2>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-blue-400 shadow-glow border border-white/10 group-hover:border-blue-500/30 transition-colors">
            <Activity className="h-7 w-7" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tasks</p>
            <div className="flex items-baseline gap-2">
              <span className="titan-metric text-white">{completedCount}</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                Done
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes</p>
            <div className="flex items-baseline gap-2">
              <span className="titan-metric text-white">{notesCount}</span>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                New
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Spending
            </p>
            <div className="flex items-baseline gap-2">
              <span className="titan-metric text-white">
                {formatMoney(spentToday, currency).split('.')[0]}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase">Today</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vibe</p>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <span className="text-lg font-black text-white uppercase tracking-tight">Focus</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between rounded-2xl bg-white/5 p-5 transition-all group-hover:bg-white/10 border border-white/5 group-hover:border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <p className="text-xs font-bold text-slate-400">Syncing your daily progress...</p>
          </div>
          <ArrowRight className="h-4 w-4 text-blue-400 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.button>
  );
}
