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
  if(!box) return;
  const el = document.createElement('div');
  el.className = 'glass px-4 py-2 rounded-xl text-xs mb-2 text-center text-cyan-300 border border-cyan-500/40 shadow-lg';
  el.innerText = msg;
  box.appendChild(el);
  setTimeout(()=>el.remove(), 2000);
}

// تسجيل الدخول + انشاء حساب عبر API
async function registerAndLogin(){
  const username = document.getElementById('userPhone').value.trim();
  const password = document.getElementById('userPass').value.trim();
  if(!username || !password) return showToast('ادخل الاسم وكلمة السر');

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
    socket.emit('registerSocket', currentUser);
    showToast('مرحبا ' + currentUser);
  } else {
    showToast(data.message);
  }
}

function updateProfileUI(user){
  const avatarEl = document.getElementById('profileAvatar');
  const nameEl = document.getElementById('profileName');
  const statsHeaderEl = document.getElementById('profileStatsHeader');
  const followersEl = document.getElementById('statFollowers');
  const likesEl = document.getElementById('statLikes');
  const postsEl = document.getElementById('statPosts');
  const okkiBtn = document.getElementById('okkiBtn');
  const homeUser = document.getElementById('homeUsername');

  if(avatarEl) avatarEl.innerText = user.username.slice(0,2).toUpperCase();
  if(nameEl) nameEl.innerText = user.username;
  if(homeUser) homeUser.innerText = user.username;
  if(statsHeaderEl) statsHeaderEl.innerText = `OKKI: ${user.okki_balance} - الملكي: ${user.okki_balance}`;
  if(followersEl) followersEl.innerText = user.followers;
  if(likesEl) likesEl.innerText = user.likes;
  if(postsEl) postsEl.innerText = user.posts;
  if(okkiBtn) okkiBtn.innerText = user.okki_balance;
}

// دوال مركز التحكم والأدوات
function openOKKI(){ showToast(`رصيدك: ${document.getElementById('okkiBtn') ? document.getElementById('okkiBtn').innerText : 0} OKKI`); }
function openActivity(){ showToast('سجل الانشطة: نشط'); }
function openOfflineVideos(){ showToast('فيديوهات دون اتصال: متوفرة محلياً'); }
function generateQR(){
  fetch('/api/qr', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({phone: currentUser}) })
  .then(res => res.json())
  .then(data => {
    const qrcodeContainer = document.getElementById('qrcode');
    if(qrcodeContainer) {
      qrcodeContainer.innerHTML = '';
      new QRCode(qrcodeContainer, { text: data.qr, width: 128, height: 128, colorDark : "#00f0ff", colorLight : "#0f172a" });
      showToast('تم انشاء QR بنجاح');
    }
  });
}
function openBusiness(){ showToast('المجموعة التجارية: نشطة'); }
function openAds(){ showToast('الاعلانات السيادية: مفعّلة'); }
function openPosts(){ showToast('ادارة المنشورات: تعمل'); }
function openAccount(){ showToast('اعدادات الحساب متصلة'); }
function openPrivacy(){ showToast('الخصوصية والامان: محمي'); }
function changeBG(){ 
  document.body.style.background = `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #050b14)`; 
  showToast('تم تغيير الخلفية بنجاح'); 
}
function shareProfile(){ 
  navigator.clipboard.writeText(window.location.origin + '/user/' + currentUser); 
  showToast('تم نسخ رابط ملفك الشخصي'); 
}
function openPolicy(){ showToast('سياسة الخصوصية لـ TARIM OS'); }
function logout(){ 
  localStorage.removeItem('tarim_user'); 
  currentUser = null;
  document.getElementById('authGate').style.display='flex'; 
  showToast('تم تسجيل الخروج'); 
}

function openMap(){
  const mapBox = document.getElementById('mapContainer');
  if(!mapBox) return;
  mapBox.classList.toggle('hidden');
  if(!window.mapInitialized && !mapBox.classList.contains('hidden')){
    setTimeout(() => {
      const map = L.map('map').setView([15.9576, 48.7903], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([15.9576, 48.7903]).addTo(map).bindPopup('TARIM OS - سيئون/تريم').openPopup();
      window.mapInitialized = true;
    }, 300);
  }
}

// تبديل الكاميرا
async function switchCamera(){
  usingFrontCamera = !usingFrontCamera;
  showToast(usingFrontCamera ? 'الكاميرا الامامية 🤳' : 'الكاميرا الخلفية 📷');
  if(liveStream){ await confirmStartLive(); }
}

// تغيير خلفية البث
function changeBackground(){
  bgColorIndex = (bgColorIndex + 1) % bgColors.length;
  const filterEl = document.getElementById('liveFilter');
  if(filterEl) {
    filterEl.style.background = bgColors[bgColorIndex];
    filterEl.classList.remove('opacity-0');
  }
  showToast('تم تغيير خلفية البث');
}

// بدء البث
function startLive(){
  showToast('جاري تشغيل الكاميرا...');
  document.getElementById('fullScreenCam').classList.remove('hidden');
}

async function confirmStartLive(){
  const preLive = document.getElementById('preLiveOverlay');
  if(preLive) preLive.classList.add('hidden');
  try {
    if(liveStream){ liveStream.getTracks().forEach(track => track.stop()); }
    liveStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: usingFrontCamera ? "user" : "environment" },
      audio: true
    });
    const video = document.getElementById('fullCamVideo');
    if(video) {
      video.srcObject = liveStream;
      video.play();
    }
    socket.emit('startLive');
    showToast('البث بدأ على الهواء 🔴');
  } catch(err) {
    showToast('فشل تشغيل الكاميرا: ' + err.message);
    exitFullScreen();
  }
}

function exitFullScreen(){
  if(liveStream){ liveStream.getTracks().forEach(track => track.stop()); liveStream = null; }
  socket.emit('stopLive');
  document.getElementById('fullScreenCam').classList.add('hidden');
  const preLive = document.getElementById('preLiveOverlay');
  if(preLive) preLive.classList.remove('hidden');
  const comments = document.getElementById('liveComments');
  const likes = document.getElementById('liveLikes');
  const timer = document.getElementById('liveTimer');
  if(comments) comments.innerHTML = '';
  if(likes) likes.innerText = '0';
  if(timer) timer.innerText = '00:00';
}

function likeLive(){ 
  if(currentRoomId) socket.emit('liveLike', currentRoomId); 
  let el = document.getElementById('liveLikes'); 
  if(el) el.innerText = parseInt(el.innerText || '0') + 1; 
}
function sendGift(){ 
  if(currentRoomId) socket.emit('sendGift', currentRoomId); 
  showToast('تم ارسال هدية 🎁'); 
}
function applyFilter(){ 
  const filterEl = document.getElementById('liveFilter');
  if(filterEl) filterEl.classList.toggle('opacity-0'); 
  showToast('تم تطبيق الفلتر'); 
}
function shareLive(){ 
  navigator.clipboard.writeText(window.location.href + '?live=' + currentRoomId); 
  showToast('تم نسخ رابط البث'); 
}
function sendLiveComment(){ 
  const input = document.getElementById('liveCommentIn'); 
  if(input && input.value.trim() && currentRoomId){ 
    socket.emit('liveComment', {roomId: currentRoomId, text: input.value}); 
    input.value = ''; 
  } 
}

// استقبال الاحداث من السيرفر
socket.on('liveStarted', ({roomId}) => { currentRoomId = roomId; });
socket.on('liveTimer', (time) => { 
  const timerEl = document.getElementById('liveTimer');
  if(timerEl) timerEl.innerText = time; 
});
socket.on('viewersUpdate', (count) => { 
  const viewersEl = document.getElementById('liveViewers');
  if(viewersEl) viewersEl.innerText = count; 
});
socket.on('newLike', ({from}) => { showToast(from + ' اعجب بالبث ❤️'); });
socket.on('newComment', ({from, text}) => { 
  const commentsContainer = document.getElementById('liveComments');
  if(commentsContainer) {
    const div = document.createElement('div'); 
    div.className = 'glass px-2 py-1 rounded text-[10px] text-white'; 
    div.innerText = from + ': ' + text; 
    commentsContainer.appendChild(div); 
    commentsContainer.scrollTop = commentsContainer.scrollHeight; 
  }
});
socket.on('newGift', ({from}) => { showToast(from + ' ارسل هدية 🎁'); });
socket.on('liveEnded', () => { showToast('انتهى البث'); exitFullScreen(); });

function openTab(tab, e){
  document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
  const targetTab = document.getElementById('tab-' + tab);
  if(targetTab) targetTab.classList.remove('hidden');
  
  document.querySelectorAll('nav button').forEach(b => { 
    b.classList.remove('text-cyan-400'); 
    b.classList.add('text-gray-400'); 
  });
  if(e && e.currentTarget) {
    e.currentTarget.classList.remove('text-gray-400'); 
    e.currentTarget.classList.add('text-cyan-400');
  }
}

// التحقق من الحساب المحفوظ عند التحميل
document.addEventListener('DOMContentLoaded', ()=>{
  openTab('home');
  const savedUser = localStorage.getItem('tarim_user');
  if(savedUser) {
    const phoneInput = document.getElementById('userPhone');
    if(phoneInput) phoneInput.value = savedUser;
  }
});
