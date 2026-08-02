const CACHE_NAME = 'tarim-os-v12.1'; // رفعنا الرقم عشان يمسح الكاش القديم
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/manifest.json',
  '/privacy.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.5/socket.io.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  // مكتبة الخريطة
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// 1. التثبيت - خزن الاساسيات
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // فعل التحديث فوراً
});

// 2. التفعيل - احذف الكاش القديم
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. الجلب - استراتيجية ذكية
self.addEventListener('fetch', (e) => {
  const req = e.request;
  
  // 1. خزن tiles الخريطة من OSM - اهم شي للـ Offline
  if(req.url.includes('tile.openstreetmap.org')){
    e.respondWith(
      caches.open(CACHE_NAME).then(cache => 
        cache.match(req).then(res => res || fetch(req).then(fetchRes => {
          cache.put(req, fetchRes.clone());
          return fetchRes;
        }).catch(() => cache.match(req)))
      )
    );
    return;
  }
  
  // 2. API المنشورات والمحفظة = الشبكة اول ثم الكاش
  if(req.url.includes('/api/')){
    e.respondWith(
      fetch(req).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 3. الفيديو والصور = الكاش اول ثم الشبكة
  if(req.destination === 'video' || req.destination === 'image'){
    e.respondWith(
      caches.match(req).then(res => res || fetch(req).then(fetchRes => {
        caches.open(CACHE_NAME).then(cache => cache.put(req, fetchRes.clone()));
        return fetchRes;
      }))
    );
    return;
  }

  // 4. الباقي = الكاش اول
  e.respondWith(
    caches.match(req).then((response) => {
      return response || fetch(req).catch(() => {
        if(req.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
