const CACHE='tarim-v20.1-gemini-full';
const CORE=['/','/index.html','/script.js','/manifest.json'];
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=> x!==CACHE? caches.delete(x):null))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request).then(f=>{ if(f.ok) caches.open(CACHE).then(c=>c.put(e.request,f.clone())); return f; }).catch(()=>caches.match('/index.html')))); });
