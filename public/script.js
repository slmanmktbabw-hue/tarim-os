const socket = io();
let posts = [];
let stream = null;
let facing = 'user';

function openTab(t){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  document.getElementById('tab-'+t)?.classList.remove('hidden');
}

// كاميرا TikTok
async function openCamera(f){
  facing = f;
  const v = document.getElementById('camPreview');
  v.classList.remove('hidden');
  try{
    stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:f}, audio:true});
    v.srcObject = stream;
  }catch(e){ alert('الكاميرا مرفوضة'); }
}
function toggleCameraFacing(){ 
  if(stream) stream.getTracks().forEach(t=>t.stop());
  openCamera(facing==='user'?'environment':'user'); 
}

// رفع الفيديو TikTok الحقيقي
let mediaRecorder; let chunks=[];
function startLive(){
  openCamera('user');
  setTimeout(()=>{
    const v=document.getElementById('camPreview');
    mediaRecorder = new MediaRecorder(v.srcObject, {mimeType:'video/webm'});
    chunks=[];
    mediaRecorder.ondataavailable=e=>chunks.push(e.data);
    mediaRecorder.onstop=async()=>{
      const blob = new Blob(chunks, {type:'video/webm'});
      const reader = new FileReader();
      reader.onloadend = async()=>{
        const base64 = reader.result;
        // رفع للسيرفر
        const res = await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({videoBase64:base64, name:'AL_'+Date.now()})});
        const data = await res.json();
        if(data.url){
          publishPost(data.url, 'video');
        }
      };
      reader.readAsDataURL(blob);
    };
    mediaRecorder.start();
    toast('🔴 تسجيل LIVE - 8 دقايق');
    setTimeout(()=>{ if(mediaRecorder.state!=='inactive') mediaRecorder.stop(); }, 480000); // 8 دقايق
  },1000);
}

async function publishPost(mediaUrl=null, type='text'){
  const text = document.getElementById('postText').value;
  if(!text && !mediaUrl) return toast('اكتب شي');
  const post={user:'AL', text, media:mediaUrl, type, likes:0, time:Date.now()};
  await fetch('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(post)});
  document.getElementById('postText').value='';
  loadPosts();
}

async function loadPosts(){
  const res = await fetch('/api/posts'); posts = await res.json();
  const feed=document.getElementById('feed'); feed.innerHTML='';
  posts.forEach(p=>{
    const d=document.createElement('div'); d.className='glass p-3 rounded-2xl text-xs';
    d.innerHTML=`<b>${p.user}</b><p>${p.text||''}</p>${p.media? (p.type==='video'?`<video src="${p.media}" controls class="w-full rounded-xl mt-2"></video>`:`<img src="${p.media}" class="w-full rounded-xl mt-2">`):''}<div class="mt-2 text-cyan-400">❤️ ${p.likes}</div>`;
    feed.appendChild(d);
  });
}

function toast(m){ const b=document.getElementById('toastBox'); const t=document.createElement('div'); t.className='bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold mb-2'; t.innerText=m; b.appendChild(t); setTimeout(()=>t.remove(),3000); }
socket.on('broadcast_post', p=>{ posts.unshift(p); loadPosts(); });
function registerAndLogin(){ document.getElementById('authGate').style.display='none'; loadPosts(); }
function sendMsg(){}
function genQR(){ new QRCode(document.getElementById('qrcode'), 'https://tarimos.org'); }

loadPosts();
