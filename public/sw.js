// public/sw.js - TARIM OS Service Worker (النسخة الإمبراطورية المحدثة)
const CACHE_NAME = 'tarim-os-v4';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/ai-eye.js',
    '/support.js',
    '/manifest.json',
    '/privacy.html'
];

// تثبيت الكاش الجديد وتخطي الانتظار فوراً
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// تفعيل السيرفيس ونسف الكاش القديم بالكامل لضمان قراءة التحديثات الجديدة
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
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// اعتراض الطلبات وتحديثها مباشرة من الشبكة أولاً، وإلا فاللجوء للكاش
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || caches.match('/index.html');
            });
        })
    );
});
