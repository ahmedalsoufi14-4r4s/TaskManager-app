// ─── SERVICE WORKER ──────────────────────────────────

// Bump the version whenever a cached file changes. Installing a new
// version deletes the old cache.
const CACHE_NAME = 'task-manager-v24';

// Paths are relative to this file, so the app works under /TaskManager-app/
const APP_SHELL = [
  './',
  'index.html',
  'style.css',
  'i18n.js',
  'semantic.js',
  'semantic-worker.js',
  'tour.js',
  'tour.css',
  'ai.js',
  'ai.css',
  'app.js',
  'manifest.webmanifest',
  'lib/lucide-1.51.0.min.js',
  'fonts/inter-latin.woff2',
  'fonts/cairo-arabic.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

// Smart search runtime: fetched only when smart search is first turned on,
// then served from its own cache, which app updates keep (the file names
// carry the version). The model files are cached by Transformers.js in
// 'transformers-cache', which is kept too.
const RUNTIME_CACHE = 'task-manager-smart-search';
const RUNTIME_FILES = [
  'lib/transformers-4.3.2.min.js',
  'lib/ort-wasm-simd-threaded-1.31.0-dev.20260914.mjs',
];
const KEPT_CACHES = [CACHE_NAME, RUNTIME_CACHE, 'transformers-cache'];

const isRuntimeFile = url => RUNTIME_FILES.some(file => url.endsWith(`/${file}`));

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Old app caches go, and so do runtime files from older versions
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all([
        ...keys.filter(key => !KEPT_CACHES.includes(key)).map(key => caches.delete(key)),
        keys.includes(RUNTIME_CACHE) && caches.open(RUNTIME_CACHE)
          .then(cache => cache.keys().then(requests => Promise.all(requests
            .filter(request => !isRuntimeFile(request.url))
            .map(request => cache.delete(request))))),
      ]))
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

  if (isRuntimeFile(request.url)) {
    e.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => cache.match(request).then(cached => cached
        || fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })))
    );
    return;
  }

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
