importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA84JgJHrziYRF90W6kpilfEKwGtqOf_6A",
    authDomain: "ordenes-taller-f35bb.firebaseapp.com",
    projectId: "ordenes-taller-f35bb",
    storageBucket: "ordenes-taller-f35bb.firebasestorage.app",
    messagingSenderId: "444016011348",
    appId: "1:444016011348:web:26d9a64d3accffd5e1e5c1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || payload.data || {};
    if (!title) return;
    self.registration.showNotification(title, {
        body: body || '',
        icon: '/icon-512.png',
        badge: '/icon-192.png',
        tag: 'partspilot',
        renotify: true,
        data: { url: '/' }
    });
});

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

const CACHE_NAME = 'pedidos-v3.8.0';
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
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
      });
    })
  );
  self.clients.claim();
});

// Only cache same-origin app assets, skip everything external
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Only handle same-origin requests — let all external requests (Firebase, Google APIs, CDNs) pass through
  if (url.origin !== self.location.origin) return;

  // Skip API routes
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for same-origin app files only
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
