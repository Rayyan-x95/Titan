import {
  LayoutDashboard,
  SquareCheckBig,
  Landmark,
  NotebookPen,
  Settings,
  Sparkles,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { APP_VERSION } from '@/core/version';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: SquareCheckBig },
  { to: '/finance', label: 'Money', icon: Landmark },
  { to: '/notes', label: 'Thoughts', icon: NotebookPen },
  { to: '/intelligence', label: 'Intelligence', icon: Sparkles },
] as const;

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-2rem)] !fixed left-4 top-4 rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-2xl z-50 transition-all overflow-hidden">
      <div className="p-10 flex items-center gap-4 relative z-10">
        <div className="relative">
          <img
            src="/icons/falcon.png"
            alt="Titan"
            className="h-10 w-10 rounded-xl object-contain shadow-glow-blue"
          />
          <div className="absolute -inset-1 rounded-xl bg-blue-500/10 blur-md -z-10" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white">Titan</span>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500">
            Workspace
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isMoneyActive = item.to === '/finance' && location.pathname.startsWith('/split');
          const active =
            location.pathname === item.to ||
            (item.to === '/' && location.pathname === '/') ||
            isMoneyActive;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={cn(
                'group flex items-center gap-4 px-6 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all relative overflow-hidden',
                active ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5',
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-white/5 border border-white/5 -z-10"
                  transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-300',
                  active && 'text-blue-400',
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span>{item.label}</span>
              {active && (
                <motion.div
                  layoutId="active-dot"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-glow-blue"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-8 border-t border-white/5 space-y-4 relative z-10">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-4 px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all',
              isActive
                ? 'bg-white/5 text-white border border-white/5'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5',
            )
          }
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </NavLink>
        <div className="px-6 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-600 flex justify-between items-center opacity-60">
          <span>v{APP_VERSION}</span>
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-blue-400" />
            <span>Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
