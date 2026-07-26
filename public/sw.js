// TARIM OS v12.1 - القلعة السيادية - Offline Engine
const CACHE_NAME = 'tarim-v12.1-fusion';
const CORE_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('🛡️ TARIM Core: جاري تثبيت القلعة...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('⚡ TARIM Core: تم التفعيل - مسح الكاش القديم');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. خريطة حضرموت - استراتيجية التخزين أولاً
  if (url.includes('tile.openstreetmap.org') || url.includes('unpkg.com/leaflet')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  // 2. باقي الملفات - الشبكة أولاً ثم الكاش
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // حدث الكاش
        if (res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return res;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
  );
});
