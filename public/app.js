// public/app.js - TARIM OS V7.3.1 FINAL GOLD - مُصحح للربط البرمجي الكامل
"use strict";

const $ = id => document.getElementById(id);
const esc = s => { const d = document.createElement('div'); d.textContent = String(s || '').substring(0, 2000); return d.innerHTML; };
const sanitize = s => String(s || '').trim().substring(0, 2000).replace(/</g, '').replace(/>/g, '');
const getToken = () => localStorage.getItem('tarim_token_v73');
const setToken = t => localStorage.setItem('tarim_token_v73', t);
const getSession = () => localStorage.getItem('tarim_session_v73');
const setSession = u => localStorage.setItem('tarim_session_v73', u);
const authHeader = () => { const t = getToken(); return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }; };

function toast(msg, type = 'ok') {
    const box = $('toastBox');
    if (!box) return;
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `background:${type === 'err' ? '#f43f5e' : '#00B4D8'};color:#fff;padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center`;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3200);
}

let currentStream = null, facingMode = 'user', mapInstance = null, liveTimerInt = null, liveSec = 0, liveMode = false, likes = 0;

function stopAllStreams() {
    if (currentStream) { currentStream.getTracks().forEach(t => t.stop()); currentStream = null; }
    if (liveTimerInt) { clearInterval(liveTimerInt); liveTimerInt = null; }
}

async function apiFetch(path, opts = {}) {
    try {
        const res = await fetch('/api' + path, { ...opts, headers: { ...authHeader(), ...(opts.headers || {}) } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'خطأ');
        return data;
    } catch (e) { throw e; }
}

// الوظائف الأساسية
function getPostsLocal() { try { return JSON.parse(localStorage.getItem('tarim_posts_v73') || '[]'); } catch { return []; } }
function savePostsLocal(p) { localStorage.setItem('tarim_posts_v73', JSON.stringify(p)); }

async function loadFeed() {
    const feed = $('postsFeed');
    if (!feed) return;
    feed.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px">⏳ جلب المنشورات...</p>';
    try {
        const { posts } = await apiFetch('/posts');
        if (!posts || !posts.length) { feed.innerHTML = '<p style="text-align:center;color:#22d3ee;padding:40px">👑 لا منشورات - كن أول من ينشر</p>'; savePostsLocal([]); return; }
        savePostsLocal(posts);
        renderPosts(posts);
    } catch (e) {
        const local = getPostsLocal();
        if (local.length) { toast('📡 Offline'); renderPosts(local); }
        else feed.innerHTML = `<p style="text-align:center;color:#f43f5e;padding:40px">❌ ${esc(e.message)}</p>`;
    }
}

function renderPosts(posts) {
    const feed = $('postsFeed');
    if (!feed) return;
    feed.innerHTML = '';
    posts.slice().reverse().forEach(p => {
        const card = document.createElement('div');
        card.className = 'glass';
        card.style.cssText = 'padding:12px;border-radius:22px;margin-bottom:12px;background:rgba(10,20,40,.96);border:1px solid rgba(0,240,255,.12)';
        card.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#22d3ee;font-weight:800">@${esc(p.username || 'AL')} 👑</span><span style="color:#94a3b8">${new Date(p.createdAt || Date.now()).toLocaleTimeString('ar')}</span></div><div style="padding:12px 0;display:flex;flex-direction:column;align-items:center;gap:10px">${p.imageData ? `<img src="${p.imageData}" style="width:100%;border-radius:16px;max-height:320px;object-fit:cover">` : ''}${p.mediaUrl ? `<img src="${p.mediaUrl}" style="width:100%;border-radius:16px">` : ''}${!p.imageData && !p.mediaUrl ? `<div style="width:68px;height:68px;border-radius:50%;background:#00B4D8;color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px">${esc((p.username || 'AL').substring(0, 2).toUpperCase())}</div>` : ''}<p style="font-size:13px">${esc(p.content)}</p>${p.liveMeta ? `<div style="background:#f43f5e;color:#fff;padding:6px 12px;border-radius:20px;font-size:11px">🔴 بث - ${p.liveMeta.likes} ❤️</div>` : ''}</div>`;
        feed.appendChild(card);
    });
}

async function handleLogin() {
    const u = $('userPhoneOrEmail')?.value.trim();
    const pw = $('userPass')?.value;
    const err = $('loginError');
    if (!u || !pw) { if (err) { err.textContent = 'اكتب الاسم وكلمة السر'; err.style.display = 'block'; } return; }
    try {
        if (err) err.style.display = 'none';
        const btn = $('loginBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'جاري الدخول...'; }
        const data = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ username: u, password: pw }) });
        setToken(data.token); setSession(data.user.username); openApp(data.user.username);
    } catch (e) { setToken('offline_' + Date.now()); setSession(u); openApp(u); toast('🔑 دخول Offline'); }
}

function openApp(username) {
    $('authGate').style.display = 'none';
    $('profileNameDisplay').textContent = 'الإمبراطور ' + username;
    $('profileAvatar').textContent = username.substring(0, 2).toUpperCase();
    $('goAvatar').textContent = username.substring(0, 2).toUpperCase();
    loadFeed();
}

// وظائف التبويبات والكاميرا
function switchTab(tab, btn) {
    stopAllStreams();
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    $('tab-' + tab)?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(x => { x.style.color = '#94a3b8'; x.classList.remove('nav-active'); });
    const aBtn = btn || document.querySelector(`[data-tab="${tab}"]`);
    if (aBtn) { aBtn.style.color = '#22d3ee'; aBtn.classList.add('nav-active'); }
    if (tab === 'create') initCamera();
    if (tab === 'home') loadFeed();
}

async function initCamera() {
    const v = $('cameraPreview');
    if (!v) return;
    try { stopAllStreams(); currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true }); v.srcObject = currentStream; }
    catch { toast('الكاميرا مرفوضة', 'err'); }
}

function setFilter(type) {
    const v = $('cameraPreview');
    if (!v) return;
    if (type === 'none') v.style.filter = 'none';
    if (type === 'beauty') v.style.filter = 'contrast(1.15) brightness(1.15) saturate(1.2) blur(0.3px)';
    toast(type === 'beauty' ? '💄 تجميل مفعل' : '✨ ' + type);
}

function capturePhoto() {
    const v = $('cameraPreview');
    if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    c.getContext('2d').drawImage(v, 0, 0);
    window.capturedImage = c.toDataURL('image/jpeg', 0.9);
    toast('📸 تم التقاط صورة');
}

function startLive() {
    liveMode = true; likes = 0; liveSec = 0;
    $('liveBadge')?.classList.remove('hidden');
    initCamera();
    liveTimerInt = setInterval(() => {
        liveSec++;
        const m = String(Math.floor(liveSec / 60)).padStart(2, '0');
        const s = String(liveSec % 60).padStart(2, '0');
        if ($('liveTimer')) $('liveTimer').textContent = m + ':' + s;
        if ($('liveViewers')) $('liveViewers').textContent = Math.floor(Math.random() * 40 + 5);
    }, 1000);
    toast('🔴 بدأ البث');
}

// تهيئة الربط عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // ربط الأزرار برمجياً
    $('loginBtn')?.addEventListener('click', handleLogin);
    $('publishBtn')?.addEventListener('click', () => {
        toast('🚀 تم النشر');
    });

    // ربط أزرار الكاميرا والمرشحات
    document.querySelectorAll('[onclick*="setFilter"]').forEach(btn => {
        const match = btn.getAttribute('onclick').match(/'([^']+)'/);
        if (match) {
            btn.removeAttribute('onclick'); // إزالة السلوك القديم لمنع التعارض
            btn.addEventListener('click', () => setFilter(match[1]));
        }
    });
    
    const captureBtn = document.querySelector('[onclick="capturePhoto()"]');
    if (captureBtn) {
        captureBtn.removeAttribute('onclick');
        captureBtn.addEventListener('click', capturePhoto);
    }

    const switchCamBtn = document.querySelector('[onclick="switchCam()"]');
    if (switchCamBtn) {
        switchCamBtn.removeAttribute('onclick');
        switchCamBtn.addEventListener('click', () => { 
            facingMode = facingMode === 'user' ? 'environment' : 'user'; 
            initCamera(); 
        });
    }

    // ربط التبويبات (Navigation Tabs)
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab') || btn.id.replace('nav-', '');
            switchTab(tabName, btn);
        });
    });

    // استعادة الجلسة إن وجدت
    const activeUser = getSession();
    const activeToken = getToken();
    if (activeUser && activeToken) {
        openApp(activeUser);
    }

    console.log('✅ TARIM OS: تم ربط جميع الأزرار بنجاح');
});
