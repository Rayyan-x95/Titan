import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation, Sidebar, PwaBanner, CommandPalette, LockScreen } from '@/components';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSettings } from '@/core/settings';
import { useBackgroundNotifications } from '@/hooks/useBackgroundNotifications';

function MobileHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-black/60 backdrop-blur-2xl border-b border-white/5 shadow-lg lg:hidden">
      <div className="flex h-16 items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/icons/falcon.png"
              alt="Titan logo"
              className="h-8 w-8 rounded-xl object-contain shadow-glow-blue"
            />
            <div className="absolute -inset-1 rounded-xl bg-blue-500/10 blur-sm -z-10" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Titan</h1>
            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">
              Workspace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-blue-400">
            <div className="h-1 w-1 rounded-full bg-blue-400 animate-pulse" />
            Ready
          </span>
        </div>
      </div>
    </header>
  );
}

export function Layout() {
  const { compactMode, animations, pinEnabled, appPin } = useSettings();
  const [isUnlocked, setIsUnlocked] = useState(!pinEnabled || !appPin);

  // Background processes
  useBackgroundNotifications();

  // Re-check lock status if settings change
  useEffect(() => {
    if (!pinEnabled || !appPin) {
      setIsUnlocked(true);
    }
  }, [pinEnabled, appPin]);

  // Sync compact mode to root element so CSS can react globally
  useEffect(() => {
    const root = document.documentElement;
    if (compactMode) {
      root.dataset.compact = 'true';
    } else {
      delete root.dataset.compact;
    }
  }, [compactMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (animations) {
      delete root.dataset.animations;
    } else {
      root.dataset.animations = 'off';
    }
  }, [animations]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      {!isUnlocked && <LockScreen onUnlock={() => setIsUnlocked(true)} />}
      {isUnlocked && <CommandPalette />}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#030303]">
        <div className="mesh-gradient absolute inset-0 opacity-40" />
      </div>

      <Sidebar />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      <MobileHeader />

      <PwaBanner />

      <main
        id="main-content"
        className="relative z-10 px-4 pb-48 pt-28 sm:px-6 lg:pl-80 lg:px-8 lg:pb-12 lg:pt-6"
      >
        <div className="mx-auto max-w-5xl">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
