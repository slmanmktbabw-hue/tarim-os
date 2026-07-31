const socket = io();
let posts = [];
let stream = null;
let facing = 'user';
let currentUser = localStorage.getItem('tarim_user') || 'AL';

// فتح كل التبويبات - يصلح الزرين فوق + 5 تحت
function openTab(name){
  console.log('فتح:', name);
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  const tab = document.getElementById('tab-'+name);
  if(tab) tab.classList.remove('hidden');
  else document.getElementById('tab-home')?.classList.remove('hidden');

  // تحديث لون الأزرار السفلية
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('text-cyan-400'));
  if(name==='home') document.querySelectorAll('nav button')[0]?.classList.add('text-cyan-400');
  if(name==='operations') document.querySelectorAll('nav button')[1]?.classList.add('text-cyan-400');
  if(name==='messages') document.querySelectorAll('nav button')[3]?.classList.add('text-cyan-400');
  if(name==='profile') document.querySelectorAll('nav button')[4]?.classList.add('text-cyan-400');

  if(name==='ai') loadAI();
  if(name==='support') loadSupport();
  if(name==='profile') genQR();
}

function registerAndLogin(){
  const u = document.getElementById('userPhone').value || 'AL';
  const p = document.getElementById('userPass').value;
  if(p.length < 3) return toast('كلمة المرور قصيرة');
  localStorage.setItem('tarim_user', u);
  currentUser = u;
  document.getElementById('authGate').style.display='none';
  toast('أهلاً '+u+' - النظام العالمي جاهز 🌍');
  loadPosts();
}

// TikTok Feed
async function loadPosts(){
  try{
    const res = await fetch('/api/posts');
    posts = await res.json();
    const feed = document.getElementById('feed');
    if(!feed) return;
    feed.innerHTML='';
    posts.forEach(p=>{
      const d=document.createElement('div');
      d.className='glass p-3 rounded-2xl text-xs';
      d.innerHTML=`<b>${p.user||'AL'}</b><p class="mt-1">${p.text||''}</p>${p.media? (p.type==='video'?`<video src="${p.media}" controls class="w-full rounded-xl mt-2"></video>`:`<img src="${p.media}" class="w-full rounded-xl mt-2">`):''}<div class="mt-2 flex gap-3"><span>❤️ ${p.likes||0}</span><span onclick="sendGift('${p.id}')">🎁 هدية</span></div>`;
      feed.appendChild(d);
    });
  }catch(e){console.log(e)}
}
async function publishPost(mediaUrl=null, type='text'){
  const text=document.getElementById('postText').value;
  if(!text &&!mediaUrl) return toast('اكتب شي');
  const post={user:currentUser, text, media:mediaUrl, type, likes:0, time:Date.now()};
  await fetch('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(post)});
  socket.emit('new_post', post);
  document.getElementById('postText').value='';
  toast('نشر عالمي 🌍');
  openTab('home');
}

// كاميرا و LIVE
async function openCamera(f){
  facing=f;
  const v=document.getElementById('camPreview');
  v.classList.remove('hidden');
  try{
    if(stream) stream.getTracks().forEach(t=>t.stop());
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:f}, audio:true});
    v.srcObject=stream;
  }catch(e){toast('الكاميرا مرفوضة');}
}
function toggleCameraFacing(){ openCamera(facing==='user'?'environment':'user'); }
let mediaRecorder,chunks=[];
function startLive(){
  openCamera('user'); openTab('create');
  setTimeout(()=>{
    const v=document.getElementById('camPreview');
    if(!v.srcObject) return;
    mediaRecorder=new MediaRecorder(v.srcObject,{mimeType:'video/webm'});
    chunks=[]; mediaRecorder.ondataavailable=e=>chunks.push(e.data);
    mediaRecorder.onstop=async()=>{
      const blob=new Blob(chunks,{type:'video/webm'});
      const reader=new FileReader();
      reader.onloadend=async()=>{
        const base64=reader.result;
        const res=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({videoBase64:base64, name:currentUser+'_'+Date.now()})});
        const data=await res.json();
        if(data.url){ publishPost(data.url,'video'); saveOffline(data.url); }
      };
      reader.readAsDataURL(blob);
    };
    mediaRecorder.start(); toast('🔴 LIVE 8 دقايق - مع هدايا 🎁');
    setTimeout(()=>{if(mediaRecorder?.state!=='inactive') mediaRecorder.stop();},480000);
  },1000);
}
function applyFilter(){ toast('✨ فلتر تجميل مفعل'); document.getElementById('camPreview').style.filter='brightness(1.2) contrast(1.1)'; }
function sendGift(id){ toast('🎁 أرسلت هدية سيادية!'); }
function createPost(t){ openTab('create'); toast('اخترت: '+t); }

// عين الذكاء + الدعم - تصلح الزرين فوق
function loadAI(){ document.getElementById('aiLogs').innerHTML='<div class="glass p-2 rounded-xl text-xs">👁️ عين الذكاء: أهلاً '+currentUser+' - نظام TARIM العالمي يراقب 24/7</div>'; }
function sendAI(){
  const inp=document.getElementById('aiIn'); const txt=inp.value; if(!txt) return;
  const logs=document.getElementById('aiLogs');
  logs.innerHTML+=`<div class="text-right text-xs"><b>أنت:</b> ${txt}</div><div class="glass p-2 rounded-xl text-xs mt-1">👁️ الذكاء: تم استلام طلبك - النظام السيادي يحلل "${txt}" عالمياً</div>`;
  inp.value=''; logs.scrollTop=logs.scrollHeight;
}
function loadSupport(){ document.getElementById('supportLogs').innerHTML='<div class="glass p-2 rounded-xl text-xs">🛡️ الدعم: فريق الدعم العالمي جاهز - كيف نساعدك يا '+currentUser+'؟</div>'; }
function sendSupport(){
  const inp=document.getElementById('supportIn'); const txt=inp.value; if(!txt) return;
  const logs=document.getElementById('supportLogs');
  logs.innerHTML+=`<div class="text-right text-xs"><b>أنت:</b> ${txt}</div><div class="glass p-2 rounded-xl text-xs mt-1 bg-yellow-500/10">🛡️ الدعم: تم فتح تذكرة - سيرد الفريق خلال دقائق</div>`;
  inp.value=''; logs.scrollTop=logs.scrollHeight;
}

// الملفات - كل الأزرار اللي في صورتك
function genQR(){
  const qr=document.getElementById('qrcode');
  if(!qr) return;
  qr.innerHTML='';
  new QRCode(qr, {text:'https://tarimos.org/u/'+currentUser, width:150, height:150});
}
function openMap(){ toast('🗺️ خريطة حضرموت Offline - جاري التحميل'); window.open('https://maps.google.com/?q=Hadhramaut','_blank'); }
function changeBg(){ document.body.style.background = document.body.style.background==='#050b14'? '#1a1030' : '#050b14'; toast('🎨 تم تغيير الخلفية'); }
function saveOffline(url){ let off=JSON.parse(localStorage.getItem('offline_videos')||'[]'); off.unshift(url); localStorage.setItem('offline_videos', JSON.stringify(off.slice(0,20))); }
function sendMsg(){
  const inp=document.getElementById('chatIn'); const txt=inp.value; if(!txt) return;
  const logs=document.getElementById('chatLogs');
  logs.innerHTML+=`<div class="glass p-2 rounded-xl text-xs text-right"><b>${currentUser}:</b> ${txt}</div>`;
  inp.value=''; logs.scrollTop=logs.scrollHeight;
}

function toast(m){ const b=document.getElementById('toastBox'); const t=document.createElement('div'); t.className='bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold mb-2 shadow-lg'; t.innerText=m; b.appendChild(t); setTimeout(()=>t.remove(),3000); }

socket.on('broadcast_post', p=>{ posts.unshift(p); loadPosts(); });

// تشغيل أولي
if(localStorage.getItem('tarim_user')) document.getElementById('authGate').style.display='none';
loadPosts();
