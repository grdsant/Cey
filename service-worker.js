/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'cey-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.webmanifest',
  './icon.svg',
  './00.jpg',
  './01.jpg',
  './02.jpg',
  './03.jpg',
  './04.jpg',
  './05.jpg',
  './06.jpg',
  './07.jpg',
  './08.jpg',
  './09.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(PRECACHE_URLS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_VERSION ? Promise.resolve() : caches.delete(k))));
      self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  event.respondWith(
    (async () => {
      const url = new URL(req.url);

      // For navigation, serve app shell offline.
      if (req.mode === 'navigate') {
        try {
          const net = await fetch(req);
          const cache = await caches.open(CACHE_VERSION);
          cache.put('./index.html', net.clone());
          return net;
        } catch {
          const cache = await caches.open(CACHE_VERSION);
          return (await cache.match('./index.html')) || (await cache.match('./'));
        }
      }

      // Cache-first for same-origin assets.
      if (url.origin === self.location.origin) {
        const cache = await caches.open(CACHE_VERSION);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const net = await fetch(req);
          cache.put(req, net.clone());
          return net;
        } catch {
          return cached;
        }
      }

      // Network-first for cross-origin.
      try {
        return await fetch(req);
      } catch {
        const cache = await caches.open(CACHE_VERSION);
        return await cache.match(req);
      }
    })()
  );
});
