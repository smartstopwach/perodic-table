/* Periodic Lab PRO v2.0 — Offline-First PWA Service Worker */
const CACHE_NAME = 'periodic-table-arena-pro-v5';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './privacy-policy.html',
  './manifest.webmanifest',
  './css/style.css',
  './css/pro-lab.css',
  './js/elements-data.js',
  './js/chemistry-pro-data.js',
  './js/mnemonics-data.js',
  './js/sound.js',
  './js/app.js',
  './js/pro-lab.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.apk')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && url.origin === self.location.origin) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkRes;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
