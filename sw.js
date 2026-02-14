const CACHE_NAME = 'pedidos-v1.0.4'; // Cambia el número de versión aquí para forzar actualización
const assets = [
  './',
  './index.html',
  './manifest.json'
];

// Instalar y guardar en caché
self.addEventListener('install', e => {
  self.skipWaiting(); // Fuerza a la nueva versión a activarse
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

// Borrar cachés viejos al activar
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
