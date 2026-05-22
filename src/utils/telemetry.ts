import { useStore } from '@/core/store';

/**
 * Titan Local Observability
 * Replaces external telemetry with localized event logging.
 */
export function trackEvent(
  category: string,
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
) {
  if (typeof window === 'undefined') return;

  // 1. Log to console for developer visibility
  const prefix = `[Titan:${category}]`;
  const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  // eslint-disable-next-line no-console
  console[consoleMethod](`${prefix} ${message}`);

  // 2. Add to persistent store (if hydrated)
  try {
    const store = useStore.getState();
    if (store && typeof store.addLog === 'function') {
      store.addLog(level, category, message);
    }
  } catch {
    // Fail silently - observability should never crash the app
  }
}

export function initTelemetry() {
  trackEvent('System', 'Local observability initialized');
}
