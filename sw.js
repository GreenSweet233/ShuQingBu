const CACHE = 'shuqingbu-v1';
const CORE = ['index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
const DATA_CACHE = 'shuqingbu-data';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Cache large data files on first fetch, not at install time
  if (url.pathname.endsWith('entries.json')) {
    e.respondWith(
      caches.open(DATA_CACHE).then(cache =>
        cache.match(e.request).then(cached =>
          (cached || fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          }))
        )
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('index.html');
      })
    )
  );
});
