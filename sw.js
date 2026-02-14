const CACHE_NAME = 'pedidos-v2-notificaciones';
const assets = ['./', './index.html', './manifest.json'];

// Instalación
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

// Activación y limpieza
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

// Escuchar evento de notificación
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/1554/1554401.png'
  });
});
