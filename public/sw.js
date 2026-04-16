const CACHE_NAME = 'cockpit-v2';
const PRECACHE_URLS = [
  '/',
  '/data.json',
  '/data-deps.json',
  '/favicon.svg',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
];

const API_TIMEOUT_MS = 5000;

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isDataJson(url) {
  return url.origin === self.location.origin && /^\/data.*\.json$/.test(url.pathname);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function isStaticAsset(request, url) {
  const host = url.hostname;
  if (
    host === 'fonts.googleapis.com' ||
    host === 'fonts.gstatic.com' ||
    host === 'cdn.jsdelivr.net'
  ) {
    return true;
  }
  const d = request.destination;
  if (d === 'script' || d === 'style' || d === 'image' || d === 'font') {
    return true;
  }
  return /\.(?:js|mjs|css|woff2?|ttf|otf|svg|png|jpe?g|gif|webp|ico)$/i.test(
    url.pathname
  );
}

async function networkFirstApi(request) {
  const cache = await caches.open(CACHE_NAME);
  const canCache = request.method === 'GET' || request.method === 'HEAD';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (canCache && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && (request.method === 'GET' || request.method === 'HEAD')) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const canCache = request.method === 'GET' || request.method === 'HEAD';
  try {
    const response = await fetch(request);
    if (canCache && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('network-first: offline and no cache');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    update.catch(() => {});
    return cached;
  }
  const response = await update;
  if (response) return response;
  return fetch(request);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return;
  }
  const url = new URL(request.url);

  if (isApiRequest(url)) {
    event.respondWith(networkFirstApi(request));
    return;
  }
  if (isDataJson(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if (isNavigationRequest(request)) {
    event.respondWith(
      networkFirst(request).catch(() => caches.match('/') || Response.error())
    );
    return;
  }
  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(
    networkFirst(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      return Response.error();
    })
  );
});

self.addEventListener('push', (event) => {
  let payload = { title: '', body: '', icon: '' };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: '', body: event.data.text() || '', icon: '' };
    }
  }
  const title = payload.title || 'Cockpit';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: payload.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = event.notification.data && event.notification.data.url;
  const target = new URL(raw || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (typeof client.navigate === 'function') {
            return client.navigate(target).then(() => client.focus());
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    })
  );
});
