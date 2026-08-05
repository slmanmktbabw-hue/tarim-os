/**
 * TARIM OS - app.js السيادي المربوط بالسيرفر - V1.0 Beta
 * الملك: AL 👑 - تريم
 */
const socket = io();
let currentAuthTab = 'login';
let localStream = null;
let liveLikesCount = 0;
let mapInstance = null;
let flashState = false;
let currentUser = localStorage.getItem('tarim_user') || null;

socket.on('connect', ()=> console.log("🔗 متصل سيادي:", socket.id));
socket.on('broadcast_post', (posts)=> loadFeed());
socket.on('feed_like', (d)=>{ const el=document.getElementById('like-'+d.id); if(el) el.innerText='❤️ '+d.likes; });
socket.on('live_heart', ()=>{ liveLikesCount++; const c=document.getElementById('liveHeartCount'); if(c) c.innerText=liveLikesCount; });

document.addEventListener('DOMContentLoaded', ()=>{
  if(currentUser){
    document.getElementById('authGate')?.classList.add('hidden');
    const dis=document.getElementById('homeUsernameDisplay'); if(dis) dis.innerText='@'+currentUser+' 👑';
    socket.emit('join', currentUser);
  }
  loadFeed();

  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      openTab(btn.getAttribute('data-tab'), btn);
    });
  });

  document.getElementById('tabLoginBtn')?.addEventListener('click', ()=> switchAuthTab('login'));
  document.getElementById('tabRegBtn')?.addEventListener('click', ()=> switchAuthTab('register'));
  document.getElementById('authActionBtn')?.addEventListener('click', processLogin);
  document.getElementById('googleAuthBtn')?.addEventListener('click', processGoogleLogin);
  document.getElementById('openAiEyeBtn')?.addEventListener('click', ()=> window.AIEye?.openEye());
  document.getElementById('openSupportBtn')?.addEventListener('click', ()=> openModal('modalSupport'));
  document.getElementById('sendSupportBtn')?.addEventListener('click', sendSupportMessage);

  document.getElementById('opLiveBtn')?.addEventListener('click', ()=>{ openTab('create', document.querySelector('[data-tab="create"]')); startCameraStudio(); });
  document.getElementById('opInboxBtn')?.addEventListener('click', ()=>{ openTab('inbox', document.querySelector('[data-tab="inbox"]')); });
  document.getElementById('opMapBtn')?.addEventListener('click', toggleMapOffline);
  document.getElementById('opQrBtn')?.addEventListener('click', generateOperationsQR);

  document.getElementById('openCamStudioBtn')?.addEventListener('click', startCameraStudio);
  document.getElementById('startLiveStudioBtn')?.addEventListener('click', startCameraStudio);
  document.getElementById('exitCamBtn')?.addEventListener('click', closeCameraStudio);
  document.getElementById('closeCamStudioBtn')?.addEventListener('click', closeCameraStudio);
  document.getElementById('toggleFlashBtn')?.addEventListener('click', toggleFlashlight);
  document.getElementById('sendLiveHeartBtn')?.addEventListener('click', sendLiveHeart);
  document.getElementById('sendLiveCommentBtn')?.addEventListener('click', sendLiveComment);
  document.getElementById('publishTextBtn')?.addEventListener('click', publishPost);

  document.getElementById('sendInboxMsgBtn')?.addEventListener('click', sendInboxMessage);
  document.getElementById('logoutProfileBtn')?.addEventListener('click', logoutSystem);

  generateInitialQR();
});

// ===== مصادقة حقيقية =====
function switchAuthTab(tab){
  currentAuthTab=tab;
  const loginBtn=document.getElementById('tabLoginBtn');
  const regBtn=document.getElementById('tabRegBtn');
  const actionBtn=document.getElementById('authActionBtn');
  const otpBox=document.getElementById('otpBox');
  if(tab==='login'){
    loginBtn.className="text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1";
    regBtn.className="text-xs text-slate-400 pb-1";
    if(actionBtn) actionBtn.innerText="دخول القلعة السيادية 🔑";
    otpBox?.classList.add('hidden');
  }else{
    regBtn.className="text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1";
    loginBtn.className="text-xs text-slate-400 pb-1";
    if(actionBtn) actionBtn.innerText="إنشاء الحساب السيادي 🚀";
    otpBox?.classList.remove('hidden');
  }
}

async function processLogin(){
  const userField=document.getElementById('userPhoneOrEmail').value.trim();
  const passField=document.getElementById('userPass').value.trim();
  const emailField=document.getElementById('otpEmail')?.value.trim();
  const phoneField=document.getElementById('otpPhone')?.value.trim();
  const authMsg=document.getElementById('authMsg');
  if(!userField||!passField){ authMsg.innerText="⚠️ أكمل البيانات"; return; }

  try{
    if(currentAuthTab==='register'){
      if(!emailField &&!phoneField){ authMsg.innerText="أدخل إيميل أو جوال للكود"; return; }
      const r=await fetch('/api/auth/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:userField,email:emailField,phone:phoneField})});
      const d=await r.json();
      if(d.error){ authMsg.innerText=d.error; return; }
      const code=prompt(`كود أرسل إلى ${emailField||phoneField} (للتجربة الكود: ${d.otp_for_dev}) - أدخل الكود:`);
      if(!code) return;
      const r2=await fetch('/api/auth/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:userField,email:emailField,phone:phoneField,code,pass:passField})});
      const d2=await r2.json();
      if(d2.error){ authMsg.innerText=d2.error; return; }
      currentUser=d2.user; localStorage.setItem('tarim_user',currentUser);
      document.getElementById('authGate').classList.add('hidden');
      showToast("🚀 حساب سيادي جديد - أهلاً "+currentUser);
    }else{
      const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:userField,pass:passField})});
      const d=await r.json();
      if(d.error){ authMsg.innerText=d.error; return; }
      currentUser=d.user; localStorage.setItem('tarim_user',currentUser);
      localStorage.setItem('tarim_token',d.token);
      document.getElementById('authGate').classList.add('hidden');
      document.getElementById('homeUsernameDisplay').innerText='@'+currentUser+' 👑';
      socket.emit('join', currentUser);
      showToast("✨ أهلاً بك يا "+currentUser+" في القلعة!");
    }
  }catch(e){ authMsg.innerText="خطأ اتصال - "+e.message; }
}

async function processGoogleLogin(){
  showToast("🌐 جاري...");
  const r=await fetch('/api/auth/google',{method:'POST'}); const d=await r.json();
  currentUser=d.user; localStorage.setItem('tarim_user',currentUser);
  document.getElementById('authGate').classList.add('hidden');
  showToast("👑 أهلاً سيادي");
}

// ===== فيد =====
async function loadFeed(){
  try{
    const r=await fetch('/api/feed/home'); const posts=await r.json();
    const feed=document.getElementById('feedContainer');
    if(!feed) return;
    if(!posts.length){ feed.innerHTML='<div class="text-center text-xs text-slate-500 p-6">لا فيديوهات بعد - كن أول من ينشر سيادي ✨</div>'; return; }
    feed.innerHTML=posts.map(p=>`
      <div class="glass rounded-2xl p-3 mb-3">
        <div class="flex justify-between text-[10px] text-slate-400"><span>@${p.user}</span><span>${new Date(p.time).toLocaleTimeString()}</span></div>
        <div class="text-xs mt-2">${p.text}</div>
        ${p.video?`<video src="${p.video}" controls class="w-full rounded-xl mt-2 max-h-64"></video>`:''}
        <div class="flex gap-3 mt-2 text-xs">
          <button onclick="likePost('${p.id}')" id="like-${p.id}" class="bg-slate-800 px-3 py-1 rounded-full">❤️ ${p.likes||0}</button>
          <button onclick="commentPost('${p.id}')" class="bg-slate-800 px-3 py-1 rounded-full">💬 ${p.comments?.length||0}</button>
          <button onclick="giftPost('${p.id}')" class="bg-amber-500/20 px-3 py-1 rounded-full">🎁 ${p.gifts||0}</button>
        </div>
      </div>
    `).join('');
  }catch(e){}
}

async function publishPost(){
  const input=document.getElementById('postContentInput');
  const text=input.value.trim();
  if(!text){ showToast("✍️ اكتب شي"); return; }
  const ok = await window.AIEye?.scanVideo();
  if(ok===false) return;
  const r=await fetch('/api/feed/publish-video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:currentUser||'AL',text})});
  const d=await r.json();
  if(d.ok){ input.value=""; showToast("📢 تم نشر سيادي بنجاح"); loadFeed(); openTab('home', document.querySelector('[data-tab="home"]')); }
}

async function likePost(id){
  await fetch('/api/feed/like/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:currentUser})});
}

async function giftPost(id){
  await fetch('/api/feed/gift/'+id,{method:'POST'}); showToast("🎁 هدية سيادية!");
}

// ===== باقي الوظائف - نفس كودك الأصلي =====
function openTab(tabName, clickedBtn){
  ['home','operations','create','inbox','profile'].forEach(t=>{ const el=document.getElementById('tab-'+t); if(el) el.classList.add('hidden'); });
  document.getElementById('tab-'+tabName)?.classList.remove('hidden');
  if(clickedBtn){ document.querySelectorAll('.nav-btn').forEach(b=>b.classList.replace('text-cyan-400','text-slate-400')); clickedBtn.classList.replace('text-slate-400','text-cyan-400'); }
  if(tabName==='home') loadFeed();
}

function showToast(m){ const box=document.getElementById('toastBox'); const d=document.createElement('div'); d.className="bg-cyan-500 text-black font-bold text-xs px-4 py-2 rounded-xl shadow-lg mt-2 text-center w-full"; d.innerText=m; box.appendChild(d); setTimeout(()=>d.remove(),2500); }
function openModal(id){ document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id){ document.getElementById(id)?.classList.add('hidden'); }
function generateInitialQR(){ const box=document.getElementById('operationsQrBox'); if(box&&box.children.length===0&&window.QRCode){ new QRCode(box,{text:"https://tarimos.org/?sovereign=al",width:100,height:100}); } }
async function generateOperationsQR(){ const r=await fetch('/api/operations/qr/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:currentUser})}); const d=await r.json(); showToast("🧾 ختم ميداني: "+d.qr.slice(0,30)); }
function toggleMapOffline(){ const mapEl=document.getElementById('mapContainer'); mapEl.classList.toggle('hidden'); if(!mapEl.classList.contains('hidden')&&!mapInstance){ setTimeout(()=>{ mapInstance=L.map('mapContainer').setView([16.0042,48.9814],13); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance); L.marker([16.0042,48.9814]).addTo(mapInstance).bindPopup('تريم - حضرموت').openPopup(); },300); } }
function startCameraStudio(){ document.getElementById('fullScreenCam')?.classList.remove('hidden'); document.getElementById('liveChatOverlay')?.classList.remove('hidden'); navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:true}).then(s=>{localStream=s; document.getElementById('fullCamVideo').srcObject=s;}).catch(()=>showToast("⚠️ محاكاة كاميرا")); }
function closeCameraStudio(){ if(localStream){localStream.getTracks().forEach(t=>t.stop()); localStream=null;} document.getElementById('fullScreenCam')?.classList.add('hidden'); }
async function toggleFlashlight(){ if(!localStream){showToast("⚠️ افتح الكاميرا"); return;} try{const track=localStream.getVideoTracks()[0]; const cap=track.getCapabilities(); if(cap.torch){flashState=!flashState; await track.applyConstraints({advanced:[{torch:flashState}]}); document.getElementById('toggleFlashBtn').innerText=flashState?"🔦 مفعل":"🔦 معطل";}}catch(e){showToast("⚠️ فلاش غير مدعوم");}}
function sendLiveHeart(){ socket.emit('send_live_heart',{user:currentUser}); liveLikesCount++; document.getElementById('liveHeartCount').innerText=liveLikesCount; }
function sendLiveComment(){ const input=document.getElementById('liveCommentInput'); if(!input.value.trim()) return; socket.emit('send_live_comment',{user:currentUser,text:input.value}); input.value=""; }
function sendInboxMessage(){ const input=document.getElementById('inboxInputField'); if(!input.value.trim()) return; const list=document.getElementById('inboxMessagesList'); list.innerHTML+=`<div class="glass p-2.5 rounded-xl text-xs text-cyan-200"><b>${currentUser}:</b> ${input.value}</div>`; input.value=""; showToast("🚀 رسالة سيادية"); }
function sendSupportMessage(){ const input=document.getElementById('supportInput'); if(!input.value.trim()) return; const list=document.getElementById('supportChatList'); list.innerHTML+=`<div class="bg-slate-800 text-white p-2.5 rounded-xl text-right"><b>${currentUser}:</b> ${input.value}</div>`; setTimeout(()=>{list.innerHTML+=`<div class="bg-blue-500/20 text-blue-200 p-2.5 rounded-xl border border-blue-500/30"><b>دعم:</b> تم الاستلام سيادي 👑</div>`; list.scrollTop=list.scrollHeight;},800); input.value=""; }
function logoutSystem(){ if(confirm("خروج؟")){ localStorage.removeItem('tarim_user'); location.reload(); } }
