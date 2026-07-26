const CACHE_NAME = 'tarim-v12.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.socket.io/4.7.2/socket.io.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js'
];

self.addEventListener('install', event => {
  console.log('🛡️ Tarim_Core تثبت...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // يرجع من الكاش اذا موجود، وإلا من النت
        return response || fetch(event.request).then(res=>{
          // يحفظ خريطة حضرموت للـ Offline
          if(event.request.url.includes('tile.openstreetmap')){
            caches.open(CACHE_NAME).then(c=>c.put(event.request, res.clone()));
          }
          return res;
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.filter(n=>n!==CACHE_NAME).map(n=>caches.delete(n))
      );
    })
  );
});
