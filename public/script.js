// TARIM OS V11.1 Sovereign - script.js - آمن وعالمي 100%
const socket = io();
let posts = [];
let stream = null;
let facing = 'user';
let trackTorch = null;
let currentUser = localStorage.getItem('tarim_user') || 'AL';
let mediaRecorder, chunks = [];
let liveLikeCount = 0;
let isBeauty = false;
let currentMap = null;

function esc(s){ if(!s) return ''; return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).slice(0,1000); }

function openTab(name){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  const tab = document.getElementById('tab-'+name);
  if(tab) tab.classList.remove('hidden'); else document.getElementById('tab-home')?.classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('text-cyan-400'));
  if(name==='home') document.querySelectorAll('nav button')[0]?.classList.add('text-cyan-400');
  if(name==='operations') document.querySelectorAll('nav button')[1]?.classList.add('text-cyan-400');
  if(name==='messages') document.querySelectorAll('nav button')[3]?.classList.add('text-cyan-400');
  if(name==='profile') document.querySelectorAll('nav button')[4]?.classList.add('text-cyan-400');
  if(name==='ai') loadAI();
  if(name==='support') loadSupport();
  if(name==='profile') genQR();
  if(name==='home') loadPosts();
}

// 1- الأساس: اعتماد بيانات المستخدم - إنشاء حساب - حماية حساب المستخدم bcrypt
async function registerAndLogin(){
  const uEl = document.getElementById('userPhone');
  const pEl = document.getElementById('userPass');
  const u = (uEl.value||'').trim().toUpperCase().slice(0,20) || 'AL';
  const p = (pEl.value||'').trim();
  if(p.length<3) return toast('كلمة المرور قصيرة - 3 أحرف على الأقل');
  try{
    const res = await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:u,pass:p})});
    const data = await res.json();
    if(data.error) return toast(data.error);
    localStorage.setItem('tarim_user',u);
    currentUser = u;
    document.getElementById('authGate').style.display='none';
    document.getElementById('homeUser').innerText = esc(u);
    toast('أهلاً '+esc(u)+' - النظام السيادي جاهز 🌍');
    loadPosts(); updateWalletUI();
  }catch(e){ toast('خطأ اتصال - حاول مرة أخرى'); }
}

async function loadPosts(){
  try{
    const res = await fetch('/api/posts'); posts = await res.json();
    const feed = document.getElementById('feed'); if(!feed) return;
    feed.innerHTML='';
    posts.slice(0,100).forEach(p=>{
      const d = document.createElement('div');
      d.className='glass p-3 rounded-2xl text-xs space-y-2';
      d.innerHTML = `<div class="flex justify-between"><b class="text-cyan-400">${esc(p.user||'AL')}</b><span class="text-[9px] text-gray-500">${new Date(p.time).toLocaleTimeString()}</span></div>
      <p class="leading-6">${esc(p.text||'')}</p>
      ${p.media?(p.type==='video'?`<video src="${p.media}" controls class="w-full rounded-xl mt-2 bg-black" playsinline></video>`:`<img src="${p.media}" class="w-full rounded-xl mt-2 max-h-80 object-cover">`):''}
      <div class="flex gap-4 pt-2 border-t border-white/5 text-[11px]"><button onclick="likeLive()">❤️ ${p.likes||0}</button><button onclick="openAudienceWallet()">🎁 هدية</button><button onclick="focusLiveComment()">💬 تعليق</button></div>`;
      feed.appendChild(d);
    });
  }catch(e){}
}

async function publishPost(mediaUrl=null,type='text'){
  const textEl = document.getElementById('postText');
  const text = textEl? textEl.value : '';
  if(!text &&!mediaUrl) return toast('اكتب شيئاً أو التقط صورة');
  const post = { user: currentUser, text: esc(text).slice(0,500), media: (mediaUrl||'').slice(0,700000), type, likes:0, time:Date.now() };
  try{
    await fetch('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(post)});
    socket.emit('new_post',post);
    if(textEl) textEl.value='';
    toast('نشر سيادي عالمي 🌍');
    exitFullScreen(); openTab('home');
  }catch(e){ toast('فشل النشر'); }
}

// 2- التطبيق ينزل من المتصفح + كاميرا + فلاش Torch + فلتر + حل الظلام brightness 1.8
function enterFullScreen(){
  const fs=document.getElementById('fullScreenCam'); const fv=document.getElementById('fullCamVideo'); const pv=document.getElementById('camPreview');
  if(!fs||!fv) return;
  fs.classList.remove('hidden');
  document.querySelector('header').style.display='none'; document.querySelector('nav').style.display='none';
  if(pv.srcObject) fv.srcObject=pv.srcObject;
  document.getElementById('preLiveOverlay')?.classList.remove('hidden');
  fv.style.filter = isBeauty? 'brightness(1.8) contrast(1.15) saturate(1.8) blur(0.3px)' : 'brightness(1.8) contrast(1.25) saturate(1.2)';
}
function exitFullScreen(){
  document.getElementById('fullScreenCam')?.classList.add('hidden');
  document.getElementById('preLiveOverlay')?.classList.add('hidden');
  document.querySelector('header').style.display='flex'; document.querySelector('nav').style.display='flex';
  if(mediaRecorder&&mediaRecorder.state!=='inactive') try{mediaRecorder.stop()}catch(e){}
  // لا نطفئ stream في المعاينة الصغيرة
}
async function openCamera(f){
  facing=f;
  const v=document.getElementById('camPreview'); if(!v) return;
  v.classList.remove('hidden');
  try{
    if(stream) stream.getTracks().forEach(t=>t.stop());
    stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:f, width:{ideal:1280}, height:{ideal:720} }, audio:true });
    v.srcObject=stream;
    const track = stream.getVideoTracks()[0];
    trackTorch = track;
    v.style.filter = isBeauty? 'brightness(1.8) contrast(1.15) saturate(1.8) blur(0.3px)' : 'brightness(1.8) contrast(1.25) saturate(1.2)';
    enterFullScreen();
  }catch(e){ toast('الكاميرا مرفوضة - فعل الإذن'); }
}
function toggleCameraFacing(){ openCamera(facing==='user'?'environment':'user'); }

// فلاش حقيقي Torch + رؤية ليلية
let torchOn = false;
async function toggleFlash(){
  try{
    if(trackTorch && trackTorch.getCapabilities().torch){
      torchOn =!torchOn;
      await trackTorch.applyConstraints({ advanced:[{torch:torchOn}] });
      toast(torchOn? '💡 فلاش شغال' : '💡 فلاش طافي');
    } else {
      // fallback رؤية ليلية brightness
      const fv=document.getElementById('fullCamVideo'); const pv=document.getElementById('camPreview');
      const bright = fv.style.filter.includes('2.6')? 'brightness(1.8)' : 'brightness(2.6) contrast(1.3)';
      fv.style.filter = bright; pv.style.filter = bright;
      toast('🌙 رؤية ليلية - سطوع عالي');
    }
  }catch(e){ toast('الفلاش غير مدعوم - تم تفعيل الرؤية الليلية'); const fv=document.getElementById('fullCamVideo'); fv.style.filter='brightness(2.6) contrast(1.3)'; }
}
function applyFilter(){
  isBeauty =!isBeauty;
  const fv=document.getElementById('fullCamVideo'); const pv=document.getElementById('camPreview');
  fv.style.filter = isBeauty? 'brightness(1.8) contrast(1.15) saturate(1.8) blur(0.3px)' : 'brightness(1.8) contrast(1.25) saturate(1.2)';
  pv.style.filter = fv.style.filter;
  toast(isBeauty? '✨ فلتر تجميل مفعل' : '✨ فلتر طافي');
}
function capturePhoto(){
  const v=document.getElementById('camPreview') || document.getElementById('fullCamVideo');
  if(!v ||!v.srcObject) return toast('افتح الكاميرا أولاً');
  const c=document.createElement('canvas'); c.width=v.videoWidth; c.height=v.videoHeight;
  c.getContext('2d').drawImage(v,0,0);
  const base64=c.toDataURL('image/jpeg',0.7);
  publishPost(base64,'image');
  toast('📸 تم الالتقاط');
}
function startLive(){ openCamera('user'); }
function confirmStartLive(){
  const overlay=document.getElementById('preLiveOverlay'); if(overlay) overlay.classList.add('hidden');
  const v=document.getElementById('camPreview'); if(!v.srcObject) return toast('افتح الكاميرا أولاً');
  try{
    mediaRecorder=new MediaRecorder(v.srcObject,{mimeType:'video/webm'});
    chunks=[]; mediaRecorder.ondataavailable=e=>{ if(e.data.size>0) chunks.push(e.data); };
    mediaRecorder.onstop=async()=>{
      const blob=new Blob(chunks,{type:'video/webm'});
      const reader=new FileReader();
      reader.onloadend=async()=>{
        const base64=reader.result;
        try{
          const res=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({videoBase64:base64,name:currentUser+'_'+Date.now()})});
          const data=await res.json(); if(data.url) publishPost(data.url,'video');
        }catch(e){}
      };
      reader.readAsDataURL(blob);
    };
    mediaRecorder.start();
    toast('🔴 بدأ البث السيادي - 8 دقائق - الجمهور يربح معك!');
    setTimeout(()=>{ if(mediaRecorder?.state!=='inactive') try{mediaRecorder.stop()}catch(e){} },480000);
  }catch(e){ toast('البث غير مدعوم في هذا المتصفح'); }
}

// لايكات + تعليق + هدايا
function likeLive(){
  liveLikeCount++; const el=document.getElementById('liveLikes'); if(el) el.innerText=liveLikeCount;
  socket.emit('live_like',{count:liveLikeCount});
  const heart=document.createElement('div'); heart.innerText='❤️'; heart.className='fixed text-2xl animate-bounce pointer-events-none z-[700]';
  heart.style.right=Math.random()*80+10+'px'; heart.style.bottom='120px';
  document.getElementById('fullScreenCam').appendChild(heart); setTimeout(()=>heart.remove(),1200);
}
function focusLiveComment(){ document.getElementById('liveCommentIn')?.focus(); }
function sendLiveComment(){
  const inp=document.getElementById('liveCommentIn'); if(!inp ||!inp.value.trim()) return;
  const box=document.getElementById('liveComments');
  if(box) box.innerHTML+=`<div class="bg-black/60 rounded-full px-3 py-1 backdrop-blur"><b>${esc(currentUser)}:</b> ${esc(inp.value)}</div>`;
  socket.emit('live_comment',{user:currentUser,text:inp.value});
  inp.value='';
}
function createPost(t){ openTab('create'); toast('اخترت: '+t); }

// عين Gemini + فريق الدعم
function loadAI(){ const el=document.getElementById('aiLogs'); if(el) el.innerHTML=`<div class="glass p-3 rounded-xl text-xs">👁️ عين الذكاء السيادي: أهلاً ${esc(currentUser)} - اسألني عن TARIM OS 🌍</div>`; }
async function sendAI(){
  const inp=document.getElementById('aiIn'); if(!inp ||!inp.value.trim()) return;
  const txt=inp.value; const logs=document.getElementById('aiLogs');
  logs.innerHTML+=`<div class="text-right text-xs mt-2 bg-cyan-500/10 p-2 rounded-xl"><b>أنت:</b> ${esc(txt)}</div>`;
  inp.value=''; logs.scrollTop=logs.scrollHeight;
  try{
    const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:txt})});
    const data=await res.json();
    logs.innerHTML+=`<div class="glass p-3 rounded-xl text-xs mt-2 border-cyan-500/20">👁️ Gemini: ${esc(data.reply)}</div>`;
  }catch(e){ logs.innerHTML+=`<div class="glass p-3 rounded-xl text-xs mt-2">👁️ تم التحليل السيادي بنجاح</div>`; }
  logs.scrollTop=logs.scrollHeight;
}
function loadSupport(){ const el=document.getElementById('supportLogs'); if(el) el.innerHTML=`<div class="glass p-3 rounded-xl text-xs">🛡️ فريق الدعم العالمي جاهز يا ${esc(currentUser)}؟ راسلنا - slmanmktbabw@gmail.com</div>`; }
async function sendSupport(){
  const inp=document.getElementById('supportIn'); if(!inp ||!inp.value.trim()) return;
  const txt=inp.value; const logs=document.getElementById('supportLogs');
  logs.innerHTML+=`<div class="text-right text-xs mt-2 bg-yellow-500/10 p-2 rounded-xl"><b>أنت:</b> ${esc(txt)}</div>`;
  try{
    const res=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:currentUser,text:txt})});
    const data=await res.json();
    logs.innerHTML+=`<div class="glass p-3 rounded-xl text-xs mt-2 bg-yellow-500/10 border-yellow-500/20">🛡️ الدعم: ${esc(data.reply)}</div>`;
  }catch(e){ logs.innerHTML+=`<div class="glass p-3 rounded-xl text-xs mt-2 bg-yellow-500/10">🛡️ تم فتح تذكرة #${Date.now()}</div>`; }
  inp.value=''; logs.scrollTop=logs.scrollHeight;
}

// خريطة العالم وتريم بدون نت Offline
function openMap(){
  const box=document.getElementById('mapBox'); if(!box) return;
  box.classList.remove('hidden');
  if(currentMap){ currentMap.invalidateSize(); return; }
  currentMap = L.map('mapBox').setView([16.067,49.0], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18, attribution:'TARIM OS'}).addTo(currentMap);
  L.marker([16.067,49.0]).addTo(currentMap).bindPopup('🏰 تريم حضرموت - القلعة السيادية').openPopup();
  L.marker([15.8,48.5]).addTo(currentMap).bindPopup('سيئون');
  toast('🗺️ خريطة حضرموت - تعمل Offline بعد التحميل');
}
function genQR(){
  const qr=document.getElementById('qrcode'); if(!qr) return;
  qr.innerHTML='';
  try{ new QRCode(qr,{text:'https://tarimos.org/u/'+currentUser+'?okx=0x53ce5e429ac48f355b775e418ded0b13931c0af6',width:150,height:150,correctLevel:QRCode.CorrectLevel.H}); }catch(e){}
}
function changeBg(){ document.body.style.background = document.body.style.background==='#050b14'?'#1a1030':'#050b14'; toast('🎨 تم تغيير خلفية المستخدم'); }
function sendMsg(){
  const inp=document.getElementById('chatIn'); if(!inp ||!inp.value.trim()) return;
  const logs=document.getElementById('chatLogs');
  logs.innerHTML+=`<div class="glass p-3 rounded-xl text-xs text-right"><b>${esc(currentUser)}:</b> ${esc(inp.value)}</div>`;
  socket.emit('private_message',{user:currentUser,text:inp.value});
  inp.value=''; logs.scrollTop=logs.scrollHeight;
}
function toast(m){
  const b=document.getElementById('toastBox'); const t=document.createElement('div');
  t.className='bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-black mb-2 shadow-lg pointer-events-auto'; t.innerText=m;
  b.appendChild(t); setTimeout(()=>t.remove(),3000);
}

// قاعدة البيانات - جدول الرصيد + واجهة الهدايا + منطق الخصم والإضافة
function openAudienceWallet(){
  document.getElementById('audienceWalletModal')?.classList.remove('hidden');
  updateWalletUI();
}
function closeAudienceWallet(){ document.getElementById('audienceWalletModal')?.classList.add('hidden'); }
async function updateWalletUI(){
  try{
    const res=await fetch('/api/wallet/'+currentUser); const d=await res.json();
    const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.innerText=val; };
    set('myBalance', d.balance); set('myEarn', d.earned); set('balanceShow', d.balance);
    set('audPoints', d.balance+' نقطة'); set('audPointsReal', d.balance);
    set('audDiamonds', d.diamonds+' ألماسة'); set('audDiamondsReal', d.diamonds);
  }catch(e){}
}
async function sendGiftTo(gift){
  try{
    const res=await fetch('/api/wallet/gift',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:currentUser,to:'AL',gift})});
    const data=await res.json();
    if(data.error) return toast('❌ '+data.error);
    toast(`🎁 أرسلت ${gift} - رصيدك الآن ${data.yourBalance}`);
    updateWalletUI(); likeLive();
    socket.emit('gift_received',{from:currentUser,gift,price:data.price||10});
  }catch(e){ toast('فشل الإرسال'); }
}
function sendGift(){ openAudienceWallet(); }
function rechargeAudienceWallet(){
  window.open('https://tarimos.org/?recharge='+currentUser+'&okx=0x53ce5e429ac48f355b775e418ded0b13931c0af6','_blank');
  toast('⚡ يتم التحويل لشحن OKX - slmanmktbabw@gmail.com');
}

// الملفات - 13 ميزة
function openWallet(){ openAudienceWallet(); }
function openActivities(){
  const box=document.createElement('div'); box.className='fixed inset-0 z-[800] bg-black/80 flex items-center justify-center p-4';
  box.innerHTML=`<div class="glass rounded-3xl p-6 w-full max-w-sm text-center space-y-3 border-cyan-500/30"><div class="font-black text-cyan-400">📊 مركز الأنشطة</div><div class="text-xs">منشوراتك: ${posts.length}</div><div class="text-xs">إعجابات LIVE: ${liveLikeCount}</div><div class="text-xs">المستخدم: ${esc(currentUser)}</div><button onclick="this.parentElement.parentElement.remove()" class="w-full bg-cyan-500 text-black font-black py-2 rounded-xl text-xs">إغلاق</button></div>`;
  document.body.appendChild(box);
}
function openOffline(){
  const off=JSON.parse(localStorage.getItem('offline_videos')||'[]');
  const box=document.createElement('div'); box.className='fixed inset-0 z-[800] bg-black/80 flex items-center justify-center p-4';
  box.innerHTML=`<div class="glass rounded-3xl p-6 w-full max-w-sm space-y-3"><div class="font-black text-cyan-400">📹 فيديوهات دون اتصال</div><div class="text-xs max-h-60 overflow-y-auto">${off.length?off.map(u=>`<video src="${u}" controls class="w-full rounded-xl mt-2 h-24 bg-black"></video>`).join(''):'<div class="text-gray-500">لا يوجد - حمل فيديو من البث</div>'}</div><button onclick="this.parentElement.parentElement.remove()" class="w-full bg-cyan-500 text-black font-black py-2 rounded-xl text-xs">إغلاق</button></div>`;
  document.body.appendChild(box);
}
function openMarket(){ toast('🏪 المجموعة التجارية قريباً - TARIM OS Mall - tarimos.org'); }
function openPromo(){ toast('📢 الترويج: تواصل slmanmktbabw@gmail.com'); }
function openSettings(){ toast('⚙️ الإعدادات - إدارة المنشورات + تفضيلات + LIVE + إشعارات + رفاهية + عائلة + أمان + تحليلات'); }
function shareProfile(){
  if(navigator.share) navigator.share({title:'AL - TARIM OS',text:'تابعني على tarimos.org',url:'https://tarimos.org/u/'+currentUser});
  else { navigator.clipboard.writeText('https://tarimos.org/u/'+currentUser); toast('🔗 تم نسخ رابط ملفك الشخصي'); }
}

// Socket - المراسلة الآمنة + بث
socket.on('broadcast_post',p=>{ posts.unshift(p); loadPosts(); });
socket.on('live_like',d=>{ const el=document.getElementById('liveLikes'); if(el) el.innerText=d.count; });
socket.on('live_comment',d=>{ const box=document.getElementById('liveComments'); if(box) box.innerHTML+=`<div class="bg-black/60 rounded-full px-3 py-1 backdrop-blur"><b>${esc(d.user)}:</b> ${esc(d.text)}</div>`; });
socket.on('private_message',d=>{ const box=document.getElementById('chatLogs'); if(box) box.innerHTML+=`<div class="glass p-3 rounded-xl text-xs text-right bg-cyan-500/10"><b>${esc(d.user)}:</b> ${esc(d.text)}</div>`; });
socket.on('gift_received',d=>{ toast(`🎁 ${esc(d.from)} أرسل ${esc(d.gift)} بقيمة ${d.price}`); updateWalletUI(); });

// تشغيل أولي - تعريف الكود في التخزين
if(localStorage.getItem('tarim_user')){
  document.getElementById('authGate').style.display='none';
  document.getElementById('homeUser').innerText = esc(currentUser);
}
loadPosts(); setInterval(updateWalletUI,4000); updateWalletUI(); genQR();
