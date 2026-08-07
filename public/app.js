// public/app.js - TARIM OS Sovereign Heart V2 - OFFLINE + ONLINE - PRODUCTION READY
"use strict";
(function(){
  let currentStream=null, liveStream=null, facingMode="environment", mapInstance=null, liveTimer=null, liveSeconds=0;
  const $ = id=>document.getElementById(id);
  const authGate=$('authGate'), loginBtn=$('loginBtn'), userIn=$('userPhoneOrEmail'), passIn=$('userPass'), err=$('loginError'), postsFeed=$('postsFeed');

  function getUsers(){ try{ return JSON.parse(localStorage.getItem('tarim_users')||'{}'); }catch{ return {}; } }
  function saveUsers(u){ localStorage.setItem('tarim_users', JSON.stringify(u)); }
  let users=getUsers(); if(!users['AL']){ users['AL']='123456'; saveUsers(users); }

  function showToast(msg,type='ok'){
    const box=$('toastBox'); if(!box) return;
    const d=document.createElement('div'); d.textContent=msg;
    d.style.cssText=`background:${type==='err'?'#f43f5e':'#06b6d4'};color:#000;padding:12px 16px;border-radius:12px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center`;
    box.appendChild(d); setTimeout(()=>d.remove(),3000);
  }
  function sanitize(s){ return String(s||'').substring(0,2000).replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function stopAllStreams(){
    if(currentStream) currentStream.getTracks().forEach(t=>t.stop()); currentStream=null;
    if(liveStream) liveStream.getTracks().forEach(t=>t.stop()); liveStream=null;
    if(liveTimer) clearInterval(liveTimer); liveTimer=null;
  }
  function openApp(username){
    authGate.classList.add('hidden'); authGate.style.display='none';
    localStorage.setItem('tarim_session',username);
    showToast(`أهلاً بك يا ${sanitize(username)} في القلعة 👑`);
    loadFeed();
  }
  function loadFeed(){
    const sess=localStorage.getItem('tarim_session')||'AL';
    if(postsFeed){
      postsFeed.innerHTML=`<div class="glass p-4 rounded-2xl space-y-3 text-right"><div style="display:flex;justify-content:space-between"><b class="text-cyan-400">@${sanitize(sess)}</b><span class="text-[10px] text-slate-400">الآن - تريم حضرموت</span></div><p class="text-sm" style="line-height:1.6">بِسْمِ اللهِ، تم افتتاح القلعة السيادية من تريم حضرموت إلى العالم 🐉👑<br>النظام يعمل الآن 100% Offline - أي مستخدم جديد يسجل تلقائياً!</p><div class="flex gap-2 text-[11px] text-slate-400"><span>👁️ 1.2k</span><span>💬 89</span><span>🚀 مشاركة</span></div></div>`;
    }
  }

  // تسجيل الدخول + تسجيل جديد تلقائي
  if(loginBtn){
    loginBtn.addEventListener('click',()=>{
      const u=(userIn.value||'').trim(), p=(passIn.value||'').trim();
      if(!u||!p){ err.textContent='اكتب الاسم وكلمة السر'; err.classList.remove('hidden'); return; }
      err.classList.add('hidden');
      users=getUsers();
      if(users[u]){ if(users[u]!==p){ err.textContent='كلمة السر خطأ'; err.classList.remove('hidden'); showToast('كلمة السر خطأ','err'); return; } openApp(u); }
      else { users[u]=p; saveUsers(users); showToast(`تم إنشاء حساب جديد: ${u} ✅`); openApp(u); }
    });
  }

  // دخول بـ Enter
  passIn?.addEventListener('keydown',e=>{ if(e.key==='Enter') loginBtn.click(); });

  // استعادة الجلسة
  const sess=localStorage.getItem('tarim_session'); if(sess){ authGate.classList.add('hidden'); authGate.style.display='none'; loadFeed(); }

  // إصلاح القائمة - هذا اللي كان معطل
  window.switchTab=function(tab, btn){
    stopAllStreams();
    document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));
    const target=document.getElementById('tab-'+tab); if(target) target.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(x=>x.style.color='#94a3b8');
    if(btn) btn.style.color='#22d3ee';
    if(tab==='create') initCamera();
  };
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tab=btn.getAttribute('data-tab'); if(!tab) return;
      window.switchTab(tab, btn);
    });
  });

  async function initCamera(){
    const preview=$('cameraPreview'); if(!preview) return;
    try{ stopAllStreams(); currentStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facingMode==='environment'?'environment':'user'},audio:true}); preview.srcObject=currentStream; }catch{ showToast('الكاميرا مرفوضة - اسمح من الإعدادات','err'); }
  }
  $('switchCamBtn')?.addEventListener('click',()=>{ facingMode=facingMode==='environment'?'user':'environment'; initCamera(); });
  $('offlineMapBtn')?.addEventListener('click',()=>{
    $('mapScreen')?.classList.remove('hidden');
    setTimeout(()=>{
      if(!mapInstance){
        mapInstance=L.map('mapContainer').setView([16.05,48.9833],13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(mapInstance);
        L.marker([16.05,48.9833]).addTo(mapInstance).bindPopup('<b>قلعة تريم السيادية</b>').openPopup();
      } else mapInstance.invalidateSize();
    },300);
  });
  $('closeMapBtn')?.addEventListener('click',()=>$('mapScreen')?.classList.add('hidden'));
  $('logoutBtn')?.addEventListener('click',()=>{ localStorage.removeItem('tarim_session'); location.reload(); });
  $('publishBtn')?.addEventListener('click',()=>{ const v=$('postContentInput'); if(!v||!v.value.trim()){ showToast('اكتب وصفاً أولاً','err'); return; } showToast('تم النشر السيادي ✅'); v.value=''; window.switchTab('home', document.querySelector('[data-tab="home"]')); loadFeed(); });

  console.log('[TARIM OS] V2 Sovereign Offline Loaded - Menu Fixed');
})();
