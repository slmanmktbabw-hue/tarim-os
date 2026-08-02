const socket = io();
let currentUser = null;
let stream = null;
let cameraFacing = 'environment';
let videoData = [];

function showToast(msg){
  const box = document.getElementById('toastBox');
  const el = document.createElement('div');
  el.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold mb-2';
  el.innerText = msg;
  box.appendChild(el);
  setTimeout(()=>el.remove(),3000);
}

// بوابة الدخول
function registerAndLogin(){
  const phone = document.getElementById('userPhone').value || 'AL';
  const pass = document.getElementById('userPass').value || '1234';
  currentUser = phone;
  socket.emit('register', {phone, pass});
  document.getElementById('authGate').classList.add('hidden');
  openTab('home', {target: document.querySelector('nav button')});
  showToast('مرحبا بك ' + phone);
}

// التنقل بين التبويبات
function openTab(name, event){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  document.getElementById('tab-'+name)?.classList.remove('hidden');

  document.querySelectorAll('nav button').forEach(b=>{
    b.classList.remove('text-cyan-400');
    b.classList.add('text-gray-400');
  });
  event.target.closest('button').classList.add('text-cyan-400');
  event.target.closest('button').classList.remove('text-gray-400');

  if(name==='home') loadVideoFeed();
  if(name==='ai') loadAI();
  if(name==='support') loadSupport();
  if(name==='profile') genQR();
  if(name==='inbox') document.getElementById('inboxBadge').classList.add('hidden');
}

// 1. فيد الفيديو - الرئيسية
function loadVideoFeed(){
  const feed = document.getElementById('videoFeed');
  if(videoData.length === 0){
    videoData = [
      {user:'AL', text:'النظام السيادي TARIM OS', likes:120},
      {user:'Test', text:'بث تجريبي من حضرموت', likes:45}
    ]
  }
  feed.innerHTML = videoData.map(v=>`
    <div class="h-screen w-full snap-start relative flex items-end p-4 bg-gradient-to-t from-black via-transparent to-black">
      <div class="w-full text-xs">
        <div class="font-black">@${v.user}</div>
        <div>${v.text}</div>
        <div class="mt-2">❤️ ${v.likes}</div>
      </div>
    </div>
  `).join('');
}

// 2. العمليات
function startLive(){ document.getElementById('fullScreenCam').classList.remove('hidden'); document.getElementById('preLiveOverlay').style.display='flex'; }
function exitFullScreen(){ document.getElementById('fullScreenCam').classList.add('hidden'); }
function confirmStartLive(){ document.getElementById('preLiveOverlay').style.display='none'; showToast('تم بدء البث 8 دقائق'); }
function openMap(){ showToast('خريطة حضرموت Offline جاري التحميل'); }
function genQR(){ 
  document.getElementById('qrcode').innerHTML='';
  new QRCode(document.getElementById('qrcode'), {text: "tarimos.org/"+currentUser, width:128, height:128});
}

// 3. الانشاء
async function openCamera(facing){
  cameraFacing = facing;
  stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:facing}});
  const vid = document.getElementById('camPreview');
  vid.srcObject = stream;
  vid.classList.remove('hidden');
}
function toggleCameraFacing(){
  cameraFacing = cameraFacing === 'user' ? 'environment' : 'user';
  openCamera(cameraFacing);
}
function createPost(type){ document.getElementById('postText').placeholder = 'اكتب ' + type + '...'; }
function publishPost(){
  const txt = document.getElementById('postText').value;
  videoData.unshift({user:currentUser, text:txt, likes:0});
  showToast('تم النشر بنجاح');
  document.getElementById('postText').value='';
}
function applyFilter(){ showToast('تم تطبيق الفلتر السيادي'); }

// 4. الوارد
function sendMsg(){
  const txt = document.getElementById('chatIn').value;
  if(!txt) return;
  document.getElementById('chatLogs').innerHTML += `<div class="text-right bg-cyan-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('chatIn').value='';
}

// 5. الملفات
function openWallet(){ showToast('رصيد OKX: 0x53...c0af6'); }
function openActivities(){ showToast('مركز الانشطة'); }
function openOffline(){ showToast('الفيديوهات المحفوظة'); }
function openMarket(){ showToast('المجموعة التجارية'); }
function openPromo(){ showToast('الترويج والإعلانات'); }
function openSettings(){ showToast('ادارة المنشورات'); }
function shareProfile(){ navigator.clipboard.writeText('tarimos.org/'+currentUser); showToast('تم نسخ الرابط'); }
function changeBg(){ document.body.style.background='#001'; showToast('تم تغيير الخلفية'); }

// الذكاء
function loadAI(){ document.getElementById('aiLogs').innerHTML = '<div class="text-xs">مرحبا انا عين الذكاء. اسألني</div>' }
function sendAI(){
  const txt = document.getElementById('aiIn').value;
  document.getElementById('aiLogs').innerHTML += `<div class="text-right bg-cyan-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('aiIn').value='';
}

// الدعم
function loadSupport(){ document.getElementById('supportLogs').innerHTML = '<div class="text-xs text-yellow-400">فريق الدعم جاهز</div>' }
function sendSupport(){
  const txt = document.getElementById('supportIn').value;
  document.getElementById('supportLogs').innerHTML += `<div class="text-right bg-yellow-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('supportIn').value='';
}

// البث
function likeLive(){ document.getElementById('liveLikes').innerText = +document.getElementById('liveLikes').innerText + 1; }
function focusLiveComment(){ document.getElementById('liveCommentIn').focus(); }
function sendLiveComment(){
  const txt = document.getElementById('liveCommentIn').value;
  document.getElementById('liveComments').innerHTML += `<div class="bg-black/50 p-1 rounded text-[10px]">${currentUser}: ${txt}</div>`;
  document.getElementById('liveCommentIn').value='';
}
function sendGift(){ showToast('تم ارسال هدية 🎁'); }
function shareLive(){ navigator.share? navigator.share({title:'TARIM OS', url:location.href}) : showToast('تم نسخ رابط البث'); }
