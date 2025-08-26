
// Service Worker for performance optimization
const CACHE_NAME = 'almacenajes-v1';
const STATIC_ASSETS = [
  '/',
  '/en/',
  '/Images/amdlogo.webp',
  '/Images/heroimage.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Enable navigation preload
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.navigationPreload.enable()
  );
});
