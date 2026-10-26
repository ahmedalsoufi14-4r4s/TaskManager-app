// ─── SERVICE WORKER ──────────────────────────────────

// Bump the version whenever a cached file changes. Installing a new
// version deletes the old cache.
const CACHE_NAME = 'task-manager-v10';

// Paths are relative to this file, so the app works under /TaskManager-app/
const APP_SHELL = [
  './',
  'index.html',
  'style.css',
  'i18n.js',
  'app.js',
  'manifest.webmanifest',
  'lib/lucide-1.51.0.min.js',
  'fonts/inter-latin.woff2',
  'fonts/cairo-arabic.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Network first for the app's own files, so a new deployment shows up
// straight away, with the cache as the offline fallback. Requests to
// other sites are left to the browser.
self.addEventListener('fetch', (e) => {
  const request = e.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })
        .then(cached => cached
          || (request.mode === 'navigate' ? caches.match('./') : Response.error())))
  );
});
