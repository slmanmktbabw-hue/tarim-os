const socket = io();
let currentRoomId = null;
let currentUser = null;
let liveStream = null;
let usingFrontCamera = true;
let bgColorIndex = 0;
const bgColors = [
  'linear-gradient(135deg, #00f0ff, #7b2cff)',
  'linear-gradient(135deg, #ff006e, #8338ec)',
  'linear-gradient(135deg, #3a86ff, #06ffa5)',
  'linear-gradient(135deg, #ffbe0b, #fb5607)'
];

function showToast(msg){
  const box = document.getElementById('toastBox');
  const el = document.createElement('div');
  el.className = 'glass px-4 py-2 rounded-xl text-xs mb-2 text-center';
  el.innerText = msg;
  box.appendChild(el);
  setTimeout(()=>el.remove(), 2000);
}

// تسجيل الدخول + انشاء حساب عبر API
async function registerAndLogin(){
  const username = document.getElementById('userPhone').value;
  const password = document.getElementById('userPass').value;
  if(!username ||!password) return showToast('ادخل الاسم وكلمة السر');

  // نجرب تسجيل دخول
  let res = await fetch('/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  });
  let data = await res.json();

  // لو ما لقى الحساب نسجله
  if(!data.success){
    res = await fetch('/api/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password})
    });
    data = await res.json();
  }

  if(data.success){
    currentUser = data.user.username;
    localStorage.setItem('tarim_user', currentUser);
    document.getElementById('authGate').style.display = 'none';
    updateProfileUI(data.user);
    socket.emit('registerSocket', currentUser); // ربط السوكت
    showToast('مرحبا ' + currentUser);
  } else {
    showToast(data.message);
  }
}

function updateProfileUI(user){
  document.getElementById('profileAvatar').innerText = user.username.slice(0,2).toUpperCase();
  document.querySelector('#tab-profile.font-bold').innerText = `الامبراطور ${user.username}`;
  document.querySelector('#tab-profile.text-gray-400').innerText = `OKKI: ${user.okki_balance} - الملكي: ${user.okki_balance}`;
  document.querySelectorAll('#tab-profile.grid-cols-3.glass')[0].innerHTML = `${user.followers}<br>المتابعين`;
  document.querySelectorAll('#tab-profile.grid-cols-3.glass')[1].innerHTML = `${user.likes}<br>الاعجابات`;
  document.querySelectorAll('#tab-profile.grid-cols-3.glass')[2].innerHTML = `${user.posts}<br>المنشورات`;
  if(document.getElementById('okkiBtn')) document.getElementById('okkiBtn').innerText = user.okki_balance;
}

// دوال مركز التحكم
function openOKKI(){ showToast(`رصيدك: ${document.getElementById('okkiBtn').innerText} OKKI`); }
function openActivity(){ showToast('سجل الانشطة: تسجيل دخول اليوم'); }
function openOfflineVideos(){ showToast('فيديوهات دون اتصال: 0'); }
function generateQR(){
  fetch('/api/qr', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({phone: currentUser}) })
.then(res => res.json())
.then(data => {
    document.getElementById('qrcode').innerHTML = '';
    new QRCode(document.getElementById('qrcode'), { text: data.qr, width: 128, height: 128, colorDark : "#00f0ff", colorLight : "#0f172a" });
    showToast('تم انشاء QR');
  });
}
function openBusiness(){ showToast('المجموعة التجارية: قريباً'); }
function openAds(){ showToast('الاعلانات: قريباً'); }
function openPosts(){ showToast('ادارة المنشورات: قريباً'); }
function openAccount(){ showToast('اعدادات الحساب'); }
function openPrivacy(){ showToast('الخصوصية والامان'); }
function changeBG(){ document.body.style.background = `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #050b14)`; showToast('تم تغيير الخلفية'); }
function shareProfile(){ navigator.clipboard.writeText(window.location.origin + '/user/' + currentUser); showToast('تم نسخ رابط ملفك'); }
function openPolicy(){ showToast('سياسة الخصوصية'); }
function logout(){ localStorage.removeItem('tarim_user'); document.getElementById('authGate').style.display='flex'; showToast('تم تسجيل الخروج'); }

function openMap(){
  document.getElementById('mapContainer').classList.toggle('hidden');
  if(!window.mapInitialized){
    const map = L.map('map').setView([15.4694, 48.5164], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([15.4694, 48.5164]).addTo(map).bindPopup('TARIM OS - سيئون');
    window.mapInitialized = true;
  }
}

// تبديل الكاميرا
async function switchCamera(){
  usingFrontCamera =!usingFrontCamera;
  showToast(usingFrontCamera? 'الكاميرا الامامية 🤳' : 'الكاميرا الخلفية 📷');
  if(liveStream){ await confirmStartLive(); }
}

// تغيير خلفية البث
function changeBackground(){
  bgColorIndex = (bgColorIndex + 1) % bgColors.length;
  document.getElementById('liveFilter').style.background = bgColors[bgColorIndex];
  document.getElementById('liveFilter').classList.remove('opacity-0');
  showToast('تم تغيير الخلفية');
}

// بدء البث
function startLive(){
  showToast('جاري تشغيل الكاميرا...');
  document.getElementById('fullScreenCam').classList.remove('hidden');
}

async function confirmStartLive(){
  document.getElementById('preLiveOverlay').classList.add('hidden');
  try {
    if(liveStream){ liveStream.getTracks().forEach(track => track.stop()); }
    liveStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: usingFrontCamera? "user" : "environment" },
      audio: true
    });
    const video = document.getElementById('fullCamVideo');
    video.srcObject = liveStream;
    video.play();
    socket.emit('startLive');
    showToast('البث بدأ 🔴');
  } catch(err) {
    showToast('فشل تشغيل الكاميرا: ' + err.message);
    exitFullScreen();
  }
}

function exitFullScreen(){
  if(liveStream){ liveStream.getTracks().forEach(track => track.stop()); liveStream = null; }
  socket.emit('stopLive');
  document.getElementById('fullScreenCam').classList.add('hidden');
  document.getElementById('preLiveOverlay').classList.remove('hidden');
  document.getElementById('liveComments').innerHTML = '';
  document.getElementById('liveLikes').innerText = '0';
  document.getElementById('liveTimer').innerText = '00:00';
}

function likeLive(){ if(currentRoomId) socket.emit('liveLike', currentRoomId); let el = document.getElementById('liveLikes'); el.innerText = parseInt(el.innerText)+1; }
function sendGift(){ if(currentRoomId) socket.emit('sendGift', currentRoomId); showToast('تم ارسال هدية 🎁'); }
function applyFilter(){ document.getElementById('liveFilter').classList.toggle('opacity-0'); showToast('تم تطبيق الفلتر'); }
function shareLive(){ navigator.clipboard.writeText(window.location.href + '?live=' + currentRoomId); showToast('تم نسخ رابط البث'); }
function sendLiveComment(){ const input = document.getElementById('liveCommentIn'); if(input.value.trim() && currentRoomId){ socket.emit('liveComment', {roomId: currentRoomId, text: input.value}); input.value = ''; } }

// استقبال الاحداث من السيرفر
socket.on('liveStarted', ({roomId}) => { currentRoomId = roomId; });
socket.on('liveTimer', (time) => { document.getElementById('liveTimer').innerText = time; });
socket.on('viewersUpdate', (count) => { document.getElementById('liveViewers').innerText = count; });
socket.on('newLike', ({from}) => { showToast(from + ' اعجب بالبث ❤️'); });
socket.on('newComment', ({from, text}) => { const div = document.createElement('div'); div.className = 'glass px-2 py-1 rounded text-[10px]'; div.innerText = from + ': ' + text; document.getElementById('liveComments').appendChild(div); document.getElementById('liveComments').scrollTop = document.getElementById('liveComments').scrollHeight; });
socket.on('newGift', ({from}) => { showToast(from + ' ارسل هدية 🎁'); });
socket.on('liveEnded', () => { showToast('انتهى البث'); exitFullScreen(); });

function openTab(tab, e){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  document.getElementById('tab-'+tab).classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b=>{ b.classList.remove('text-cyan-400'); b.classList.add('text-gray-400'); });
  e.currentTarget.classList.remove('text-gray-400'); e.currentTarget.classList.add('text-cyan-400');
}

// تسجيل دخول تلقائي
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('tab-home').classList.remove('hidden');
  const savedUser = localStorage.getItem('tarim_user');
  if(savedUser) document.getElementById('userPhone').value = savedUser;
});
