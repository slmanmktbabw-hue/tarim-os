// public/app.js - TARIM OS V8.4 SECURE FIXED
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const socket = typeof io !== 'undefined' ? io() : null;

  function toast(m) {
    const box = $('toastBox'); if (!box) return;
    const e = document.createElement('div');
    e.className = 'glass px-4 py-2 rounded-xl text-xs mb-2 text-center text-cyan-300 border border-cyan-500/40';
    e.textContent = String(m).slice(0, 200);
    box.appendChild(e);
    setTimeout(() => e.remove(), 2500);
  }

  function sanitizeText(t, max = 1000) {
    if (!t) return "";
    return String(t).slice(0, max);
  }

  let state = { 
    currentUser: localStorage.getItem('tarim_user') || null, 
    curStream: null, 
    facing: 'user', 
    map: null, 
    watchTimer: null, 
    liveMode: false, 
    likes: 0, 
    liveTimerInterval: null 
  };

  function stopStream() {
    if (state.curStream) state.curStream.getTracks().forEach(t => t.stop());
    state.curStream = null;
    if (state.watchTimer) clearInterval(state.watchTimer);
    if (state.liveTimerInterval) clearInterval(state.liveTimerInterval);
  }

  function switchTab(name, btn) {
    if (state.liveMode) { toast('🔴 أنهي البث أولاً'); return; }
    stopStream();
    document.querySelectorAll('.tab-content').forEach(t => { t.classList.add('hidden'); t.classList.remove('active'); });
    const tar = $('tab-' + name); if (tar) { tar.classList.remove('hidden'); tar.classList.add('active'); }
    document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('text-cyan-400'); b.classList.add('text-slate-400'); });
    const targetBtn = btn?.currentTarget || btn;
    if (targetBtn?.classList?.contains('nav-btn')) {
      targetBtn.classList.remove('text-slate-400'); targetBtn.classList.add('text-cyan-400');
    }
    if (name === 'create') initCam();
    if (name === 'profile') updateCounters();
    if (name === 'home') renderAllFeeds();
  }

  function updateCounters() {
    const posts = getPosts();
    const el = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    el('countFollowers', posts.length); el('countFollowing', Math.floor(posts.length / 2));
    el('countLikes', posts.reduce((a, b) => a + (b.likes || 0), 0)); el('countPosts', posts.length);
  }

  async function handleAuth() {
    const inputField = $('userPhoneOrEmail');
    const passField = $('userPass');
    const msgBox = $('authMsg');
    const identifier = inputField?.value.trim();
    const password = passField?.value;

    if (!identifier || !password) { 
      if (msgBox) msgBox.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
      toast('يرجى إدخال اسم المستخدم وكلمة المرور'); 
      return; 
    }

    try {
      let res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, password: password })
      });
      
      let data = await res.json();
      
      if (res.ok && data.success) {
        state.currentUser = sanitizeText(data.user.username, 30);
        localStorage.setItem('tarim_user', state.currentUser);
        
        if ($('authGate')) $('authGate').style.display = 'none';
        if ($('homeUsernameDisplay')) $('homeUsernameDisplay').textContent = '@' + state.currentUser + ' 👑';
        if ($('profileNameDisplay')) $('profileNameDisplay').textContent = 'الإمبراطور ' + state.currentUser;
        if ($('goAvatar')) $('goAvatar').textContent = state.currentUser.slice(0, 2).toUpperCase();
        
        if (socket) socket.emit('registerSocket', state.currentUser);
        if (msgBox) msgBox.textContent = '';
        toast('أهلاً بك يا ' + state.currentUser + ' 👑');
        renderAllFeeds();
        updateCounters();
      } else {
        throw new Error(data.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      if (msgBox) msgBox.textContent = err.message || 'خطأ في الاتصال بالخادم';
      toast(err.message || 'فشل تسجيل الدخول');
    }
  }

  async function initCam() {
    const v = $('cameraPreview'); if (!v) return;
    try {
      stopStream();
      state.curStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: state.facing }, audio: true });
      v.srcObject = state.curStream;
    } catch { toast('الكاميرا تحتاج HTTPS وصلاحيات'); }
  }
  
  function switchCam() { state.facing = state.facing === 'user' ? 'environment' : 'user'; initCam(); }
  
  function setFilter(t) {
    const v = $('cameraPreview'); if (!v) return;
    v.style.filter = t === 'beauty' ? 'contrast(1.15) brightness(1.15) saturate(1.2)' : 'none';
  }

  function startLive() {
    state.liveMode = true; state.likes = 0; initCam();
    $('cameraWrap')?.classList.add('fullscreen-live');
    $('liveControlsFull')?.classList.remove('hidden');
    $('endLiveTopBtn')?.classList.remove('hidden');
    $('normalControls')?.classList.add('hidden');
    let sec = 0;
    state.liveTimerInterval = setInterval(() => { 
      sec++; 
      const m = String(Math.floor(sec / 60)).padStart(2, '0'); 
      const s = String(sec % 60).padStart(2, '0'); 
      if ($('liveTimer')) $('liveTimer').innerText = m + ':' + s; 
    }, 1000);
    toast('🔴 بدأ البث');
  }

  function stopLive() {
    state.liveMode = false;
    $('cameraWrap')?.classList.remove('fullscreen-live');
    $('liveControlsFull')?.classList.add('hidden');
    $('endLiveTopBtn')?.classList.add('hidden');
    $('normalControls')?.classList.remove('hidden');
    stopStream(); toast('⏹️ انتهى البث');
  }

  function getPosts() { 
    try { return JSON.parse(localStorage.getItem('tarim_posts_v73') || '[]'); } 
    catch { return []; } 
  }
  
  function savePosts(p) { 
    localStorage.setItem('tarim_posts_v73', JSON.stringify(p.slice(-100))); 
  }

  function renderAllFeeds() {
    const f = $('postsFeed'); if (!f) return; 
    f.textContent = '';
    const posts = getPosts();
    
    if (!posts.length) { 
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'glass p-8 rounded-2xl text-center text-slate-400 text-xs';
      emptyDiv.textContent = 'لا منشورات بعد';
      f.appendChild(emptyDiv);
      return; 
    }
    
    posts.slice().reverse().forEach(p => {
      const c = document.createElement('div'); 
      c.className = 'glass p-4 rounded-xl border border-cyan-500/20';

      const headerDiv = document.createElement('div');
      headerDiv.className = 'flex justify-between text-[10px] text-slate-400 mb-2';

      const userSpan = document.createElement('span');
      userSpan.className = 'text-cyan-400 font-bold';
      userSpan.textContent = '@' + (p.username || 'AL') + ' 👑';

      const timeSpan = document.createElement('span');
      timeSpan.textContent = new Date(p.createdAt).toLocaleTimeString('ar');

      headerDiv.appendChild(userSpan);
      headerDiv.appendChild(timeSpan);

      const contentP = document.createElement('p');
      contentP.className = 'text-xs text-white';
      contentP.textContent = p.content || '';

      c.appendChild(headerDiv);
      c.appendChild(contentP);
      f.appendChild(c);
    });
  }

  function publishPost() {
    const inp = $('postContentInput'); 
    if (!inp || !inp.value.trim()) { toast('اكتب شيئاً'); return; }
    
    const all = getPosts(); 
    all.push({
      id: Date.now(),
      content: sanitizeText(inp.value, 1000),
      username: state.currentUser || 'AL',
      createdAt: new Date().toISOString(),
      likes: 0
    });
    
    savePosts(all); 
    inp.value = ''; 
    renderAllFeeds(); 
    updateCounters(); 
    toast('🚀 تم النشر');
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('loginBtn')?.addEventListener('click', handleAuth);
    $('userPass')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
    $('publishBtn')?.addEventListener('click', publishPost);
    $('startLiveBtn')?.addEventListener('click', startLive);
    $('stopLiveBtnFull')?.addEventListener('click', stopLive);
    $('endLiveTopBtn')?.addEventListener('click', stopLive);
    $('logoutBtn')?.addEventListener('click', () => { localStorage.clear(); location.reload(); });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]'); if (!btn) return;
      const act = btn.getAttribute('data-action');
      const map = { 
        tabHome: () => switchTab('home', btn), 
        tabOperations: () => switchTab('operations', btn), 
        tabCreate: () => switchTab('create', btn), 
        tabInbox: () => switchTab('inbox', btn), 
        tabProfile: () => switchTab('profile', btn), 
        startLive, 
        stopLive, 
        switchCam, 
        filterNone: () => setFilter('none'), 
        filterBeauty: () => setFilter('beauty'), 
        likeLive: () => { state.likes++; if ($('liveLikesCount')) $('liveLikesCount').innerText = state.likes; }, 
        backToProfile: () => { document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden')); $('profile-main')?.classList.remove('hidden'); }, 
        openMap: () => { 
          const c = $('mapContainer'); if (!c) return; c.classList.toggle('hidden'); 
          if (!c.classList.contains('hidden') && !state.map && window.L) { 
            state.map = L.map('map').setView([15.9576, 48.7903], 13); 
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.map); 
          } 
        }, 
        showQR: () => { 
          document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden')); 
          $('sub-qr-page')?.classList.remove('hidden'); 
          const c = $('qrcode'); 
          if (c) { 
            c.textContent = ''; 
            if (window.QRCode && state.currentUser) {
              new QRCode(c, { text: location.origin + '/user/' + state.currentUser, width: 128, height: 128 }); 
            }
          } 
        } 
      };
      if (map[act]) map[act]();
    });

    if (state.currentUser) { 
      if ($('authGate')) $('authGate').style.display = 'none'; 
      if ($('homeUsernameDisplay')) $('homeUsernameDisplay').textContent = '@' + state.currentUser + ' 👑';
      renderAllFeeds(); 
      updateCounters(); 
    }
  });
})();
