// sw.js - TARIM OS V1.0 Beta - Service Worker - يخلي التطبيق يشتغل Offline + PWA - تريم
const CACHE_NAME = 'tarim-os-v1.0-beta-king-AL';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/ai-eye.js',
  '/manifest.json',
  '/privacy.html'
];

self.addEventListener('install', (event) => {
  console.log('🏰 TARIM OS Service Worker Install - الملك AL');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('👑 Caching King Files - 4 ملفات سيادية');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('⚡ TARIM OS Activate - ينزل الميدان للشغل');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // لا تتدخل في API - خلي السيرفر يرد
  if(event.request.url.includes('/api/') || event.request.url.includes('/socket.io/')){
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Offline - من تريم بدون نت
      }
      return fetch(event.request).then((res)=>{
        // احفظ نسخة جديدة
        if(res.ok && event.request.method==='GET'){
          const clone=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        return caches.match('/index.html');
      });
    })
  );
});
