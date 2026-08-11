// ==============================================================================
// public/sw.js - TARIM OS V8.7 & SOUQ AL MOLOUK - SOVEREIGN SERVICE WORKER
// الحارس السيادي الآمن - مختوم بالمسك 👑🛡️
// ==============================================================================

const CACHE_VERSION = 'V8.7-FINAL-SEAL';
const CACHE_CORE = `tarim-os-souq-v8.7-core`;
const CACHE_ESM = `tarim-os-souq-v8.7-esm-shield`;
const CACHE_TILES = `tarim-os-souq-v8.7-tiles`;
const ALL_CACHES = [CACHE_CORE, CACHE_ESM, CACHE_TILES];

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/privacy.html',
  '/manifest.json',
  '/app.js',
  '/ai-eye.js',
  '/support.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

const ESM_SHIELD_ASSETS = [
  'https://esm.unpkg.com/leaflet@1.9.4?bundle&target=es2022&min',
  'https://esm.unpkg.com/leaflet@1.9.4?bundle&target=es2022&min&css',
  'https://esm.unpkg.com/socket.io-client@4.8.1?bundle&target=es2022&min'
];

const MAX_TILES = 300;
const MAX_IMAGES = 100;

// أداة تنظيف الكاش LRU
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxItems);
  }
}

// ===== 1. التثبيت =====
self.addEventListener('install', (e) => {
  console.log(`[SW ${CACHE_VERSION}] تثبيت الحارس`);
  e.waitUntil(
    (async () => {
      const coreCache = await caches.open(CACHE_CORE);
      // addAll يفشل لو ملف واحد فشل، نستخدم allSettled
      await Promise.allSettled(
        CORE_ASSETS.map(url => coreCache.add(new Request(url, {cache: 'reload', credentials: 'same-origin'})))
      );
      const esmCache = await caches.open(CACHE_ESM);
      await Promise.allSettled(ESM_SHIELD_ASSETS.map(url => esmCache.add(new Request(url, {mode: 'cors'}))));
      await self.skipWaiting();
    })()
  );
});

// ===== 2. التفعيل - تنظيف آمن =====
self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(k => {
          // لا تحذف إلا كاشاتنا القديمة فقط - Whitelist
          if (k.startsWith('tarim-os-souq-') &&!ALL_CACHES.includes(k)) {
            console.log('[SW] حذف كاش قديم:', k);
            return caches.delete(k);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// ===== 3. الجلب - الاستراتيجية السيادية الآمنة =====
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // تجاهل طلبات ليست http/https وطلبات غير GET
  if (!url.protocol.startsWith('http')) return;
  if (req.method!== 'GET') return; // لا تعترض POST/PUT/DELETE
  if (url.pathname.startsWith('/chrome-extension')) return;

  // أ. API & Socket.io - Network Only + Offline JSON
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    e.respondWith(
      fetch(req, {credentials: 'same-origin'}).catch(() =>
        new Response(JSON.stringify({ success: false, message: 'Offline - TARIM OS V8.7' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        })
      )
    );
    return;
  }

  // ب. الخرائط - Cache First مع حد أقصى
  if (url.hostname.includes('tile.openstreetmap.org')) {
    e.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_TILES);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.ok) {
            await cache.put(req, res.clone());
            trimCache(CACHE_TILES, MAX_TILES);
          }
          return res;
        } catch { return cached; }
      })()
    );
    return;
  }

  // ج. درع ESM Shield - Cache First آمن
  if (url.hostname === 'esm.unpkg.com') {
    e.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_ESM);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req, {mode: 'cors'});
          if (res && res.ok) await cache.put(req, res.clone());
          return res;
        } catch { return cached || Response.error(); }
      })()
    );
    return;
  }

  // د. الصور والكنوز - Stale While Revalidate مع حماية
  if (req.destination === 'image' || url.pathname.includes('/uploads/')) {
    e.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_CORE);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then(res => {
          if (res && res.ok && res.type!== 'opaque') {
            cache.put(req, res.clone());
            trimCache(CACHE_CORE, MAX_IMAGES + CORE_ASSETS.length);
          }
          return res;
        }).catch(() => null);
        return cached || await fetchPromise || Response.error();
      })()
    );
    return;
  }

  // هـ. الصفحات - Network First ثم Cache ثم index.html
  e.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok && url.origin === self.location.origin) {
          const cache = await caches.open(CACHE_CORE);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('Offline', {status: 503});
      }
    })()
  );
});

// ===== 4. استقبال الرسائل - مؤمن =====
self.addEventListener('message', (e) => {
  // حماية: اقبل رسائل من نفس الأصل فقط
  if (e.origin!== self.location.origin) return;

  const data = e.data;
  if (data === 'SKIP_WAITING' || data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (data && data.type === 'GET_VERSION' && e.ports && e.ports[0]) {
    e.ports[0].postMessage(CACHE_VERSION);
  }
  // تم إلغاء clearCache المفتوح - الآن يحتاج تأكيد
  if (data && data.type === 'CLEAR_SOVEREIGN_CACHE' && data.confirm === true) {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('tarim-os-souq-')).map(k => caches.delete(k)))));
  }
});

// ===== 5. المزامنة - مصحح =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders' || event.tag === 'sync-royal-orders') {
    event.waitUntil(
      (async () => {
        console.log('🔄 مزامنة الطلبات المعلقة...');
        // هنا ضع كود قراءة IndexedDB وإرسال الطلبات
        // مثال: await syncPendingOrdersFromIDB();
        return true;
      })()
    );
  }
});
