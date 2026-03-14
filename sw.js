const CACHE_NAME = 'pedidos-v3.4.0';
const assets = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(assets))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(() => {
      // Notify all open tabs to reload with the new version
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
      });
    })
  );
  self.clients.claim();
});

// Network-first strategy: try network, fallback to cache
// Skip caching for Firebase Storage URLs (images/PDFs)
self.addEventListener('fetch', (e) => {
  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  const url = e.request.url;
  if (url.includes('firebasestorage.googleapis.com') || url.includes('firebasestorage.app')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data.json(); } catch { data = { body: event.data?.text() || 'Nueva notificacion' }; }
  const options = {
    body: data.body || 'Nueva notificacion',
    icon: '/icon-512.png',
    badge: '/icon-192.png',
    tag: data.tag || 'partspilot',
    renotify: true,
    data: { url: '/' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'PartsPilot', options)
  );
});

// Notification click — focus or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
