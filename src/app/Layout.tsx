import { Outlet } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Flame } from 'lucide-react';
import { PwaBanner } from '@/components/PwaBanner';
import { APP_VERSION } from '@/core/version';

export function Layout() {
  return (
    <div className="min-h-screen bg-transparent text-foreground relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      <header className="fixed top-4 left-4 right-4 z-40 mx-auto max-w-5xl rounded-2xl border border-border/40 bg-background/40 backdrop-blur-xl shadow-glass">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow text-white">
               <Flame className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-lg font-bold tracking-tight text-gradient">Titan</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                Productivity Hub · {APP_VERSION}
              </p>
            </div>
          </div>
          <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            Offline Ready
          </div>
        </div>
      </header>

      <PwaBanner />

      <main id="main-content" className="relative z-10 mx-auto max-w-5xl px-4 pb-32 pt-28 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Navigation />
    </div>
  );
}
