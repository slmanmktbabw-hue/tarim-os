// public/app.js - TARIM OS V7.3 IMPERIAL SOVEREIGN - ESM SHIELD FINAL
// 🐉◈⚖️👑 ESM: esm.unpkg.com?bundle&target=es2022&min
"use strict";
import { TarimAI } from './ai-eye.js';
import L from 'leaflet';
import { io } from 'socket.io-client';

const $ = (id) => document.getElementById(id);
const API = '/api';
const esc = (s) => { const d=document.createElement('div'); d.textContent=String(s||'').substring(0,2000); return d.innerHTML; };
const sanitize = (s) => String(s||'').trim().substring(0,2000).replace(/</g,'').replace(/>/g,'').replace(/javascript:/gi,'');

function getToken(){ return localStorage.getItem('tarim_token_v73'); }
function setToken(t){ localStorage.setItem('tarim_token_v73', t); }
function getSession(){ return localStorage.getItem('tarim_session_v73'); }
function setSession(u){ localStorage.setItem('tarim_session_v73', u); }

function authHeader(){ const t=getToken(); return t? { 'Authorization': `Bearer ${t}`, 'Content-Type':'application/json' } : { 'Content-Type':'application/json' }; }

function toast(msg, type='ok'){
  const box=$('toastBox'); if(!box) return;
  const el=document.createElement('div');
  el.textContent=msg;
  el.style.cssText=`background:${type==='err'?'#f43f5e':'#00B4D8'};color:${type==='err'?'#fff':'#000'};padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.4);animation:slideIn .3s`;
  box.appendChild(el); setTimeout(()=>el.remove(),3200);
}

let currentStream=null, liveStream=null, facingMode='environment', mapInstance=null, socket=null;
let currentChatWith=null, filterIdx=0, liveSec=0, liveTimerInt=null, lightOn=false;
const filters=['none','grayscale(1)','sepia(.8)','contrast(1.4) brightness(1.1)','hue-rotate(90deg) saturate(1.5)','brightness(1.3)'];

function stopAllStreams(){
  if(currentStream) currentStream.getTracks().forEach(t=>t.stop()); currentStream=null;
  if(liveStream) liveStream.getTracks().forEach(t=>t.stop()); liveStream=null;
  if(liveTimerInt) clearInterval(liveTimerInt); liveTimerInt=null;
}

// ================= V7.3 - اتصال حقيقي بالسيرفر المحصن =================
async function apiFetch(path, opts={}){
  try{
    const res=await fetch(API+path, { ...opts, headers:{ ...authHeader(), ...(opts.headers||{}) } });
    const data=await res.json();
    if(!res.ok) throw new Error(data.message||'خطأ سيادي');
    return data;
  }catch(e){ throw e; }
}

async function loadFeed(){
  const feed=$('postsFeed'); if(!feed) return;
  feed.innerHTML='<p style="text-align:center;color:#94a3b8;padding:40px">⏳ جلب المنشورات السيادية V7.3...</p>';
  try{
    const { posts } = await apiFetch('/posts');
    feed.innerHTML='';
    if(posts.length===0){
      feed.innerHTML='<p style="text-align:center;color:#22d3ee;padding:40px">👑 لا منشورات - كن أول من ينشر من تريم</p>'; return;
    }
    posts.forEach(p=>{
      const card=document.createElement('div'); card.className='tiktok-card';
      card.innerHTML=`
        <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#22d3ee;font-weight:800">@${esc(p.username)} 👑</span><span style="color:#94a3b8">V7.3 • ${new Date(p.createdAt).toLocaleTimeString('ar')}</span></div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:20px">
          <div style="width:68px;height:68px;border-radius:50%;background:#00B4D8;color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px">${esc((p.username||'AL').substring(0,2).toUpperCase())}</div>
          <p style="color:#fff;font-size:14px;line-height:1.8;max-width:86%">${esc(p.content)}</p>
          ${p.imageUrl? `<img src="${esc(p.imageUrl)}" style="max-width:90%;border-radius:12px;margin-top:8px">`:''}
          <p style="color:#22d3ee;font-size:11px">tarim.os.ye • V7.3 ESM Shield</p>
        </div>
        <div style="position:absolute;left:12px;bottom:80px;display:flex;flex-direction:column;gap:16px">
          <button class="tiktok-act" data-like="${p.id}"><b>❤️</b><span>${p.likes||0}</span></button>
          <button class="tiktok-act" data-comment="${p.id}"><b>💬</b><span>${p.commentsCount||0}</span></button>
          <button class="tiktok-act" data-share="${p.id}"><b>🚀</b><span>مشاركة</span></button>
        </div>
      `;
      feed.appendChild(card);
    });
    feed.querySelectorAll('[data-like]').forEach(el=>{
      el.addEventListener('click', async()=>{
        const id=el.getAttribute('data-like');
        if(!getToken()){ toast('سجل دخول أولاً','err'); return; }
        try{ const { likes }=await apiFetch(`/posts/${id}/like`, {method:'POST'}); el.querySelector('span').textContent=likes; toast('❤️ تم'); }catch(e){ toast(e.message,'err'); }
      });
    });
    feed.querySelectorAll('[data-comment]').forEach(el=>el.addEventListener('click',()=>window.switchTab('inbox', document.querySelector('[data-tab="inbox"]'))));
    feed.querySelectorAll('[data-share]').forEach(el=>el.addEventListener('click', async()=>{ try{ await navigator.clipboard.writeText(location.href); toast('🔗 تم النسخ'); }catch{} }));
  }catch(e){
    feed.innerHTML=`<p style="text-align:center;color:#f43f5e;padding:40px">❌ فشل الجلب: ${esc(e.message)}<br><small>تأكد السيرفر يعمل V7.3</small></p>`;
  }
}

// ================= تسجيل دخول حقيقي V7.3 - JWT + bcrypt =================
async function handleLogin(){
  const u=$('userPhoneOrEmail')?.value.trim(), p=$('userPass')?.value;
  const err=$('loginError');
  if(!u||!p){ err.textContent='اكتب الاسم وكلمة السر'; err.style.display='block'; return; }
  try{
    err.style.display='none';
    $('loginBtn').disabled=true; $('loginBtn').textContent='جاري الدخول V7.3...';
    const data=await apiFetch('/login', { method:'POST', body: JSON.stringify({ username:u, password:p }) });
    setToken(data.token); setSession(data.user.username);
    openApp(data.user.username);
  }catch(e){ err.textContent=e.message; err.style.display='block'; toast(e.message,'err'); }
  finally{ $('loginBtn').disabled=false; $('loginBtn').textContent='دخول سيادي V7.3 👑'; }
}

function openApp(username){
  $('authGate').classList.add('hidden'); $('authGate').style.display='none';
  const nameEl=$('profileNameDisplay'); if(nameEl) nameEl.textContent='الإمبراطور '+username+' V7.3';
  const avEl=$('profileAvatar'); if(avEl) avEl.textContent=username.substring(0,2).toUpperCase();
  toast(`أهلاً بك يا ${username} - القلعة V7.3 ESM Shield 👑`);
  initSocket();
  loadFeed();
}

function initSocket(){
  const token=getToken(); if(!token) return;
  if(socket) socket.disconnect();
  socket=io({ auth:{ token } });
  socket.on('connect',()=>console.log('[SOCKET V7.3] متصل سيادي'));
  socket.on('live-started',(d)=>toast(`🔴 ${d.username} بدأ بث مباشر`));
  socket.on('live-ended',(d)=>toast(`⏹️ ${d.username} أنهى البث`));
}

// ================= باقي الوظائف - 5 أركان =================
window.switchTab=function(tab, btn){
  stopAllStreams();
  document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));
  document.getElementById('tab-'+tab)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(x=>{ if(x.dataset.tab!=='create'){ x.style.color='#94a3b8'; x.classList.remove('nav-active'); } });
  const activeBtn=btn||document.querySelector(`[data-tab="${tab}"]`);
  if(activeBtn && tab!=='create'){ activeBtn.style.color='#22d3ee'; activeBtn.classList.add('nav-active'); }
  if(tab==='create') initCamera();
  if(tab==='home') loadFeed();
  window.scrollTo(0,0);
};
document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{ const t=btn.dataset.tab; if(t) window.switchTab(t,btn); }));

async function initCamera(){
  const preview=$('cameraPreview'); if(!preview) return;
  try{ stopAllStreams(); currentStream=await navigator.mediaDevices.getUserMedia({ video:{ facingMode, width:{ideal:1280} }, audio:true }); preview.srcObject=currentStream; }catch{ toast('الكاميرا مرفوضة','err'); }
}
$('switchCamBtn')?.addEventListener('click',()=>{ facingMode=facingMode==='environment'?'user':'environment'; initCamera(); });
$('filterBtn')?.addEventListener('click',()=>{ filterIdx=(filterIdx+1)%filters.length; $('cameraPreview').style.filter=filters[filterIdx]; });
$('publishBtn')?.addEventListener('click', async()=>{
  const input=$('postContentInput'); const content=sanitize(input.value);
  if(!content){ toast('اكتب شيئاً','err'); return; }
  if(!TarimAI.quickCheck(content)){ toast('المحتوى محظور سيادياً 🛡️','err'); return; }
  if(!getToken()){ toast('سجل دخول أولاً','err'); return; }
  try{
    $('publishBtn').disabled=true;
    await apiFetch('/posts', { method:'POST', body: JSON.stringify({ content }) });
    input.value=''; toast('🚀 تم النشر V7.3'); window.switchTab('home', document.querySelector('[data-tab="home"]')); loadFeed();
  }catch(e){ toast(e.message,'err'); }
  finally{ $('publishBtn').disabled=false; }
});

// خريطة حضرموت V7.3 ESM
function openMap(){
  const ms=$('mapScreen'); if(!ms) return; ms.classList.remove('hidden'); ms.style.display='flex';
  setTimeout(()=>{ if(!mapInstance){ mapInstance=L.map('mapContainer').setView([16.0545,49.0],14); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(mapInstance); L.marker([16.0545,49.0]).addTo(mapInstance).bindPopup('<b>🏰 قلعة تريم V7.3</b><br>ESM Shield').openPopup(); } else mapInstance.invalidateSize(); },300);
}
$('opsMapBtn')?.addEventListener('click',openMap);
$('closeMapBtn')?.addEventListener('click',()=>{ $('mapScreen').classList.add('hidden'); });

$('loginBtn')?.addEventListener('click', handleLogin);
$('userPass')?.addEventListener('keydown', e=>{ if(e.key==='Enter') handleLogin(); });
$('logoutBtn')?.addEventListener('click',()=>{ localStorage.clear(); if(socket) socket.disconnect(); location.reload(); });

// استعادة الجلسة V7.3
const sess=getSession(), tok=getToken();
if(sess && tok){
  $('authGate').classList.add('hidden'); $('authGate').style.display='none';
  setTimeout(()=>{ initSocket(); loadFeed(); },100);
}

console.log('👑 TARIM OS V7.3 ESM SHIELD - app.js Loaded - esm.unpkg.com?bundle&target=es2022&min');
