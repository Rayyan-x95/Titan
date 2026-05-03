/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

clientsClaim();

self.addEventListener('message', (event) => {
  const data = event.data as Record<string, unknown> | null;
  if (data && data.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ❗ CRITICAL: bypass sitemap and robots for SEO visibility
  // This ensures Googlebot can fetch these files directly from the network.
  if (url.pathname === '/sitemap.xml' || url.pathname === '/robots.txt') {
    return;
  }

  const isShareTargetPost =
    event.request.method === 'POST' &&
    url.origin === self.location.origin &&
    url.pathname === '/share';

  if (!isShareTargetPost) {
    return;
  }

  event.respondWith(handleShareTargetPost(event.request));
});

async function handleShareTargetPost(request: Request) {
  const redirectUrl = new URL('/share', self.location.origin);

  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const text = formData.get('text');

    if (typeof title === 'string' && title.trim()) {
      redirectUrl.searchParams.set('title', title);
    }

    if (typeof text === 'string' && text.trim()) {
      redirectUrl.searchParams.set('text', text);
    }

    redirectUrl.searchParams.set('source', 'share-target');
  } catch (error) {
    console.error('[Titan] Failed to read shared payload', error);
    redirectUrl.searchParams.set('share_error', '1');
  }

  return Response.redirect(redirectUrl.href, 303);
}

registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'titan-static-assets',
  }),
);

registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'titan-media-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
);

const appShellHandler = new NetworkFirst({
  cacheName: 'titan-app-shell',
  networkTimeoutSeconds: 3,
});

const navigationRoute = new NavigationRoute(appShellHandler, {
  denylist: [
    /^\/api\//,
    /^\/sitemap\.xml$/,
    /^\/robots\.txt$/,
  ],
});

registerRoute(navigationRoute);

// ─── Notifications ────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = (event.data?.json() as Record<string, unknown>) ?? {};
  const title = typeof data.title === 'string' ? data.title : 'Titan Update';
  const body = typeof data.body === 'string' ? data.body : 'Your financial report is ready.';
  const url = typeof data.url === 'string' ? data.url : '/';

  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: url,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = String(event.notification.data || '/');

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if (client.url === urlToOpen && 'focus' in client) {
        await client.focus();
        return;
      }
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(urlToOpen);
    }
  })());
});
