import { useEffect, useState } from 'react';

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
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const onInstallAvailability = (event: CustomEvent<boolean>) => {
      setInstallAvailable(Boolean(event.detail));
    };

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('titan:pwa-install-availability', onInstallAvailability as EventListener);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('titan:pwa-install-availability', onInstallAvailability as EventListener);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return { installAvailable, isOnline, updateAvailable, setUpdateAvailable };
}

