const CACHE_NAME = 'todo-pwa-v6-features';

const ASSETS = [
  './',
  './index.html',
  './dist/output.css',
  './flowbite.min.js',
  './fa.js',
  './app.js',
  './manifest.json',
  './assets/armin.png',
  './assets/sasan.webp',
  './assets/favicon.png',
  './assets/latifi.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-512.png',
  './fonts/Vazirmatn-Regular.woff2',
  './fonts/Vazirmatn-Medium.woff2',
  './fonts/Vazirmatn-SemiBold.woff2',
  './fonts/Vazirmatn-Bold.woff2',
  './fonts/Vazirmatn-Latin-Regular.woff2',
  './fonts/Vazirmatn-Latin-Medium.woff2',
  './fonts/Vazirmatn-Latin-SemiBold.woff2',
  './fonts/Vazirmatn-Latin-Bold.woff2',
  './fonts/Nunito-Regular.woff2',
  './fonts/Nunito-Medium.woff2',
  './fonts/Nunito-SemiBold.woff2',
  './fonts/Nunito-Bold.woff2'
];

// Install: Cache all shell assets including new latifi logo
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Delete legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: Cache-first, fallback to network (do NOT cache external Gemini API requests)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return; // Pass through to network
  }
  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
