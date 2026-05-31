const CACHE = 'shuqingbu-v1';
const ASSETS = ['index.html', 'entries.json', 'manifest.json', 'icon-192.png', 'icon-512.png', 'mask-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {
        // Try individually if bulk fails
        ASSETS.forEach(url => cache.add(url).catch(() => {}));
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).catch(() => {
        // If fetch fails and not cached, return offline page
        if (e.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
