import { Workbox } from 'workbox-window';

export interface PwaUpdateController {
  isUpdateAvailable: () => boolean;
  applyUpdate: () => Promise<void>;
  subscribe: (listener: (available: boolean) => void) => () => void;
}

export function createPwaUpdateController(): PwaUpdateController {
  const updateCheckIntervalMs = 60 * 60 * 1000;
  const listeners = new Set<(available: boolean) => void>();
  let wb: Workbox | null = null;
  let updateDetected = false;
  let updateCheckIntervalId: number | undefined;

  const notify = (available: boolean) => {
    for (const listener of listeners) {
      listener(available);
    }
  };

  const checkForUpdate = () => {
    if (document.visibilityState !== 'visible') return;
    void wb?.update();
  };

  const ensureRegistered = () => {
    if (import.meta.env.DEV) return;
    if (!('serviceWorker' in navigator)) return;
    if (wb) return;

    wb = new Workbox('/service-worker.js');

    wb.addEventListener('waiting', () => {
      updateDetected = true;
      notify(true);
    });

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        updateDetected = true;
        notify(true);
      }
    });

    void wb.register();

    window.addEventListener('online', checkForUpdate);
    document.addEventListener('visibilitychange', checkForUpdate);
    updateCheckIntervalId = window.setInterval(checkForUpdate, updateCheckIntervalMs);
    checkForUpdate();
  };

  ensureRegistered();

  return {
    isUpdateAvailable: () => updateDetected,
    subscribe: (listener) => {
      listeners.add(listener);
      listener(updateDetected);
      return () => listeners.delete(listener);
    },
    applyUpdate: async () => {
      ensureRegistered();
      if (!wb) {
        window.location.reload();
        return;
      }

      if (!navigator.serviceWorker.controller) {
        window.location.reload();
        return;
      }

      const controllerChangePromise = new Promise<void>((resolve) => {
        const timeoutId = window.setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          resolve();
        }, 8000);

        const onControllerChange = () => {
          if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId);
          }
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          resolve();
        };

        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      });

      if (wb) {
        void wb.messageSkipWaiting();
      }

      await controllerChangePromise;
      if (updateCheckIntervalId !== undefined) {
        window.clearInterval(updateCheckIntervalId);
      }
      window.location.reload();
    },
  };
}
