// TARIM OS V11.1 Sovereign - sw.js - Offline عالمي 100%
const CACHE_NAME = 'tarim-os-v11.1-sovereign-2026';
const DOMAIN = 'https://tarimos.org';

// 1- تعريف الدومين في التخزين + تعريف الكود في التطبيق - كل الملفات مربوطة بدون صراعات
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/script.js',
  '/manifest.json',
  '/privacy.html',
  '/icon-192.png',
  '/icon-512.png'
];

// 2- تعريف الكود في الاستضافة - تثبيت فوري
self.addEventListener('install', (e) => {
  console.log('🏰 TARIM OS Install - tarimos.org');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  console.log('🌍 TARIM OS Activate - عالمي');
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k!== CACHE_NAME) {
            console.log('🗑️ حذف كاش قديم:', k);
            return caches.delete(k);
          }
        })
      );
    }).then(()=> self.clients.claim())
  );
});

// 3- التطبيق ينزل من المتصفح + فيديوهات دون اتصال + خريطة Offline + حماية حساب
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // لا نكاش API - دائماً من السيرفر - حماية حساب المستخدم + رصيد + هدايا
  if(url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')){
    e.respondWith(
      fetch(e.request).catch(()=> {
        return new Response(JSON.stringify({ error: 'Offline - سيتم المزامنة عند الاتصال' }), { headers: {'Content-Type':'application/json'} });
      })
    );
    return;
  }

  // خريطة تريم Offline - Leaflet tiles
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

  // استراتيجية Cache First للملفات الأساسية - 5 أزرار + إنشاء + عمليات
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if(cached) return cached;
      return fetch(e.request).then((networkResponse)=>{
        // حفظ تلقائي للصور والفيديوهات الصغيرة Offline
        if(e.request.method==='GET' && networkResponse.ok && (url.pathname.match(/\.(png|jpg|jpeg|webp|mp4|webm|js|css|html)$/))){
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache=> cache.put(e.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        if(e.request.mode === 'navigate'){
          return caches.match('/index.html');
        }
        return new Response('Offline - TARIM OS - tarimos.org 🏰', { status: 200, headers: {'Content-Type':'text/plain'} });
      });
    })
  );
});

// 4- فيديوهات دون اتصال + تخزين بيانات + الملفات
self.addEventListener('message', (e)=>{
  if(e.data && e.data.type==='CACHE_VIDEO'){
    const videoUrl = e.data.url;
    e.waitUntil(
      caches.open(CACHE_NAME+'-videos').then(cache=> cache.add(videoUrl))
    );
  }
  if(e.data && e.data.type==='GET_VERSION'){
    e.ports[0].postMessage({ version: CACHE_NAME, domain: DOMAIN, okx:'0x53ce5e429ac48f355b775e418ded0b13931c0af6' });
  }
});

// 5- إشعارات - الإعدادات والخصوصية - الإشعارات + الوقت والرفاهية
self.addEventListener('push', (e)=>{
  const data = e.data? e.data.json() : { title:'TARIM OS', body:'🔴 بث مباشر جديد من تريم' };
  e.waitUntil(
    self.registration.showNotification(data.title||'TARIM OS - tarimos.org', {
      body: data.body||'الإمبراطور AL يبث الآن 🏰',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200,100,200],
      data: { url: 'https://tarimos.org' }
    })
  );
});

self.addEventListener('notificationclick', (e)=>{
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url||'https://tarimos.org'));
});

console.log('🏰 TARIM OS V11.1 SW Loaded - فريق الدعم يمين + عين Gemini شمال + 5 أزرار + عمليات (بث 8د + مراسلة + خريطة Offline + QR) + إنشاء (صورة نص + منشور + LIVE + كاميرا أمامية خلفية + فلاش + فلتر + هدايا لايكات تعليق) + الوارد + الملفات (رصيد + أنشطة + Offline + QR + تجارية + ترويج + 13 إعداد + مشاركة + خلفية) - عالمي شغال بدون صراعات - data/ خارج public - bcrypt - helmet - gifts 70% - OKX 0x53ce...af6');
