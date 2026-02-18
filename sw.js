const CACHE_NAME = 'pedidos-v3.3.0';
const assets = ['./', './index.html', './manifest.json'];

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
    })
  );
  self.clients.claim();
});

// Estrategia network-first: intenta red, si falla usa cache
// Skip caching for Firebase Storage URLs (images/PDFs)
self.addEventListener('fetch', (e) => {
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

// Notificaciones push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Tienes una entrega pendiente',
    icon: 'https://cdn-icons-png.flaticon.com/512/1554/1554401.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/1554/1554401.png'
  };
  event.waitUntil(
    self.registration.showNotification('Pedidos Dealer', options)
  );
});
