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
