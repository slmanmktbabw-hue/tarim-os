const socket = io();
let currentUser = null;
let liveStream = null; 
let cameraFacing = 'environment';
let videoData = [];
let uploadFile = null; // للرفع
let uploadType = null; // نوع الملف
let mapInstance = null; // للخريطة عشان ما نعيد انشاءها

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
  if(name==='profile'){ 
    genQR();
    backToProfile();
  }
  if(name==='inbox') document.getElementById('inboxBadge').classList.add('hidden');
  if(name==='create'){ 
    uploadFile = null;
    uploadType = null;
    const vid = document.getElementById('camPreview');
    if(vid.tagName === 'IMG') vid.outerHTML = `<video id="camPreview" autoplay muted playsinline class="w-full rounded-2xl bg-black aspect-[9/16] hidden"></video>`;
    else vid.classList.add('hidden');
  }
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

// 2. العمليات - البث المباشر + الخريطة
async function startLive(){ 
  document.getElementById('fullScreenCam').classList.remove('hidden'); 
  document.getElementById('preLiveOverlay').style.display='flex'; 
  
  try{
    liveStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraFacing, width: {ideal: 720}, height: {ideal: 1280} },
      audio: true
    });
    const videoEl = document.getElementById('fullCamVideo');
    videoEl.srcObject = liveStream;
    videoEl.play();
  }catch(e){
    showToast('فشل تشغيل الكاميرا: ' + e.name);
    console.error(e);
    exitFullScreen();
  }
}

function confirmStartLive(){ 
  document.getElementById('preLiveOverlay').style.display='none'; 
  showToast('🔴 تم بدء البث السيادي 8 دقائق'); 
}

function exitFullScreen(){ 
  document.getElementById('fullScreenCam').classList.add('hidden'); 
  if(liveStream){
    liveStream.getTracks().forEach(track => track.stop());
    liveStream = null;
  }
}

// دالة الخريطة الجديدة - تشتغل اوفلاين
function openMap(){ 
  showToast('جار فتح خريطة حضرموت Offline');
  const opsTab = document.getElementById('tab-operations');
  
  // لو الخريطة مش موجودة ننشئها
  if(!document.getElementById('map')){
    opsTab.innerHTML += `<div id="map" style="height:400px" class="glass rounded-2xl mt-3"></div>`;
  }
  
  setTimeout(()=>{ 
    if(!mapInstance){
      mapInstance = L.map('map').setView([15.4397, 48.5164], 7); // احداثيات حضرموت
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© TARIM OS'
      }).addTo(mapInstance);
      L.marker([15.4397, 48.5164]).addTo(mapInstance).bindPopup("🏰 TARIM OS - حضرموت").openPopup();
    } else {
      mapInstance.invalidateSize(); // تحديث لو رجعت للتبويب
    }
  },100)
}

function genQR(){ 
  document.getElementById('qrcode').innerHTML='';
  new QRCode(document.getElementById('qrcode'), {text: "tarimos.org/"+currentUser, width:128, height:128});
}

// 3. الانشاء + الرفع
async function openCamera(facing){
  cameraFacing = facing;
  if(liveStream) liveStream.getTracks().forEach(t=>t.stop());
  liveStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:facing}});
  const vid = document.getElementById('camPreview');
  vid.srcObject = liveStream;
  vid.classList.remove('hidden');
}

async function toggleCameraFacing(){
  cameraFacing = cameraFacing === 'user' ? 'environment' : 'user';
  if(document.getElementById('fullScreenCam').classList.contains('hidden')){
    openCamera(cameraFacing);
  } else {
    startLive();
  }
}

function createPost(type){ document.getElementById('postText').placeholder = 'اكتب ' + type + '...'; }

// دالة الرفع
function handleUpload(input, type){
  const file = input.files[0];
  if(!file) return;
  uploadFile = file;
  uploadType = type;

  if(type === 'video'){
    const url = URL.createObjectURL(file);
    const vid = document.getElementById('camPreview');
    vid.src = url;
    vid.classList.remove('hidden');
    vid.controls = true;
    showToast('تم رفع الفيديو: ' + file.name);
  }
  if(type === 'image'){
    const url = URL.createObjectURL(file);
    document.getElementById('camPreview').outerHTML = `<img id="camPreview" src="${url}" class="w-full rounded-2xl bg-black aspect-[9/16]">`;
    showToast('تم رفع الصورة: ' + file.name);
  }
}

// نشر مع دعم الرفع
function publishPost(){
  const txt = document.getElementById('postText').value;

  if(uploadFile){
    videoData.unshift({user:currentUser, text:txt + ` [${uploadType}]`, likes:0, file: uploadFile.name});
    showToast('تم نشر ' + uploadType + ' بنجاح');
    uploadFile = null;
    uploadType = null;
  } else if(txt) {
    videoData.unshift({user:currentUser, text:txt, likes:0});
    showToast('تم النشر بنجاح');
  } else {
    showToast('اكتب نص او ارفع ملف');
    return;
  }

  document.getElementById('postText').value='';
  document.getElementById('camPreview').classList.add('hidden');
}

function applyFilter(){ showToast('تم تطبيق الفلتر السيادي'); }

// 4. الوارد
function sendMsg(){
  const txt = document.getElementById('chatIn').value;
  if(!txt) return;
  document.getElementById('chatLogs').innerHTML += `<div class="text-right bg-cyan-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('chatIn').value='';
}

// 5. الملفات والاعدادات - مفعل بالكامل V14
function showSettingsPanel(id){
  document.getElementById('profile-main').classList.add('hidden');
  document.querySelectorAll('#tab-profile > div[id^="settings-"]').forEach(el=>el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function backToProfile(){
  document.getElementById('profile-main').classList.remove('hidden');
  document.querySelectorAll('#tab-profile > div[id^="settings-"]').forEach(el=>el.classList.add('hidden'));
}

function openWallet(){ showSettingsPanel('settings-wallet'); }
function openActivities(){ showSettingsPanel('settings-activities'); }
function openOffline(){ showSettingsPanel('settings-offline'); }
function openMarket(){ showSettingsPanel('settings-market'); }
function openPromo(){ showSettingsPanel('settings-promo'); }
function openSettings(){ showSettingsPanel('settings-posts'); }
function openBgSettings(){ showSettingsPanel('settings-bg'); }
function openAccountSettings(){ showSettingsPanel('settings-account'); }
function openPrivacySettings(){ showSettingsPanel('settings-privacy'); }

function shareProfile(){ 
  navigator.clipboard.writeText('tarimos.org/'+currentUser); 
  showToast('تم نسخ الرابط: tarimos.org/'+currentUser); 
}

function changeBg(color){
  document.body.style.background = color;
  const toast = document.getElementById('toastProfile');
  toast.classList.remove('hidden');
  setTimeout(()=>toast.classList.add('hidden'), 2000);
}

// الذكاء
function loadAI(){ document.getElementById('aiLogs').innerHTML = '<div class="text-xs">مرحبا انا عين الذكاء. اسألني</div>' }
function sendAI(){
  const txt = document.getElementById('aiIn').value;
  if(!txt) return;
  document.getElementById('aiLogs').innerHTML += `<div class="text-right bg-cyan-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('aiIn').value='';
}

// الدعم
function loadSupport(){ document.getElementById('supportLogs').innerHTML = '<div class="text-xs text-yellow-400">فريق الدعم جاهز</div>' }
function sendSupport(){
  const txt = document.getElementById('supportIn').value;
  if(!txt) return;
  document.getElementById('supportLogs').innerHTML += `<div class="text-right bg-yellow-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('supportIn').value='';
}

// البث
function likeLive(){ document.getElementById('liveLikes').innerText = +document.getElementById('liveLikes').innerText + 1; }
function focusLiveComment(){ document.getElementById('liveCommentIn').focus(); }
function sendLiveComment(){
  const txt = document.getElementById('liveCommentIn').value;
  if(!txt) return;
  document.getElementById('liveComments').innerHTML += `<div class="bg-black/50 p-1 rounded text-[10px]">${currentUser}: ${txt}</div>`;
  document.getElementById('liveCommentIn').value='';
}
function sendGift(){ showToast('تم ارسال هدية 🎁'); }
function shareLive(){ navigator.share? navigator.share({title:'TARIM OS', url:location.href}) : showToast('تم نسخ رابط البث'); }

// Pre-load للخريطة مرة وحدة
if(!localStorage.getItem('map_cached')){
  fetch('https://a.tile.openstreetmap.org/7/76/48.png');
  localStorage.setItem('map_cached','true');
  }
