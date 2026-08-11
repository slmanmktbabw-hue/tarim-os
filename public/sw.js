// public/sw.js - TARIM OS V7.4 - Sovereign Offline Guard FORTRESS
const CACHE_CORE = 'tarim-os-v7-4-core';
const CACHE_TILES = 'tarim-os-v7-4-tiles';
const CACHE_VERSION = 'V7.4 FORTRESS';

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

// لا نخزن ESM في install أبداً - نجلبه عند الحاجة فقط
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_CORE)
     .then(c => c.addAll(CORE_ASSETS))
     .then(() => self.skipWaiting())
     .catch(() => self.skipWaiting()) // حتى لو فشل كاش، لا تعلق التثبيت
  );
});

self.addEventListener('activate', (e) => {
  const allowed = [CACHE_CORE, CACHE_TILES];
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        // احذف أي كاش لا يبدأ بـ tarim-os-v7-4-
        if (!allowed.includes(k) && k.startsWith('tarim-os-')) {
          return caches.delete(k);
        }
        // احذف الكاش القديم v7-3-1 نهائياً
        if (k.includes('v7-3-1')) return caches.delete(k);
      })
    )).then(() => self.clients.claim())
  );
});

// دالة تنظيف كاش الخرائط - حد أقصى 150 صورة
async function trimTileCache() {
  const cache = await caches.open(CACHE_TILES);
  const keys = await cache.keys();
  if (keys.length > 150) {
    await cache.delete(keys[0]); // احذف الأقدم
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (!url.protocol.startsWith('http')) return;
  // لا تتعامل إلا مع GET
  if (e.request.method!== 'GET') return;

  // 1. API و Socket - Network Only - لا تلمس الكاش أبداً
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/') || url.pathname === '/api' || url.pathname === '/share') {
    return e.respondWith(
      fetch(e.request, { cache: 'no-store' })
       .catch(() => new Response(JSON.stringify({ ok:false, offline:true }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }))
    );
  }

  // 2. خريطة حضرموت - Stale While Revalidate مع حد وبدون opaque
  if (url.hostname.includes('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open(CACHE_TILES).then(async cache => {
        const cached = await cache.match(e.request);
        const fetchPromise = fetch(e.request).then(res => {
          // لا تخزن opaque أبداً - فقط ok حقيقي
          if (res && res.ok && res.type!== 'opaque') {
            cache.put(e.request, res.clone()).then(() => trimTileCache()).catch(()=>{});
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. ESM - Network First مع سقوط للكاش - لا تخزن للأبد
  if (url.hostname === 'esm.unpkg.com' || url.hostname === 'esm.sh') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(res => {
        if (res && res.ok) {
          // خزن مؤقتاً فقط، وسيتم تحديثه في كل مرة
          const clone = res.clone();
          caches.open(CACHE_CORE).then(c => c.put(e.request, clone)).catch(()=>{});
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // 4. الملفات الأساسية - Cache First لكن فقط لنفس الأصل
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          // لا تخزن إلا صفحات وأصول ثابتة، وليس API
          if (res && res.ok && res.headers.get('content-type')?.match(/text\/html|javascript|css|image\/png/)) {
            const clone = res.clone();
            caches.open(CACHE_CORE).then(c => c.put(e.request, clone)).catch(()=>{});
          }
          return res;
        }).catch(() => {
          if (e.request.mode === 'navigate') return caches.match('./index.html');
        });
      })
    );
  }
});

// رسائل محصنة - تقبل فقط من نفس الأصل
self.addEventListener('message', (e) => {
  // تحقق أن الرسالة من نافذة تابعة لنا
  if (!e.source) return;
  if (e.data === 'SKIP_WAITING') {
    // فقط إذا كان العميل من نفس الأصل
    self.skipWaiting();
  }
});
