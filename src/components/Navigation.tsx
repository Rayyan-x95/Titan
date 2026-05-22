import { LayoutDashboard, SquareCheckBig, Landmark, NotebookPen, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

const items = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: SquareCheckBig },
  { to: '/finance', label: 'Money', icon: Landmark },
  { to: '/notes', label: 'Thoughts', icon: NotebookPen },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function Navigation() {
  const location = useLocation();

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-fit flex-col items-center px-4 pb-[calc(1.5rem+var(--safe-area-bottom))] lg:hidden"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur-2xl shadow-2xl relative overflow-hidden ring-1 ring-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

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
              className={() =>
                cn(
                  'relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500',
                  active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300',
                )
              }
            >
              <AnimatePresence mode="wait">
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/10 shadow-inner rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
              <Icon
                className={cn(
                  'h-5 w-5 relative z-10 transition-transform duration-500',
                  active && 'scale-110',
                )}
                strokeWidth={active ? 2.5 : 2}
              />

              {active && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-blue-400 shadow-glow-blue"
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
