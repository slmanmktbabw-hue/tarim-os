// public/sw.js - TARIM OS Sovereign Guard - PRODUCTION READY - OFFLINE FIRST
const CACHE_VERSION = 'v1.0.0-imperial';
const CACHE_NAME = `tarim-os-${CACHE_VERSION}`;

// 1. الأصول السيادية فقط - لا CDN - لا ملفات وهمية
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/privacy.html',
    '/app.js',
    '/ai-eye.js',
    '/support.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// 2. التثبيت - محصن ضد الفشل
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // نضيف ملف ملف حتى لو فشل واحد لا يفشل الكل
            return Promise.allSettled(
                ASSETS_TO_CACHE.map(url => 
                    cache.add(url).catch(err => console.warn(`[SW] فشل تخزين ${url}:`, err))
                )
            );
        })
    );
});

// 3. التفعيل - تنظيف الكاش القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key.startsWith('tarim-os-') && key !== CACHE_NAME) {
                        console.log(`[SW] حذف كاش قديم: ${key}`);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 4. استراتيجية الجلب السيادية - محصنة 100%
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // أ- لا تلمس أبداً: API + Socket.IO + طلبات POST
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io') || req.method !== 'GET') {
        return; // دع الشبكة تعمل
    }

    // ب- صفحات HTML: الشبكة أولاً ثم الكاش - لضمان التحديثات
    if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(req)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(req).then(cached => {
                        return cached || caches.match('/index.html');
                    });
                })
        );
        return;
    }

    // ج- الأصول المحلية (JS, CSS, Icons): الكاش أولاً ثم الشبكة - سريع كالبرق
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(req).then((cached) => {
                if (cached) {
                    // تحديث في الخلفية
                    fetch(req).then(res => {
                        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res));
                    }).catch(()=>{});
                    return cached;
                }
                return fetch(req).then(res => {
                    if (res.ok) {
                        const clone = res.clone();
                        caches.open(CACHE_NAME).then(c => c.put(req, clone));
                    }
                    return res;
                });
            })
        );
        return;
    }

    // د- مكتبات CDN (Leaflet, Tailwind): الشبكة أولاً ثم الكاش - لا نكسرها
    event.respondWith(
        fetch(req)
            .then(res => {
                // لا نخزن CDN في كاشنا لتجنب مشاكل CORS
                return res;
            })
            .catch(() => caches.match(req))
    );
});

// 5. رسالة للتأكد
console.log(`[TARIM OS] Sovereign Guard ${CACHE_VERSION} Loaded - Offline Ready`);
