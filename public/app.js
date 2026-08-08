// public/app.js - TARIM OS V7.3.1 FINAL SEAL - API + OFFLINE - ESM SHIELD
// 🐉◈⚖️👑 tarimos.org - FINAL SEAL - لا يسقط أبداً
"use strict";

const $ = (id) => document.getElementById(id);
const API = '/api';
const esc = (s) => { const d = document.createElement('div'); d.textContent = String(s || '').substring(0, 2000); return d.innerHTML; };
const sanitize = (s) => String(s || '').trim().substring(0, 2000).replace(/</g, '').replace(/>/g, '').replace(/javascript:/gi, '');

function getToken(){ return localStorage.getItem('tarim_token_v73'); }
function setToken(t){ localStorage.setItem('tarim_token_v73', t); }
function getSession(){ return localStorage.getItem('tarim_session_v73'); }
function setSession(u){ localStorage.setItem('tarim_session_v73', u); }
function authHeader(){ const t = getToken(); return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }; }

function toast(msg, type = 'ok'){
  const box = $('toastBox'); if(!box) return;
  const el = document.createElement('div'); el.textContent = msg;
  el.style.cssText = `background:${type === 'err' ? '#f43f5e' : '#00B4D8'};color:${type === 'err' ? '#fff' : '#000'};padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.4)`;
  box.appendChild(el); setTimeout(() => el.remove(), 3200);
}

let currentStream = null, liveStream = null, facingMode = 'environment', mapInstance = null, socket = null;
let filterIdx = 0, liveTimerInt = null, liveSec = 0, lightOn = false;
const filters = ['none', 'grayscale(1)', 'sepia(.8)', 'contrast(1.4) brightness(1.1)', 'hue-rotate(90deg) saturate(1.5)', 'brightness(1.3)'];

function stopAllStreams(){
  if(currentStream) currentStream.getTracks().forEach(t => t.stop()); currentStream = null;
  if(liveStream) liveStream.getTracks().forEach(t => t.stop()); liveStream = null;
  if(liveTimerInt) clearInterval(liveTimerInt); liveTimerInt = null;
}

async function apiFetch(path, opts = {}){
  try{
    const res = await fetch(API + path, { ...opts, headers: { ...authHeader(), ...(opts.headers || {}) } });
    const data = await res.json().catch(() => ({ message: 'Offline' }));
    if(!res.ok) throw new Error(data.message || 'خطأ سيادي');
    return data;
  } catch(e){ throw e; }
}

// OFFLINE FALLBACK - يحفظ محلياً إذا السيرفر نايم
function getPostsLocal(){ try{ return JSON.parse(localStorage.getItem('tarim_posts_v73') || '[]'); } catch{ return []; } }
function savePostsLocal(p){ localStorage.setItem('tarim_posts_v73', JSON.stringify(p)); }

async function loadFeed(){
  const feed = $('postsFeed'); if(!feed) return;
  feed.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px">⏳ جلب المنشورات V7.3.1 FINAL...</p>';
  try{
    const { posts } = await apiFetch('/posts');
    feed.innerHTML = '';
    if(!posts || posts.length === 0){
      feed.innerHTML = '<p style="text-align:center;color:#22d3ee;padding:40px">👑 لا منشورات - كن أول من ينشر<br><small>tarimos.org V7.3.1 FINAL</small></p>';
      savePostsLocal([]);
      return;
    }
    savePostsLocal(posts);
    renderPosts(posts);
  } catch(e){
    // السيرفر نايم - اعرض المحلي
    const local = getPostsLocal();
    if(local.length > 0){ toast('📡 Offline - عرض المحلي', 'err'); renderPosts(local); }
    else feed.innerHTML = `<p style="text-align:center;color:#f43f5e;padding:40px">❌ ${esc(e.message)}<br><small>Render نايم - انتظر 50 ثانية</small></p>`;
  }
}

function renderPosts(posts){
  const feed = $('postsFeed'); feed.innerHTML = '';
  posts.slice().reverse().forEach(p => {
    const card = document.createElement('div'); card.className = 'tiktok-card';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#22d3ee;font-weight:800">@${esc(p.username || p.user)} 👑</span><span style="color:#94a3b8">${new Date(p.createdAt || Date.now()).toLocaleTimeString('ar')}</span></div>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:20px">
        <div style="width:68px;height:68px;border-radius:50%;background:#00B4D8;color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px">${esc((p.username || p.user || 'AL').substring(0, 2).toUpperCase())}</div>
        <p style="color:#fff;font-size:14px;line-height:1.8;max-width:86%">${esc(p.content || p.text)}</p>
        <p style="color:#22d3ee;font-size:11px">tarimos.org • V7.3.1 FINAL SEAL</p>
      </div>
      <div style="position:absolute;left:12px;bottom:80px;display:flex;flex-direction:column;gap:16px">
        <button class="tiktok-act" data-like="${p.id}"><b>❤️</b><span>${p.likes || 0}</span></button>
        <button class="tiktok-act" data-comment="${p.id}"><b>💬</b><span>${p.commentsCount || p.comments || 0}</span></button>
        <button class="tiktok-act" data-share="${p.id}"><b>🚀</b><span>مشاركة</span></button>
      </div>`;
    feed.appendChild(card);
  });
  feed.querySelectorAll('[data-like]').forEach(el => {
    el.addEventListener('click', async() => {
      if(!getToken()){ toast('سجل دخول أولاً', 'err'); return; }
      try{ const { likes } = await apiFetch(`/posts/${el.getAttribute('data-like')}/like`, { method: 'POST' }); el.querySelector('span').textContent = likes; toast('❤️ تم'); } catch(e){ toast(e.message, 'err'); }
    });
  });
}

async function handleLogin(){
  const u = $('userPhoneOrEmail')?.value.trim(); const p = $('userPass')?.value; const err = $('loginError');
  if(!u || !p){ if(err){ err.textContent = 'اكتب الاسم وكلمة السر'; err.style.display = 'block'; } return; }
  try{
    if(err) err.style.display = 'none';
    const btn = $('loginBtn'); if(btn){ btn.disabled = true; btn.textContent = 'جاري الدخول FINAL...'; }
    const data = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
    setToken(data.token); setSession(data.user.username); openApp(data.user.username);
  } catch(e){ if(err){ err.textContent = e.message; err.style.display = 'block'; } toast(e.message, 'err'); }
  finally{ const btn = $('loginBtn'); if(btn){ btn.disabled = false; btn.textContent = 'دخول سيادي V7.3.1 👑'; } }
}

function openApp(username){
  const gate = $('authGate'); if(gate){ gate.classList.add('hidden'); gate.style.display = 'none'; }
  const nameEl = $('profileNameDisplay'); if(nameEl) nameEl.textContent = 'الإمبراطور ' + username + ' FINAL';
  const avEl = $('profileAvatar'); if(avEl) avEl.textContent = username.substring(0, 2).toUpperCase();
  toast(`أهلاً بك يا ${username} - FINAL SEAL 👑`); loadFeed();
}

window.switchTab = function(tab, btn){
  stopAllStreams();
  document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(x => { if(x.dataset.tab !== 'create'){ x.style.color = '#94a3b8'; x.classList.remove('nav-active'); } });
  const activeBtn = btn || document.querySelector(`[data-tab="${tab}"]`);
  if(activeBtn && tab !== 'create'){ activeBtn.style.color = '#22d3ee'; activeBtn.classList.add('nav-active'); }
  if(tab === 'create') initCamera();
  if(tab === 'home') loadFeed();
  window.scrollTo(0, 0);
};
document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => { const t = btn.dataset.tab; if(t) window.switchTab(t, btn); }));

async function initCamera(){
  const preview = $('cameraPreview'); if(!preview) return;
  try{ stopAllStreams(); currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 } }, audio: true }); preview.srcObject = currentStream; } catch{ toast('الكاميرا مرفوضة', 'err'); }
}
$('switchCamBtn')?.addEventListener('click', () => { facingMode = facingMode === 'environment' ? 'user' : 'environment'; initCamera(); });
$('filterBtn')?.addEventListener('click', () => { filterIdx = (filterIdx + 1) % filters.length; const pv = $('cameraPreview'); if(pv) pv.style.filter = filters[filterIdx]; });
$('lightBtn')?.addEventListener('click', () => { lightOn = !lightOn; const ov = $('lightOverlay'); if(ov) ov.style.background = lightOn ? 'rgba(255,255,210,.22)' : 'transparent'; });
$('publishBtn')?.addEventListener('click', async() => {
  const input = $('postContentInput'); const content = sanitize(input.value);
  if(!content){ toast('اكتب شيئاً', 'err'); return; }
  if(!getToken()){ toast('سجل دخول أولاً', 'err'); return; }
  try{ $('publishBtn').disabled = true; await apiFetch('/posts', { method: 'POST', body: JSON.stringify({ content }) }); input.value = ''; toast('🚀 تم النشر FINAL'); window.switchTab('home', document.querySelector('[data-tab="home"]')); loadFeed(); } catch(e){ toast(e.message, 'err'); } finally{ $('publishBtn').disabled = false; }
});

// MAP + QR
function openMap(){
  const ms = $('mapScreen'); if(!ms) return; ms.classList.remove('hidden'); ms.style.display = 'flex';
  setTimeout(() => { 
    if(!window.L) { toast('Leaflet لم يحمل - تحقق من esm.unpkg.com', 'err'); return; }
    if(!mapInstance){ mapInstance = L.map('mapContainer').setView([16.0545, 49.0], 14); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapInstance); L.marker([16.0545, 49.0]).addTo(mapInstance).bindPopup('<b>🏰 قلعة تريم FINAL</b><br>V7.3.1').openPopup(); } else mapInstance.invalidateSize();
  }, 400);
}
$('opsMapBtn')?.addEventListener('click', openMap);
$('closeMapBtn')?.addEventListener('click', () => $('mapScreen').classList.add('hidden'));
$('opsQrBtn')?.addEventListener('click', () => { const d = $('qrDisplay'); d?.classList.remove('hidden'); toast('🔐 QR FINAL جاهز'); });
$('qrBtn')?.addEventListener('click', () => { window.switchTab('operations', document.querySelector('[data-tab="operations"]')); setTimeout(() => $('qrDisplay')?.classList.remove('hidden'), 400); });

$('loginBtn')?.addEventListener('click', handleLogin);
$('userPass')?.addEventListener('keydown', e => { if(e.key === 'Enter') handleLogin(); });
$('logoutBtn')?.addEventListener('click', () => { localStorage.clear(); location.reload(); });

const sess = getSession(), tok = getToken();
if(sess && tok){ const g = $('authGate'); if(g){ g.classList.add('hidden'); g.style.display = 'none'; } setTimeout(loadFeed, 100); }

console.log('👑 TARIM OS V7.3.1 FINAL SEAL - app.js API MODE - tarimos.org LIVE');
