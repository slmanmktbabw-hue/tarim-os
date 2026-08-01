self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('tarim-os-v2.1').then((cache) => {
            return cache.addAll(['/', '/index.html', '/script.js', '/manifest.json']);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        }).catch(() => {
            if(e.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
