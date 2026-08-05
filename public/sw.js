// sw.js - TARIM OS V1.0 Beta - Service Worker - يخلي التطبيق يشتغل Offline + PWA
const CACHE_NAME = 'tarim-os-v1.0-beta-king-AL';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/ai-eye.js',
  '/support.js',
  '/support-team.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('🏰 TARIM OS Service Worker Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('👑 Caching King Files');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('⚡ TARIM OS Activate - ينزل الميدان');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // لو موجود في الكاش - يرجعه بدون نت (خريطة حضرموت Offline)
      if (response) {
        return response;
      }
      // لو مو موجود - يجيبه من النت
      return fetch(event.request).catch(() => {
        // لو مافي نت
        return caches.match('/index.html');
      });
    })
  );
});
