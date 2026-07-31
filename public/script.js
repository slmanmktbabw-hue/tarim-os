const socket = io();
let posts = []; let stream=null; let facing='user';
let currentUser=localStorage.getItem('tarim_user')||'AL';
let mediaRecorder,chunks=[]; let liveLikeCount=0;
function openTab(name){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  const tab=document.getElementById('tab-'+name);
  if(tab) tab.classList.remove('hidden'); else document.getElementById('tab-home')?.classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('text-cyan-400'));
  if(name==='home') document.querySelectorAll('nav button')[0]?.classList.add('text-cyan-400');
  if(name==='operations') document.querySelectorAll('nav button')[1]?.classList.add('text-cyan-400');
  if(name==='messages') document.querySelectorAll('nav button')[3]?.classList.add('text-cyan-400');
  if(name==='profile') document.querySelectorAll('nav button')[4]?.classList.add('text-cyan-400');
  if(name==='ai') loadAI(); if(name==='support') loadSupport(); if(name==='profile') genQR();
}
function registerAndLogin(){
  const u=document.getElementById('userPhone').value||'AL';
  const p=document.getElementById('userPass').value;
  if(p.length<3) return toast('كلمة المرور قصيرة');
  localStorage.setItem('tarim_user',u); currentUser=u;
  document.getElementById('authGate').style.display='none';
  toast('أهلاً '+u+' - النظام جاهز 🌍'); loadPosts(); updateWalletUI();
}
async function loadPosts(){
  try{
    const res=await fetch('/api/posts'); posts=await res.json();
    const feed=document.getElementById('feed'); if(!feed) return;
    feed.innerHTML='';
    posts.forEach(p=>{
      const d=document.createElement('div'); d.className='glass p-3 rounded-2xl text-xs';
      d.innerHTML=`<b>${p.user||'AL'}</b><p class="mt-1">${p.text||''}</p>${p.media? (p.type==='video'?`<video src="${p.media}" controls class="w-full rounded-xl mt-2"></video>`:`<img src="${p.media}" class="w-full rounded-xl mt-2">`):''}<div class="mt-2 flex gap-3"><span>❤️ ${p.likes||0}</span><span onclick="sendGift()">🎁 هدية</span></div>`;
      feed.appendChild(d);
    });
  }catch(e){}
}
async function publishPost(mediaUrl=null,type='text'){
  const text=document.getElementById('postText').value;
  if(!text&&!mediaUrl) return toast('اكتب شي');
  const post={user:currentUser,text,media:mediaUrl,type,likes:0,time:Date.now()};
  await fetch('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(post)});
  socket.emit('new_post',post); document.getElementById('postText').value='';
  toast('نشر عالمي 🌍'); exitFullScreen(); openTab('home');
}
function enterFullScreen(){
  const fs=document.getElementById('fullScreenCam');
  const fv=document.getElementById('fullCamVideo');
  const pv=document.getElementById('camPreview');
  if(!fs||!fv) return;
  fs.classList.remove('hidden');
  document.querySelector('header').style.display='none';
  document.querySelector('nav').style.display='none';
  if(pv.srcObject) fv.srcObject=pv.srcObject;
  document.getElementById('preLiveOverlay')?.classList.remove('hidden');
}
function exitFullScreen(){
  document.getElementById('fullScreenCam')?.classList.add('hidden');
  document.getElementById('preLiveOverlay')?.classList.add('hidden');
  document.querySelector('header').style.display='flex';
  document.querySelector('nav').style.display='flex';
  if(mediaRecorder&&mediaRecorder.state!=='inactive') mediaRecorder.stop();
  if(stream) stream.getTracks().forEach(t=>t.stop());
  document.getElementById('camPreview')?.classList.add('hidden');
}
async function openCamera(f){
  facing=f;
  const v=document.getElementById('camPreview'); v.classList.remove('hidden');
  try{
    if(stream) stream.getTracks().forEach(t=>t.stop());
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:f},audio:true});
    v.srcObject=stream; enterFullScreen();
  }catch(e){ toast('الكاميرا مرفوضة'); }
}
function toggleCameraFacing(){ openCamera(facing==='user'?'environment':'user'); }
function startLive(){ openCamera('user'); }
function confirmStartLive(){
  const overlay=document.getElementById('preLiveOverlay');
  if(overlay) overlay.classList.add('hidden');
  const v=document.getElementById('camPreview');
  if(!v.srcObject) return toast('افتح الكاميرا أولاً');
  mediaRecorder=new MediaRecorder(v.srcObject,{mimeType:'video/webm'}); chunks=[];
  mediaRecorder.ondataavailable=e=>chunks.push(e.data);
  mediaRecorder.onstop=async()=>{
    const blob=new Blob(chunks,{type:'video/webm'});
    const reader=new FileReader();
    reader.onloadend=async()=>{
      const base64=reader.result;
      const res=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({videoBase64:base64,name:currentUser+'_'+Date.now()})});
      const data=await res.json(); if(data.url) publishPost(data.url,'video');
    }; reader.readAsDataURL(blob);
  };
  mediaRecorder.start(); toast('🔴 بدأ البث - الجمهور يربح معك!');
  setTimeout(()=>{if(mediaRecorder?.state!=='inactive') mediaRecorder.stop();},480000);
}
function likeLive(){
  liveLikeCount++; const el=document.getElementById('liveLikes'); if(el) el.innerText=liveLikeCount;
  socket.emit('live_like',{count:liveLikeCount});
  const heart=document.createElement('div'); heart.innerText='❤️'; heart.className='fixed text-2xl animate-bounce';
  heart.style.right=Math.random()*80+10+'px'; heart.style.bottom='100px';
  document.getElementById('fullScreenCam').appendChild(heart); setTimeout(()=>heart.remove(),1000);
}
function focusLiveComment(){ document.getElementById('liveCommentIn').focus(); }
function sendLiveComment(){
  const inp=document.getElementById('liveCommentIn'); if(!inp.value) return;
  const box=document.getElementById('liveComments');
  box.innerHTML+=`<div class="bg-black/40 rounded-full px-2 py-1"><b>${currentUser}:</b> ${inp.value}</div>`;
  socket.emit('live_comment',{user:currentUser,text:inp.value}); inp.value='';
}
function repostLive(){ toast('🔁 تمت إعادة النشر'); }
function shareLive(){ navigator.share? navigator.share({title:'LIVE tarimos.org',url:'https://tarimos.org'}): toast('🔗 تم نسخ رابط البث'); }
function applyFilter(){ toast('✨ فلتر مفعل'); document.getElementById('camPreview').style.filter='brightness(1.2)'; document.getElementById('fullCamVideo').style.filter='brightness(1.2)'; }
function createPost(t){ openTab('create'); toast('اخترت: '+t); }
function loadAI(){ document.getElementById('aiLogs').innerHTML=`<div class="glass p-2 rounded-xl text-xs">👁️ عين الذكاء: أهلاً ${currentUser}</div>`; }
function sendAI(){
  const inp=document.getElementById('aiIn'); if(!inp.value) return;
  const txt=inp.value; const logs=document.getElementById('aiLogs');
  logs.innerHTML+=`<div class="text-right text-xs mt-2"><b>أنت:</b> ${txt}</div>`;
  setTimeout(()=>{ logs.innerHTML+=`<div class="glass p-2 rounded-xl text-xs mt-1">👁️ الذكاء: تم تحليل "${txt}" عالمياً</div>`; logs.scrollTop=logs.scrollHeight; },400);
  inp.value='';
}
function loadSupport(){ document.getElementById('supportLogs').innerHTML=`<div class="glass p-2 rounded-xl text-xs">🛡️ الدعم جاهز يا ${currentUser}؟</div>`; }
async function sendSupport(){
  const inp=document.getElementById('supportIn'); if(!inp.value) return;
  const txt=inp.value; const logs=document.getElementById('supportLogs');
  logs.innerHTML+=`<div class="text-right text-xs mt-2"><b>أنت:</b> ${txt}</div>`;
  try{
    const res=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:currentUser,text:txt})});
    const data=await res.json();
    logs.innerHTML+=`<div class="glass p-2 rounded-xl text-xs mt-1 bg-yellow-500/10">🛡️ الدعم: ${data.reply}</div>`;
  }catch(e){ logs.innerHTML+=`<div class="glass p-2 rounded-xl text-xs mt-1 bg-yellow-500/10">🛡️ تم فتح تذكرة</div>`; }
  inp.value=''; logs.scrollTop=logs.scrollHeight;
}
function genQR(){ const qr=document.getElementById('qrcode'); if(!qr) return; qr.innerHTML=''; new QRCode(qr,{text:'https://tarimos.org/u/'+currentUser,width:150,height:150}); }
function openMap(){ toast('🗺️ خريطة حضرموت'); window.open('https://maps.google.com/?q=Hadhramaut','_blank'); }
function changeBg(){ document.body.style.background=document.body.style.background==='#050b14'?'#1a1030':'#050b14'; toast('🎨 تم تغيير الخلفية'); }
function saveOffline(url){ let off=JSON.parse(localStorage.getItem('offline_videos')||'[]'); off.unshift(url); localStorage.setItem('offline_videos',JSON.stringify(off.slice(0,20))); }
function sendMsg(){ const inp=document.getElementById('chatIn'); if(!inp.value) return; const logs=document.getElementById('chatLogs'); logs.innerHTML+=`<div class="glass p-2 rounded-xl text-xs text-right"><b>${currentUser}:</b> ${inp.value}</div>`; inp.value=''; logs.scrollTop=logs.scrollHeight; }
function toast(m){ const b=document.getElementById('toastBox'); const t=document.createElement('div'); t.className='bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold mb-2 shadow-lg'; t.innerText=m; b.appendChild(t); setTimeout(()=>t.remove(),3000); }
function openWallet(){
  fetch('/api/wallet/'+currentUser).then(r=>r.json()).then(d=>{
    const box=document.createElement('div');
    box.className='fixed inset-0 z-[800] bg-black/80 flex items-center justify-center p-4';
    box.innerHTML=`<div class="glass rounded-3xl p-6 w-full max-w-sm text-center space-y-3 border-cyan-500/50">
      <div class="text-xl font-black text-cyan-400">💰 محفظة الجمهور</div>
      <div class="text-xs">رصيدك: <b class="text-green-400">${d.balance}</b></div>
      <div class="text-xs">أرباحك: <b class="text-yellow-400">${d.earned}</b></div>
      <div class="text-[10px] font-mono break-all bg-black/50 p-2 rounded">OKX: 0x53ce5e429ac48f355b775e418ded0b13931c0af6</div>
      <button onclick="this.parentElement.parentElement.remove()" class="w-full bg-cyan-500 text-black font-black py-2 rounded-xl text-xs">إغلاق</button>
    </div>`;
    document.body.appendChild(box);
  });
}
function openActivities(){
  const box=document.createElement('div');
  box.className='fixed inset-0 z-[800] bg-black/80 flex items-center justify-center p-4';
  box.innerHTML=`<div class="glass rounded-3xl p-6 w-full max-w-sm text-center space-y-3">
    <div class="font-black text-cyan-400">📊 مركز الأنشطة</div>
    <div class="text-xs">منشوراتك: ${posts.length}</div>
    <div class="text-xs">إعجابات LIVE: ${liveLikeCount}</div>
    <div class="text-xs">فيديوهات Offline: ${JSON.parse(localStorage.getItem('offline_videos')||'[]').length}</div>
    <div class="text-xs">المستخدم: ${currentUser}</div>
    <button onclick="this.parentElement.parentElement.remove()" class="w-full bg-cyan-500 text-black font-black py-2 rounded-xl text-xs">إغلاق</button>
  </div>`;
  document.body.appendChild(box);
}
function openOffline(){
  const off=JSON.parse(localStorage.getItem('offline_videos')||'[]');
  const box=document.createElement('div');
  box.className='fixed inset-0 z-[800] bg-black/80 flex items-center justify-center p-4';
  box.innerHTML=`<div class="glass rounded-3xl p-6 w-full max-w-sm space-y-3">
    <div class="font-black text-cyan-400">📥 فيديوهات بدون نت</div>
    <div class="text-xs max-h-40 overflow-y-auto">${off.length? off.map(u=>`<video src="${u}" controls class="w-full rounded-xl mt-2 h-20"></video>`).join(''): 'لا يوجد'}</div>
    <button onclick="this.parentElement.parentElement.remove()" class="w-full bg-cyan-500 text-black font-black py-2 rounded-xl text-xs">إغلاق</button>
  </div>`;
  document.body.appendChild(box);
}
function openMarket(){ toast('🏪 المجموعة التجارية قريباً - tarimos.org Mall'); }
function openPromo(){ toast('📢 الترويج: تواصل slmanmktbabw@gmail.com'); }
function openSettings(){ toast('⚙️ الإعدادات - OKX: 0x53ce...0af6'); }
function shareProfile(){ navigator.share? navigator.share({title:'AL - TARIM OS',url:'https://tarimos.org/u/'+currentUser}): toast('🔗 تم نسخ رابط ملفك'); }
async function sendPaidGift(gift){
  const res=await fetch('/api/wallet/gift',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:currentUser,to:'AL',gift})});
  const d=await res.json(); if(d.error) return toast(d.error);
  toast(`أرسلت ${gift} - ربحت ${d.earned} - رصيدك ${d.yourBalance}`);
  const b=document.getElementById('myBalance'); if(b) b.innerText=d.yourBalance;
  likeLive();
}
function sendGift(){ sendPaidGift('🎁'); }
function updateWalletUI(){
  fetch('/api/wallet/'+currentUser).then(r=>r.json()).then(d=>{
    const b=document.getElementById('myBalance'); if(b) b.innerText=d.balance;
    const e=document.getElementById('myEarn'); if(e) e.innerText=d.earned;
    const bs=document.getElementById('balanceShow'); if(bs) bs.innerText=d.balance;
  }).catch(()=>{});
}
socket.on('broadcast_post',p=>{ posts.unshift(p); loadPosts(); });
socket.on('live_like',d=>{ const el=document.getElementById('liveLikes'); if(el) el.innerText=d.count; });
socket.on('live_comment',d=>{ const box=document.getElementById('liveComments'); if(box) box.innerHTML+=`<div class="bg-black/40 rounded-full px-2 py-1"><b>${d.user}:</b> ${d.text}</div>`; });
if(localStorage.getItem('tarim_user')) document.getElementById('authGate').style.display='none';
loadPosts(); setInterval(updateWalletUI,3000); updateWalletUI();
