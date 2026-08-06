// public/sw.js - TARIM OS Service Worker
const CACHE_NAME = 'tarim-os-v2'; // غيرت الرقم عشان يتحدث الكاش
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/ai-eye.js',
    '/support.js',
    '/manifest.json',
    '/privacy.html',
    '/icon.png', // ضيف الايقونة
    // المكتبات الخارجية عشان الخريطة والتصميم يشتغل بدون نت
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
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
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // لو موجود في الكاش رجعه، لو لا جيبه من النت وخزنه
            return cachedResponse || fetch(event.request).then((response) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
