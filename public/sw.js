// public/sw.js - TARIM OS Service Worker (Sovereign Edition)
const CACHE_NAME = 'tarim-os-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/ai-eye.js',
    '/support.js',
    '/manifest.json',
    '/privacy.html',
    '/icon.png',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch((err) => {
            console.log('Cache install error:', err);
        })
    );
    self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
    // لملفات الـ HTML والصفحات الرئيسية: الشبكة أولاً ثم التخزين المؤقت لضمان ظهور التحديثات
    if (event.request.mode === 'navigate' || event.request.url.endsWith('.html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // باقي الأصول والمكتبات: التخزين المؤقت أولاً ثم الشبكة
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || (response.type !== 'basic' && !event.request.url.startsWith('http'))) {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            });
        })
    );
});
