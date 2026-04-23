import { LayoutDashboard, Landmark, NotebookPen, Settings, SquareCheckBig, Clock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

const items = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/timeline', label: 'Feed', icon: Clock },
  { to: '/tasks', label: 'Tasks', icon: SquareCheckBig },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/finance', label: 'Finance', icon: Landmark },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function Navigation() {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-8 z-50 mx-auto max-w-[min(92vw,540px)] pointer-events-none px-4"
    >
      <div className="compact-nav pointer-events-auto flex items-center justify-around gap-1 rounded-[2rem] border border-white/10 bg-black/40 p-2 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-[11px] font-bold tracking-tight transition-all duration-500',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/80 to-accent/80 shadow-[0_0_20px_rgba(var(--primary),0.3)] -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </AnimatePresence>
                  <Icon className={cn("h-5 w-5 transition-all duration-500", isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "opacity-80")} />
                  <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest leading-none opacity-90">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
