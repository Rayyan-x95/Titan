import { LayoutDashboard, Landmark, NotebookPen, Settings, SquareCheckBig } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';

const items = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: SquareCheckBig },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/finance', label: 'Finance', icon: Landmark },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function Navigation() {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-6 z-50 mx-auto max-w-[min(90vw,400px)] pointer-events-none"
    >
      <div className="pointer-events-auto grid grid-cols-5 gap-1 rounded-[2rem] border border-border/40 bg-background/50 p-2 backdrop-blur-xl shadow-glass">
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
                  'relative flex flex-col items-center justify-center gap-1 rounded-full p-2 text-[10px] font-semibold transition-all duration-300',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-accent shadow-glow -z-10" />
                  )}
                  <Icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "scale-110 drop-shadow-md")} />
                  <span className="hidden sm:block">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
