// TARIM OS V11.2 Sovereign - sw.js - Offline 100% عالمي - لا يكاش API
const CACHE_NAME = 'tarim-os-v11.2-sovereign-2026';
const DOMAIN = 'https://tarimos.org';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/script.js',
  '/manifest.json',
  '/privacy.html',
  '/icon-192.png',
  '/icon-512.png'
];

// 1- تثبيت - كل الملفات مربوطة بدون صراعات
self.addEventListener('install', (e) => {
  console.log('🏰 TARIM OS Install - tarimos.org');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(()=> self.skipWaiting())
  );
});

// 2- تفعيل - حذف كاش قديم
self.addEventListener('activate', (e) => {
  console.log('🌍 TARIM OS Activate - عالمي');
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME && k !== CACHE_NAME+'-map') {
            console.log('🗑️ حذف كاش قديم:', k);
            return caches.delete(k);
          }
        })
      );
    }).then(()=> self.clients.claim())
  );
});

// 3- Fetch - Offline + فيديوهات بدون اتصال + خريطة + حماية حساب
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // دائماً من السيرفر - حماية حساب المستخدم + رصيد + هدايا - لا نكاش API
  if(url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')){
    e.respondWith(
      fetch(e.request).catch(()=> {
        return new Response(JSON.stringify({ error: 'Offline - سيتم المزامنة عند الاتصال' }), { headers: {'Content-Type':'application/json'} })
      })
    );
    return;
  }

  // Offline - Leaflet tiles - خريطة تريم
  if(url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('unpkg.com')){
    e.respondWith(
      caches.open(CACHE_NAME+'-map').then(cache=>{
        return cache.match(e.request).then(res=>{
          return res || fetch(e.request).then(netRes=>{
            cache.put(e.request, netRes.clone());
            return netRes;
          });
        });
      })
    );
    return;
  }

  // الملفات الأساسية - Cache First + تحديث
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if(cached) return cached;
      return fetch(e.request).then((networkResponse)=>{
        // حفظ تلقائي للصور والفيديوهات الصغيرة Offline
        if(e.request.method==='GET' && networkResponse.ok && (url.pathname.match(/\.(png|jpg|jpeg|webp|mp4|webm|js|css|html)$/) || PRECACHE_URLS.includes(url.pathname))){
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache=> cache.put(e.request, clone));
        }
        return networkResponse;
      }).catch(()=>{
        // لو بدون نت افتح الرئيسية
        if(e.request.mode==='navigate'){
          return caches.match('/index.html');
        }
      })
    })
  );
});
