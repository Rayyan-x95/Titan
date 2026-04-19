import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCcw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { promptInstall } from '@/pwa';
import { createPwaUpdateController } from '@/pwaUpdates';
import { usePwaStatus } from '@/hooks/usePwaStatus';
import { cn } from '@/utils/cn';

export function PwaBanner() {
  const { installAvailable, isOnline, updateAvailable, setUpdateAvailable } = usePwaStatus();
  const [dismissedUpdate, setDismissedUpdate] = useState(false);

  const updateController = useMemo(() => createPwaUpdateController(), []);

  useEffect(() => {
    return updateController.subscribe((available) => {
      setUpdateAvailable(available);
      if (!available) {
        setDismissedUpdate(false);
      }
    });
  }, [setUpdateAvailable, updateController]);

  const showOffline = !isOnline;
  const showUpdate = updateAvailable && !dismissedUpdate;
  const showInstall = installAvailable && isOnline;

  if (!showOffline && !showUpdate && !showInstall) {
    return null;
  }

  return (
    <div className="fixed left-4 right-4 top-[5.25rem] z-50 mx-auto max-w-5xl">
      <div
        className={cn(
          'flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/70 p-3 shadow-glass backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              showUpdate
                ? 'bg-primary/10 text-primary'
                : showOffline
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-emerald-500/10 text-emerald-400',
            )}
          >
            {showUpdate ? (
              <RefreshCcw className="h-5 w-5" />
            ) : showOffline ? (
              <WifiOff className="h-5 w-5" />
            ) : (
              <Download className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-0.5">
            {showUpdate ? (
              <>
                <p className="text-sm font-semibold text-foreground">Update available</p>
                <p className="text-xs text-muted-foreground">Reload to get the latest version.</p>
              </>
            ) : showOffline ? (
              <>
                <p className="text-sm font-semibold text-foreground">You’re offline</p>
                <p className="text-xs text-muted-foreground">Titan will keep working on-device.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">Install Titan</p>
                <p className="text-xs text-muted-foreground">Add Titan to your home screen for faster access.</p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {showUpdate ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDismissedUpdate(true);
                }}
              >
                Not now
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  void updateController.applyUpdate();
                }}
              >
                Reload
              </Button>
            </>
          ) : showInstall ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                void promptInstall();
              }}
            >
              Install
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

