const CACHE_NAME = 'tarim-os-v12'; // غيرته من v11 الى v12
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/manifest.json',
  '/privacy.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.5/socket.io.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
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

// 2. التفعيل - احذف الكاش القديم v11
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
  
  // API المنشورات والمحفظة = الشبكة اول ثم الكاش
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

  // الفيديو والصور = الكاش اول ثم الشبكة
  if(req.destination === 'video' || req.destination === 'image'){
    e.respondWith(
      caches.match(req).then(res => res || fetch(req).then(fetchRes => {
        caches.open(CACHE_NAME).then(cache => cache.put(req, fetchRes.clone()));
        return fetchRes;
      }))
    );
    return;
  }

  // الباقي = الكاش اول
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
