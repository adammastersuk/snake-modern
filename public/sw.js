const CACHE_NAME = 'snake-modern-shell-v1';
const URLS = ['/', '/manifest.webmanifest', '/icon.svg'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
    return res;
  }).catch(() => caches.match('/'))));
});
