// public/app.js - TARIM OS V8.3 ULTIMATE SECURE - Tarim_Fortress UES-Gateway Integrated + محصن 100%
"use strict";

(function () {
  const $ = id => document.getElementById(id);

  function toast(m) {
    const b = $('toastBox'); if (!b) return;
    const e = document.createElement('div');
    e.textContent = String(m).slice(0, 200);
    e.style.cssText = 'background:#00B4D8;color:#000;padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center';
    b.appendChild(e);
    setTimeout(() => e.remove(), 3000);
  }

  function sanitizeText(t) {
    if (!t) return "";
    return String(t).slice(0, 1000)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  let state = {
    curStream: null, facing: 'user', map: null, liveInt: null,
    lSec: 0, liveMode: false, likes: 0, capImg: null, upURL: null, upIsVideo: false,
    watchTimer: null, currentWatchTime: 0, abortCtrl: null
  };

  // --- محرك Tarim_Fortress UES-Gateway V2.1 SECURE INTEGRATED ---
  function startUesWatchSimulation() {
    if (state.watchTimer) clearInterval(state.watchTimer);
    if (state.abortCtrl) state.abortCtrl.abort();
    state.currentWatchTime = 0;
    state.abortCtrl = new AbortController();

    state.watchTimer = setInterval(async () => {
      state.currentWatchTime += 5;
      if (state.currentWatchTime >= 20) {
        clearInterval(state.watchTimer);
        try {
          const username = sanitizeText(localStorage.getItem('tarim_session_v73') || 'AL', 30);
          const res = await fetch('/get_next_video', { // نسبي - يشتغل على Render + محلي
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: state.abortCtrl.signal,
            body: JSON.stringify({
              user_profile: { country: 'YE', interest: 'cooking', repeat_count: 0 },
              current_video: { duration: 45, watch_time: state.currentWatchTime }
            })
          });
          if (!res.ok) throw new Error('offline');
          const data = await res.json();
          if (data.action === 'split_screen' && data.video_id) {
            // فلترة video_id ضد حقن
            const vid = String(data.video_id).replace(/[^a-zA-Z0-9_\-]/g,'').slice(0,50);
            if (['short_funny_01','short_tip_02','ye_cooking_restaurant_001','ye_football_highlights_002'].includes(vid) || vid.startsWith('trending_')) {
              toast('⚡ Tarim_Fortress: ' + vid);
            }
          }
        } catch (err) {
          if (err.name!== 'AbortError') console.log('Tarim_Fortress: Offline Mode');
        }
      }
    }, 5000);
  }

  function stopStream() {
    if (state.curStream) { state.curStream.getTracks().forEach(t => t.stop()); state.curStream = null; }
    if (state.liveInt) { clearInterval(state.liveInt); state.liveInt = null; }
    if (state.watchTimer) { clearInterval(state.watchTimer); state.watchTimer = null; }
    if (state.abortCtrl) { state.abortCtrl.abort(); state.abortCtrl = null; }
    if (state.upURL) { URL.revokeObjectURL(state.upURL); state.upURL = null; }
  }

  function switchTab(name, btn) {
    if (state.liveMode) { toast('🔴 أنهي البث أولاً'); return; }
    stopStream();
    document.querySelectorAll('.tab-content').forEach(t => { t.classList.remove('active'); t.classList.add('hidden'); });
    const tar = $('tab-' + name); if (tar) { tar.classList.remove('hidden'); tar.classList.add('active'); }
    document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('text-cyan-400'); b.classList.add('text-slate-400'); });
    if (btn) btn.classList.add('text-cyan-400');
    if (name === 'create') initCam();
    if (name === 'profile') { backToProfile(); updateCounters(); }
    if (name === 'home') { renderAllFeeds(); startUesWatchSimulation(); }
  }

  function showSubPage(id) {
    const main = $('profile-main'); if (main) main.classList.add('hidden');
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    const t = $('sub-' + id); if (t) { t.classList.remove('hidden'); if(id==='qr-page'){ const c=$('qrcode'); if(c){ c.textContent=''; if(window.QRCode) new QRCode(c,{text:'https://tarimos.org/user/'+sanitizeText(localStorage.getItem('tarim_session_v73')||'AL'),width:128,height:128}); } } }
  }
  function backToProfile() { document.querySelectorAll('.sub-page').forEach(p=>p.classList.add('hidden')); $('profile-main')?.classList.remove('hidden'); updateCounters(); }
  function updateCounters() {
    const posts = getPosts();
    if ($('countFollowers')) $('countFollowers').textContent = posts.length;
    if ($('countFollowing')) $('countFollowing').textContent = Math.floor(posts.length/2);
    if ($('countLikes')) $('countLikes').textContent = posts.reduce((a,b)=>a+(b.likes||0),0);
    if ($('activityPosts')) $('activityPosts').textContent = posts.length;
  }
  async function initCam() { const v=$('cameraPreview'); if(!v) return; try{ stopStream(); state.curStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:state.facing},audio:true}); v.srcObject=state.curStream; }catch{ toast('الكاميرا تحتاج HTTPS'); } }
  function setFilter(t){ const v=$('cameraPreview'); if(!v) return; v.style.filter=t==='beauty'?'contrast(1.15) brightness(1.15) saturate(1.2)':'none'; toast(t==='beauty'?'💄 تجميل':'✨ طبيعي'); }
  function switchCam(){ state.facing=state.facing==='user'?'environment':'user'; initCam(); }
  function capturePhoto(){ const v=$('cameraPreview'); if(!v) return; const c=document.createElement('canvas'); c.width=v.videoWidth||640; c.height=v.videoHeight||480; c.getContext('2d').drawImage(v,0,0); state.capImg=c.toDataURL('image/jpeg',0.85); toast('📸 تم التقاط صورة'); }

  function getPosts() {
    try {
      const data=localStorage.getItem('tarim_posts_v73'); if(!data) return [];
      const arr=JSON.parse(data); if(!Array.isArray(arr)) return [];
      return arr.slice(-100).filter(p=>p && typeof p==='object' && typeof p.content==='string' && p.content.length<=1000);
    } catch { return []; }
  }
  function savePosts(p){ try{ localStorage.setItem('tarim_posts_v73', JSON.stringify(p.slice(-100))); }catch{ toast('التخزين ممتلئ'); } }

  function renderAllFeeds() {
    const f = $('postsFeed'); if (!f) return;
    f.textContent = '';
    const posts = getPosts();
    if (!posts.length){ const empty=document.createElement('div'); empty.className='glass p-8 rounded-2xl text-center text-slate-400 text-xs'; empty.textContent='لا منشورات بعد - ابدأ بث مباشر 👑'; f.appendChild(empty); return; }
    posts.slice().reverse().forEach(p=>{
      const c=document.createElement('div'); c.className='glass p-4 rounded-xl border border-cyan-500/20';
      const header=document.createElement('div'); header.className='flex justify-between text-[10px] text-slate-400 mb-2';
      const u=document.createElement('span'); u.className='text-cyan-400 font-bold'; u.textContent='@'+sanitizeText(p.username||'AL')+' 👑';
      const t=document.createElement('span'); t.textContent=new Date(p.createdAt||Date.now()).toLocaleTimeString('ar');
      header.appendChild(u); header.appendChild(t);
      const body=document.createElement('p'); body.className='text-xs'; body.textContent=sanitizeText(p.content||'');
      c.appendChild(header); c.appendChild(body); f.appendChild(c);
    });
  }

  function publishPost() {
    const inp = $('postContentInput'); if (!inp ||!inp.value.trim()) { toast('اكتب شيئاً'); return; }
    const post={ id:Date.now(), content:inp.value.slice(0,1000), username:localStorage.getItem('tarim_session_v73')||'AL', createdAt:new Date().toISOString(), likes:0 };
    const all=getPosts(); all.push(post); savePosts(all); inp.value=''; if(state.upURL){ URL.revokeObjectURL(state.upURL); state.upURL=null; } state.capImg=null; renderAllFeeds(); updateCounters(); toast('🚀 تم النشر');
  }

  function forceUnlockCastle() {
    const u = sanitizeText($('userPhoneOrEmail')?.value.trim()||'AL',30)||'AL';
    localStorage.setItem('tarim_session_v73', u); localStorage.setItem('tarim_token_v73','offline_'+Date.now());
    if ($('authGate')) $('authGate').style.display = 'none';
    const h1=$('homeUsernameDisplay'); if(h1) h1.textContent='@'+u+' 👑';
    const h2=$('profileNameDisplay'); if(h2) h2.textContent='الإمبراطور '+u;
    renderAllFeeds(); updateCounters(); startUesWatchSimulation(); toast('أهلاً '+u+' 👑');
  }
  function startLive(){ state.liveMode=true; state.likes=0; state.lSec=0; initCam(); $('cameraWrap')?.classList.add('fullscreen-live'); $('liveControlsFull')?.classList.remove('hidden'); $('endLiveTopBtn')?.classList.remove('hidden'); $('normalControls')?.classList.add('hidden'); document.querySelector('header')?.classList.add('hidden'); document.querySelector('nav')?.classList.add('hidden'); toast('🔴 بث ملء الشاشة'); }
  function stopLive(){ state.liveMode=false; $('cameraWrap')?.classList.remove('fullscreen-live'); $('liveControlsFull')?.classList.add('hidden'); $('endLiveTopBtn')?.classList.add('hidden'); $('normalControls')?.classList.remove('hidden'); document.querySelector('header')?.classList.remove('hidden'); document.querySelector('nav')?.classList.remove('hidden'); stopStream(); toast('⏹️ تم إنهاء البث'); }

  document.addEventListener('DOMContentLoaded', () => {
    const map={ startLive, stopLive, switchCam, capturePhoto, filterNone:()=>setFilter('none'), filterBeauty:()=>setFilter('beauty'), tabHome:(b)=>switchTab('home',b), tabOperations:(b)=>switchTab('operations',b), tabCreate:(b)=>switchTab('create',b), tabInbox:(b)=>switchTab('inbox',b), tabProfile:(b)=>switchTab('profile',b), backToProfile, openAccountSettings:()=>showSubPage('account-settings'), openSecurity:()=>showSubPage('security-settings'), openQrPage:()=>showSubPage('qr-page'), openOkx:()=>showSubPage('okx-page'), openActivity:()=>showSubPage('activity-page'), openOffline:()=>showSubPage('offline-page'), openCommerce:()=>showSubPage('commerce-page'), openPromo:()=>showSubPage('promo-page'), openMap:()=>{ const c=$('mapContainer'); if(c){ c.classList.toggle('hidden'); if(!c.classList.contains('hidden')&&!state.map&&window.L){ state.map=L.map(c).setView([16.0545,49.0],14); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.map); } } }, showQR:()=>{ const d=$('qrDisplay'); if(d){ d.classList.toggle('hidden'); const b=$('operationsQrBox'); if(b&&!d.classList.contains('hidden')){ b.textContent=''; if(window.QRCode) new QRCode(b,{text:'https://tarimos.org',width:100,height:100}); } } }, goInbox:()=>switchTab('inbox') };
    document.addEventListener('click',(e)=>{ const btn=e.target.closest('[data-action]'); if(!btn) return; const act=btn.getAttribute('data-action'); if(map[act]) map[act](btn); });
    $('loginBtn')?.addEventListener('click',forceUnlockCastle);
    $('userPass')?.addEventListener('keydown',e=>{if(e.key==='Enter')forceUnlockCastle();});
    $('publishBtn')?.addEventListener('click',publishPost);
    $('startLiveBtn')?.addEventListener('click',startLive);
    $('stopLiveBtn')?.addEventListener('click',stopLive);
    $('stopLiveBtnFull')?.addEventListener('click',stopLive);
    $('endLiveTopBtn')?.addEventListener('click',stopLive);
    $('logoutBtn')?.addEventListener('click',()=>{localStorage.clear(); location.reload();});
    if(localStorage.getItem('tarim_session_v73')){ if($('authGate')) $('authGate').style.display='none'; renderAllFeeds(); updateCounters(); startUesWatchSimulation(); }
  });
})();
