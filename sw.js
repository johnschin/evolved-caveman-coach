// Evolved Caveman AI Coach — Service Worker
const CACHE_NAME = 'ec-coach-v1';
const STATIC_ASSETS = [
  '/ai_coach.html',
  '/manifest.json'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache for the app shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network-first for API calls (Supabase, Cloudflare proxy)
  if (url.hostname.includes('supabase.co') || url.hostname.includes('workers.dev')) {
    return; // Let the browser handle it normally
  }

  // For app shell — network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for static assets
        if (response.ok && STATIC_ASSETS.some(a => url.pathname.endsWith(a.replace('/', '')))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
