import { useEffect, useState, useCallback } from 'react';

declare global {
  interface WindowEventMap {
    'titan:pwa-install-availability': CustomEvent<boolean>;
  }
}

export interface PwaStatus {
  installAvailable: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  setUpdateAvailable: (available: boolean) => void;
}

export function usePwaStatus(): PwaStatus {
  const [installAvailable, setInstallAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const setUpdateAvailableSafe = useCallback((available: boolean) => {
    setUpdateAvailable((prev) => (prev !== available ? available : prev));
  }, []);

  useEffect(() => {
    const onInstallAvailability = (event: CustomEvent<boolean>) => {
      setInstallAvailable((prev) =>
        prev !== Boolean(event.detail) ? Boolean(event.detail) : prev,
      );
    };

    const onOnline = () => setIsOnline((prev) => (prev !== true ? true : prev));
    const onOffline = () => setIsOnline((prev) => (prev !== false ? false : prev));

    window.addEventListener(
      'titan:pwa-install-availability',
      onInstallAvailability as EventListener,
    );
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    setIsOnline((prev) => (prev !== navigator.onLine ? navigator.onLine : prev));

    return () => {
      window.removeEventListener(
        'titan:pwa-install-availability',
        onInstallAvailability as EventListener,
      );
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return {
    installAvailable,
    isOnline,
    updateAvailable,
    setUpdateAvailable: setUpdateAvailableSafe,
  };
}
