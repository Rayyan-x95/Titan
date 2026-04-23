import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { PwaBanner } from '@/components/PwaBanner';
import { CommandPalette } from '@/components/CommandPalette';
import { LockScreen } from '@/components/LockScreen';
import { useSettings } from '@/core/settings';
import { APP_VERSION } from '@/core/version';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/utils/cn';

export function Layout() {
  const { compactMode, animations, pinEnabled, appPin } = useSettings();
  const [isUnlocked, setIsUnlocked] = useState(!pinEnabled || !appPin);
  const scrollDirection = useScrollDirection();

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
    <div className="min-h-screen bg-transparent text-foreground relative overflow-hidden">
      {!isUnlocked && <LockScreen onUnlock={() => setIsUnlocked(true)} />}
      {isUnlocked && <CommandPalette />}
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-8%] left-[-5%] w-[45%] h-[45%] rounded-full bg-primary/15 blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-[-12%] right-[-8%] w-[55%] h-[55%] rounded-full bg-accent/10 blur-[160px] animate-pulse-slow animate-delay-3000" />
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      <header 
        className={cn(
          "fixed top-4 left-4 right-4 z-40 mx-auto max-w-5xl rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-xl shadow-glass transition-all duration-500 ease-in-out",
          scrollDirection === 'down' ? "-translate-y-28 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/icons/titan_logo_icon_transparent.png"
              alt="Titan logo"
              className="h-8 w-8 object-contain drop-shadow-md"
            />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-gradient leading-none">Titan</h1>
              <p className="text-[9px] text-muted-foreground font-medium mt-0.5">
                v{APP_VERSION}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-primary/25 bg-primary/8 px-2.5 py-0.5 text-[10px] font-semibold text-primary/90 tracking-wide">
            Offline Ready
          </span>
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
