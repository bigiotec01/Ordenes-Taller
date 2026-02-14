const CACHE_NAME = 'pedidos-v2-notif';
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
});

// Esto permite que la app envíe notificaciones incluso si Safari está cerrado
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
