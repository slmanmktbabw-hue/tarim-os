// public/sw.js - TARIM OS V8.6 KING EDITION - Sovereign Offline Guard - ESM Shield
const CACHE_CORE = 'tarim-os-v8-6-core';
const CACHE_ESM = 'tarim-os-v8-6-esm-shield';
const CACHE_TILES = 'tarim-os-v8-6-tiles';
const CACHE_VERSION = 'V8.6 KING EDITION - ESM Shield - esm.unpkg.com?bundle&target=es2022&min';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './app.js',
  './ai-eye.js',
  './support.js',
  './privacy.html',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const ESM_SHIELD_ASSETS = [
  'https://esm.unpkg.com/leaflet@1.9.4?bundle&target=es2022&min',
  'https://esm.unpkg.com/leaflet@1.9.4?bundle&target=es2022&min&css',
  'https://esm.unpkg.com/socket.io-client@4.8.1?bundle&target=es2022&min'
];

// تثبيت - حفظ القلب ودرع ESM
self.addEventListener('install', (e) => {
  console.log(`[SW ${CACHE_VERSION}] تثبيت الحارس السيادي V8.6`);
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_CORE).then(c => c.addAll(CORE_ASSETS)),
      caches.open(CACHE_ESM).then(c => c.addAll(ESM_SHIELD_ASSETS))
    ]).then(() => self.skipWaiting())
  );
});

// تفعيل - حذف الكاش القديم
self.addEventListener('activate', (e) => {
  console.log(`[SW ${CACHE_VERSION}] تفعيل وتنظيف الكاش القديم`);
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if (!k.includes('v8-6')) {
          console.log('[SW] حذف كاش قديم:', k);
          return caches.delete(k);
        }
      })
    )).then(() => self.clients.claim())
  );
});

// جلب - استراتيجية سيادية ثلاثية
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. لا تحفظ API أبداً - JWT حساس
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    return e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ message: 'Offline - السيرفر غير متصل V8.6' }), { status: 503, headers: { 'Content-Type': 'application/json' } }))
    );
  }

  // 2. خريطة حضرموت - Cache First مع التخزين الديناميكي
  if (url.hostname.includes('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open(CACHE_TILES).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // 3. درع ESM - esm.unpkg.com - Cache First دائم
  if (url.hostname === 'esm.unpkg.com') {
    e.respondWith(
      caches.open(CACHE_ESM).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // 4. باقي الملفات - Cache First ثم شبكة ثم index.html
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && url.origin === location.origin) {
          const clone = res.clone();
          caches.open(CACHE_CORE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// رسائل من app.js
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION' && e.ports && e.ports[0]) {
    e.ports[0].postMessage(CACHE_VERSION);
  }
});

console.log(`[SW] ${CACHE_VERSION} - الحارس السيادي جاهز - Offline First - تريم حضرموت`);
