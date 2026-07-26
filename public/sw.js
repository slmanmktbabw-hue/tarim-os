const CACHE_NAME = 'tarim-os-v12.1-secure';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

// تثبيت الخدمة وتأمين الملفات الأساسية
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// تفعيل الخدمة وتنظيف التخزين القديم لمنع الثغرات والتداخل
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// اعتراض الطلبات لضمان استقرار التشغيل والعمل بدون إنترنت (Offline)
self.addEventListener('fetch', (event) => {
    // استثناء طلبات قاعدة البيانات والاتصال المباشر لضمان سلامة البيانات
    if (event.request.url.includes('/api/') || event.request.url.includes('/socket.io/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
