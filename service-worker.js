const CACHE_NAME = 'cofre-v3';
const BASE = '/password-manager/'; // importante para GitHub Pages com projeto em subpasta

const PRECACHE_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'style.css',
  BASE + 'script.js',
  BASE + 'manifest.json',
  BASE + 'senhas.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Somente servir recursos do mesmo scope/base (evita problemas com recursos externos)
  if (!event.request.url.startsWith(self.location.origin + BASE)) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached ||
        fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(() => caches.match(BASE + 'index.html'))
      )
  );
});
