// TARIM OS V17 - اوفلاين 100% بدون socket
let currentUser = localStorage.getItem('tarim_user') || null;
let liveStream = null;
let cameraFacing = 'environment';
let videoData = [];
let uploadFile = null;
let uploadType = null;

function showToast(msg){
  const box = document.getElementById('toastBox');
  if(!box) return;
  const el = document.createElement('div');
  el.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold mb-2';
  el.innerText = msg;
  box.appendChild(el);
  setTimeout(()=>el.remove(),3000);
}

function loadUserData(){
  if(currentUser){
    const name = localStorage.getItem('tarim_name') || currentUser;
    const avatar = localStorage.getItem('tarim_avatar');
    const bg = localStorage.getItem('tarim_bg') || '#050b14';

    document.getElementById('profileName') && (document.getElementById('profileName').innerText = name);
    document.getElementById('profileAvatar') && (document.getElementById('profileAvatar').innerText = name.charAt(0));
    document.getElementById('editAvatar') && (document.getElementById('editAvatar').innerText = name.charAt(0));
    document.body.style.background = bg;

    if(avatar && document.getElementById('profileAvatar')){
      document.getElementById('profileAvatar').style.backgroundImage = `url(${avatar})`;
      document.getElementById('profileAvatar').innerText = '';
      document.getElementById('profileAvatar').style.backgroundSize = 'cover';
    }
    if(avatar && document.getElementById('editAvatar')){
      document.getElementById('editAvatar').style.backgroundImage = `url(${avatar})`;
      document.getElementById('editAvatar').innerText = '';
      document.getElementById('editAvatar').style.backgroundSize = 'cover';
    }
  }
}

// بوابة الدخول
function registerAndLogin(){
  const phone = document.getElementById('userPhone').value || 'AL';
  const pass = document.getElementById('userPass').value;
  if(!pass){ showToast('دخل كلمة السر'); return; }

  const savedPass = localStorage.getItem('tarim_pass_'+phone);
  if(savedPass && savedPass!== pass){ showToast('كلمة السر خطأ'); return; }

  currentUser = phone;
  localStorage.setItem('tarim_user', phone);
  if(!savedPass) localStorage.setItem('tarim_pass_'+phone, pass);

  document.getElementById('authGate').classList.add('hidden');
  loadUserData();
  openTab('home', {target: document.querySelectorAll('nav button')[0]});
  showToast('مرحبا بك ' + phone);
}

// التنقل
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
  if(name==='profile'){ genQR(); backToProfile(); }
  if(name==='inbox') document.getElementById('inboxBadge')?.classList.add('hidden');
  if(name==='create'){
    uploadFile = null; uploadType = null;
    const vid = document.getElementById('camPreview');
    if(vid && vid.tagName === 'IMG') vid.outerHTML = `<video id="camPreview" autoplay muted playsinline class="w-full rounded-2xl bg-black aspect-[9/16] hidden"></video>`;
    else vid?.classList.add('hidden');
  }
}

// الفيد
function loadVideoFeed(){
  const feed = document.getElementById('videoFeed');
  if(!feed) return;
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

// البث
async function startLive(){
  document.getElementById('fullScreenCam')?.classList.remove('hidden');
  document.getElementById('preLiveOverlay') && (document.getElementById('preLiveOverlay').style.display='flex');
  try{
    liveStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraFacing, width: {ideal: 720}, height: {ideal: 1280} },
      audio: true
    });
    const videoEl = document.getElementById('fullCamVideo');
    if(videoEl){ videoEl.srcObject = liveStream; videoEl.play(); }
  }catch(e){
    showToast('فشل تشغيل الكاميرا');
    exitFullScreen();
  }
}

function confirmStartLive(){
  document.getElementById('preLiveOverlay') && (document.getElementById('preLiveOverlay').style.display='none');
  showToast('🔴 تم بدء البث السيادي 8 دقائق');
}
function exitFullScreen(){
  document.getElementById('fullScreenCam')?.classList.add('hidden');
  if(liveStream){
    liveStream.getTracks().forEach(track => track.stop());
    liveStream = null;
  }
}
function openMap(){ showToast('خريطة حضرموت Offline'); }
function genQR(){
  const qr = document.getElementById('qrcode');
  if(!qr ||!currentUser) return;
  qr.innerHTML='';
  new QRCode(qr, {text: "tarimos.org/"+currentUser, width:128, height:128});
}

// الانشاء
async function openCamera(facing){
  cameraFacing = facing;
  if(liveStream) liveStream.getTracks().forEach(t=>t.stop());
  liveStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:facing}});
  const vid = document.getElementById('camPreview');
  if(vid){ vid.srcObject = liveStream; vid.classList.remove('hidden'); }
}
async function toggleCameraFacing(){
  cameraFacing = cameraFacing === 'user'? 'environment' : 'user';
  if(document.getElementById('fullScreenCam')?.classList.contains('hidden')){
    openCamera(cameraFacing);
  } else {
    startLive();
  }
}
function createPost(type){
  const input = document.getElementById('postText');
  if(input) input.placeholder = 'اكتب ' + type + '...';
}

function handleUpload(input, type){
  const file = input.files[0];
  if(!file) return;
  uploadFile = file; uploadType = type;
  showToast('تم رفع: ' + file.name);

  if(type === 'video'){
    const url = URL.createObjectURL(file);
    const vid = document.getElementById('camPreview');
    if(vid){ vid.src = url; vid.classList.remove('hidden'); vid.controls = true; }
  }
  if(type === 'image'){
    const url = URL.createObjectURL(file);
    document.getElementById('camPreview').outerHTML = `<img id="camPreview" src="${url}" class="w-full rounded-2xl bg-black aspect-[9/16]">`;
  }
}

function publishPost(){
  const txt = document.getElementById('postText').value;
  if(uploadFile){
    videoData.unshift({user:currentUser, text:txt + ` [${uploadType}]`, likes:0});
    showToast('تم نشر ' + uploadType);
    uploadFile = null; uploadType = null;
  } else if(txt) {
    videoData.unshift({user:currentUser, text:txt, likes:0});
    showToast('تم النشر');
  } else {
    showToast('اكتب نص او ارفع ملف'); return;
  }
  document.getElementById('postText').value='';
  document.getElementById('camPreview')?.classList.add('hidden');
}

// الوارد
function sendMsg(){
  const txt = document.getElementById('chatIn').value;
  if(!txt) return;
  document.getElementById('chatLogs').innerHTML += `<div class="text-right bg-cyan-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('chatIn').value='';
}

// الملفات والاعدادات
function showSettingsPanel(id){
  document.getElementById('profile-main')?.classList.add('hidden');
  document.querySelectorAll('#tab-profile > div[id^="settings-"]').forEach(el=>el.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
  if(id === 'settings-edit-profile'){
    document.getElementById('editUsername').value = localStorage.getItem('tarim_name') || currentUser;
  }
}
function backToProfile(){
  document.getElementById('profile-main')?.classList.remove('hidden');
  document.querySelectorAll('#tab-profile > div[id^="settings-"]').forEach(el=>el.classList.add('hidden'));
}

function openWallet(){ showSettingsPanel('settings-wallet'); }
function openActivities(){ showSettingsPanel('settings-activities'); }
function openBgSettings(){ showSettingsPanel('settings-bg'); }
function openAccountSettings(){ showSettingsPanel('settings-account'); }
function openPrivacySettings(){ showSettingsPanel('settings-privacy'); }
function openEditProfile(){ showSettingsPanel('settings-edit-profile'); }

function changeBg(color){
  document.body.style.background = color;
  localStorage.setItem('tarim_bg', color);
  document.getElementById('toastProfile')?.classList.remove('hidden');
  setTimeout(()=>document.getElementById('toastProfile')?.classList.add('hidden'), 2000);
}

function changeAvatar(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const avatar = e.target.result;
    localStorage.setItem('tarim_avatar', avatar);
    showToast('تم تغير الصورة');
    loadUserData();
  }
  reader.readAsDataURL(file);
}

function saveProfile(){
  const newName = document.getElementById('editUsername').value;
  const newPass = document.getElementById('editPassword').value;
  if(newName){
    localStorage.setItem('tarim_name', newName);
    document.getElementById('profileName').innerText = newName;
  }
  if(newPass){
    localStorage.setItem('tarim_pass_'+currentUser, newPass);
  }
  showToast('تم حفظ التعديلات');
  backToProfile();
}

function logout(){
  localStorage.removeItem('tarim_user');
  location.reload();
}

// الذكاء والدعم
function loadAI(){ document.getElementById('aiLogs').innerHTML = '<div class="text-xs">مرحبا انا عين الذكاء. اسألني</div>' }
function sendAI(){
  const txt = document.getElementById('aiIn').value;
  if(!txt) return;
  document.getElementById('aiLogs').innerHTML += `<div class="text-right bg-cyan-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('aiIn').value='';
}

function loadSupport(){ document.getElementById('supportLogs').innerHTML = '<div class="text-xs text-yellow-400">فريق الدعم جاهز</div>' }
function sendSupport(){
  const txt = document.getElementById('supportIn').value;
  if(!txt) return;
  document.getElementById('supportLogs').innerHTML += `<div class="text-right bg-yellow-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('supportIn').value='';
}

// تحميل تلقائي
window.onload = () => {
  if(currentUser){
    document.getElementById('authGate')?.classList.add('hidden');
    loadUserData();
    openTab('home', {target: document.querySelectorAll('nav button')[0]});
  }
    }
