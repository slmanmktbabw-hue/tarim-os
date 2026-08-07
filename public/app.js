// TARIM OS V1.0 Official - app.js Final Sovereign Connected
let currentStream=null, liveStream=null, facingMode="env", flashLightOn=false, liveLikes=0, mainLikes=120, mapInstance=null, liveTimer=null, liveSeconds=0;

function showToast(msg){
 const box=document.getElementById('toastBox'); if(!box) return;
 const t=document.createElement('div'); t.className='bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg mb-2 text-center animate-bounce'; t.innerText=msg; box.appendChild(t); setTimeout(()=>t.remove(),3000);
}

function switchTab(tab, btn){
 if(currentStream){currentStream.getTracks().forEach(t=>t.stop()); currentStream=null;}
 if(liveStream){liveStream.getTracks().forEach(t=>t.stop()); liveStream=null;}
 if(liveTimer){clearInterval(liveTimer); liveTimer=null;}
 document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));
 const target=document.getElementById('tab-'+tab); if(target) target.classList.add('active');
 document.querySelectorAll('.nav-btn').forEach(x=>{x.classList.remove('text-cyan-400'); x.classList.add('text-slate-400');});
 if(btn){btn.classList.remove('text-slate-400'); btn.classList.add('text-cyan-400');}
 if(tab==='create') initCamera();
 if(tab==='home') loadPostsFromServer();
}

async function initCamera(){
 const preview=document.getElementById('cameraPreview'); if(!preview) return;
 try{
  if(currentStream) currentStream.getTracks().forEach(t=>t.stop());
  currentStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facingMode==='env'?'environment':'user'}, audio:true});
  preview.srcObject=currentStream;
 }catch(e){ showToast('⚠️ اسمح للكاميرا'); }
}

// --- نظام العدادات الملكية وتفاعل الإعجاب ---
function likeMainPost(){
    mainLikes++;
    const mainLikeEl = document.getElementById('mainLikeCount');
    const profileLikeEl = document.getElementById('likeCounter');
    if(mainLikeEl) mainLikeEl.innerText = mainLikes;
    if(profileLikeEl) profileLikeEl.innerText = mainLikes;
    showToast('❤️ تم تسجيل إعجابك السيادي');
}

// --- أزرار محصنة بـ dataset.bound ---
['switchCamBtn','lightBtn','filterBtn','publishBtn','liveBtn','liveOpBtn','endLiveBtn','likeBtn','giftBtn','beautyBtn','sendCommentBtn','offlineMapBtn','closeMapBtn','confirmStartLive'].forEach(id=>{
 const el=document.getElementById(id); if(el &&!el.dataset.bound){ el.dataset.bound="true"; }
});

document.getElementById('switchCamBtn')?.addEventListener('click',()=>{ facingMode=facingMode==='env'?'user':'env'; initCamera(); showToast(facingMode==='user'?'🔄 أمامية':'🔄 خلفية'); });
document.getElementById('lightBtn')?.addEventListener('click', async()=>{
 if(!currentStream) return; const track=currentStream.getVideoTracks()[0];
 try{ const cap=track.getCapabilities(); if(cap.torch){ flashLightOn=!flashLightOn; await track.applyConstraints({advanced:[{torch:flashLightOn}]}); showToast(flashLightOn?'💡 فلاش ON':'💡 فلاش OFF'); } }catch{ showToast('⚠️ الفلاش غير مدعوم'); }
});

document.getElementById('publishBtn')?.addEventListener('click', async()=>{
 const input=document.getElementById('postContentInput'); if(!input ||!input.value.trim()){ showToast('⚠️ اكتب وصف'); return; }
 try{
  const token=localStorage.getItem('tarim_token');
  const res=await fetch('/api/posts',{method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${token}`}, body:JSON.stringify({content:input.value, username:'AL'})});
  const data=await res.json();
  if(data.success){ input.value=''; showToast('🚀 تم النشر على السيرفر المركزي'); switchTab('home',document.querySelectorAll('.nav-btn')[0]); }
 }catch{ showToast('❌ فشل النشر - تأكد من تسجيل الدخول'); }
});

// تحميل المنشورات من السيرفر الحقيقي
async function loadPostsFromServer(){
 try{
  const res=await fetch('/api/posts'); const data=await res.json();
  if(data.success){ console.log('✅ Posts loaded', data.posts.length); }
 }catch(e){ console.log('Offline mode'); }
}

// LIVE 8 دقائق سيادي
async function startLiveStream(){
 const liveScreen=document.getElementById('liveScreen'), readyBox=document.getElementById('readyToBroadcastBox');
 if(liveScreen) liveScreen.classList.remove('hidden'); if(readyBox) readyBox.style.display='block';
 try{
  liveStream=await navigator.mediaDevices.getUserMedia({video:true, audio:true});
  const v=document.getElementById('liveVideo'); if(v) v.srcObject=liveStream;
 }catch{ showToast('⚠️ الكاميرا مرفوضة'); }
}
document.getElementById('confirmStartLive')?.addEventListener('click',()=>{
 const readyBox=document.getElementById('readyToBroadcastBox'); if(readyBox) readyBox.style.display='none';
 showToast('🔴 البث بدأ - 8 دقائق'); liveSeconds=0;
 liveTimer=setInterval(()=>{ liveSeconds++; const el=document.getElementById('liveTimer'); if(el) el.innerText=`${Math.floor(liveSeconds/60)}:${String(liveSeconds%60).padStart(2,'0')} / 8:00`; if(liveSeconds>=480){ endLive(); } },1000);
});
function endLive(){ if(liveStream) liveStream.getTracks().forEach(t=>t.stop()); if(liveTimer) clearInterval(liveTimer); document.getElementById('liveScreen')?.classList.add('hidden'); showToast('⏰ انتهى البث 8 دقائق'); }
document.getElementById('liveBtn')?.addEventListener('click',startLiveStream);
document.getElementById('liveOpBtn')?.addEventListener('click',startLiveStream);
document.getElementById('endLiveBtn')?.addEventListener('click',endLive);

// خريطة بدون شاشة سوداء
document.getElementById('offlineMapBtn')?.addEventListener('click',()=>{
 document.getElementById('mapScreen')?.classList.remove('hidden');
 setTimeout(()=>{ if(!mapInstance){ mapInstance=L.map('mapContainer').setView([16.0500,48.9833],13); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(mapInstance); L.marker([16.0500,48.9833]).addTo(mapInstance).bindPopup('<b>قلعة تريم السيادية</b>').openPopup(); }else{ mapInstance.invalidateSize(); } },200);
});
document.getElementById('closeMapBtn')?.addEventListener('click',()=>{ document.getElementById('mapScreen')?.classList.add('hidden'); });

// تسجيل دخول تلقائي للإمبراطور
(async()=>{ try{ const r=await fetch('/api/login',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:'AL',password:'123456'})}); const d=await r.json(); if(d.success) localStorage.setItem('tarim_token', d.token); }catch{} })();

