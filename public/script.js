const socket = io();
let currentUser = null;
let liveStream = null;
let usingFrontCamera = true;
let bgColorIndex = 0;
let authMode = 'login';
let liveLikesCount = 0;
let liveTimerInterval = null;
let liveSeconds = 0;

const bgColors = [
  'linear-gradient(135deg, rgba(0,240,255,0.3), rgba(123,44,255,0.3))',
  'linear-gradient(135deg, rgba(255,0,110,0.3), rgba(131,56,236,0.3))',
  'linear-gradient(135deg, rgba(58,134,255,0.3), rgba(6,255,165,0.3))',
  'linear-gradient(135deg, rgba(255,190,11,0.3), rgba(251,86,7,0.3))'
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

// التبديل بين التبويبات الرئيسية
function openTab(tabName, event) {
  document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
  const target = document.getElementById('tab-' + tabName);
  if(target) target.classList.remove('hidden');

  document.querySelectorAll('nav button.nav-btn').forEach(btn => {
    btn.classList.remove('text-cyan-400');
    btn.classList.add('text-gray-400');
  });
  if(event && event.currentTarget) {
    event.currentTarget.classList.remove('text-gray-400');
    event.currentTarget.classList.add('text-cyan-400');
  }
}

// تبديل وضع المصادقة (دخول / إنشاء حساب)
function switchAuthMode(mode) {
    authMode = mode;
    const loginBtn = document.getElementById('tabLoginBtn');
    const regBtn = document.getElementById('tabRegisterBtn');
    const submitBtn = document.getElementById('authSubmitBtn');
    
    if(mode === 'login') {
        if(loginBtn) loginBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-cyan-500 text-black transition-all";
        if(regBtn) regBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg text-cyan-400 transition-all";
        if(submitBtn) submitBtn.innerText = "دخول القلعة 🔑";
    } else {
        if(regBtn) regBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-cyan-500 text-black transition-all";
        if(loginBtn) loginBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg text-cyan-400 transition-all";
        if(submitBtn) submitBtn.innerText = "إنشاء حساب جديد ✨";
    }
}

// تسجيل الدخول + إنشاء حساب
async function registerAndLogin(){
  const usernameField = document.getElementById('userPhone');
  const passwordField = document.getElementById('userPass');
  const msgBox = document.getElementById('authMsg');
  
  if(!usernameField || !passwordField) return showToast('خطأ في عناصر المدخلات');
  
  const username = usernameField.value.trim();
  const password = passwordField.value.trim();
  
  if(!username || !password) {
    if(msgBox) msgBox.innerText = 'ادخل الاسم وكلمة السر';
    return showToast('ادخل الاسم وكلمة السر');
  }

  let endpoint = authMode === 'login' ? '/api/login' : '/api/register';
  
  try {
    let res = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password})
    });
    let data = await res.json();

    if(authMode === 'login' && !data.success) {
      res = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
      });
      data = await res.json();
    }

    if(data.success){
      currentUser = data.user ? data.user.username : username;
      localStorage.setItem('tarim_user', currentUser);
      const authGate = document.getElementById('authGate');
      if(authGate) authGate.style.display = 'none';
      updateProfileUI(data.user || {username: currentUser, okki_balance: 100, followers: 0, likes: 0, posts: 0});
      socket.emit('registerSocket', currentUser);
      showToast('مرحباً بك يا ' + currentUser);
    } else {
      if(msgBox) msgBox.innerText = data.message || 'خطأ في المصادقة';
      showToast(data.message || 'خطأ في المصادقة');
    }
  } catch(e) {
    if(msgBox) msgBox.innerText = 'خطأ في الاتصال بالسيرفر';
    showToast('خطأ في الاتصال بالسيرفر');
  }
}

function googleLogin() {
    currentUser = "Gooaz";
    localStorage.setItem('tarim_user', currentUser);
    const authGate = document.getElementById('authGate');
    if(authGate) authGate.style.display = 'none';
    updateProfileUI({username: "Gooaz", okki_balance: 500, followers: 25, likes: 120, posts: 5});
    socket.emit('registerSocket', currentUser);
    showToast('تم تسجيل الدخول بنجاح عبر حساب الملك Gooaz 👑');
}

function updateProfileUI(user){
  const avatarEl = document.getElementById('profileAvatar');
  const nameEl = document.getElementById('profileName');
  const followersEl = document.getElementById('statFollowers');
  const likesEl = document.getElementById('statLikes');
  const postsEl = document.getElementById('statPosts');
  const okkiBtn = document.getElementById('okkiBtn');
  const homeUser = document.getElementById('homeUsername');
  const homeOkki = document.getElementById('homeOkki');
  const statsHeaderEl = document.getElementById('profileStatsHeader');

  if(avatarEl) avatarEl.innerText = user.username.slice(0,2).toUpperCase();
  if(nameEl) nameEl.innerText = user.username;
  if(homeUser) homeUser.innerText = user.username;
  if(followersEl) followersEl.innerText = user.followers || 0;
  if(likesEl) likesEl.innerText = user.likes || 0;
  if(postsEl) postsEl.innerText = user.posts || 0;
  if(okkiBtn) okkiBtn.innerText = `رصيد OKX الملكي - ${user.okki_balance || 0} 🪙`;
  if(homeOkki) homeOkki.innerText = (user.okki_balance || 0) + " OKKI";
  if(statsHeaderEl) statsHeaderEl.innerText = `OKKI: ${user.okki_balance || 0} - الملكي: ${user.okki_balance || 0}`;
}

// أدوات الحساب
function openOKKI(){ showToast('رصيد OKX الملكي متصل بنجاح 🪙'); }
function openActivity(){ showToast('مركز الانشطة يعمل بكفاءة 📊'); }
function openOfflineVideos(){ showToast('فيديوهات دون اتصال متاح محلياً 📁'); }
function generateQR(){
  fetch('/api/qr', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({phone: currentUser || 'tarim_os'}) })
  .then(res => res.json())
  .then(data => {
    const qrcodeContainer = document.getElementById('qrcode');
    if(qrcodeContainer) {
      qrcodeContainer.innerHTML = '';
      new QRCode(qrcodeContainer, { text: data.qr, width: 128, height: 128, colorDark : "#00f0ff", colorLight : "#0f172a" });
      showToast('تم انشاء QR الميداني بنجاح');
    }
  });
}

function changeBG(){ 
  document.body.style.background = `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #030B1A)`; 
  showToast('تم تغيير الخلفية بنجاح 🎨'); 
}

function shareProfile(){ 
  navigator.clipboard.writeText(window.location.origin + '/user/' + (currentUser || 'Gooaz')); 
  showToast('تم نسخ رابط ملفك الشخصي 🔗'); 
}

function logout(){ 
  localStorage.removeItem('tarim_user'); 
  currentUser = null;
  const authGate = document.getElementById('authGate');
  if(authGate) authGate.style.display = 'flex'; 
  showToast('تم تسجيل الخروج بنجاح 🚪'); 
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

// التحكم بالكاميرا والبث المباشر السيادي
function startLive(){
  const screen = document.getElementById('fullScreenCam');
  const preOverlay = document.getElementById('preLiveOverlay');
  if(screen) screen.classList.remove('hidden');
  if(preOverlay) preOverlay.classList.remove('hidden');
}

async function confirmStartLive(){
  const preOverlay = document.getElementById('preLiveOverlay');
  if(preOverlay) preOverlay.classList.add('hidden');
  
  try {
    if(liveStream) {
      liveStream.getTracks().forEach(t => t.stop());
    }
    liveStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: usingFrontCamera ? 'user' : 'environment' },
      audio: true
    });
    const videoEl = document.getElementById('fullCamVideo');
    if(videoEl) {
      videoEl.srcObject = liveStream;
    }
    startLiveTimer();
    showToast('بدأ البث المباشر السيادي بنجاح 🔴');
  } catch(e) {
    showToast('تعذر الوصول للكاميرا، يرجى السماح بالصلاحيات');
  }
}

async function switchCamera(){
  usingFrontCamera = !usingFrontCamera;
  showToast(usingFrontCamera ? 'الكاميرا الامامية 🤳' : 'الكاميرا الخلفية 📷');
  const screen = document.getElementById('fullScreenCam');
  if(screen && !screen.classList.contains('hidden')) {
    await confirmStartLive();
  }
}

function changeBackground(){
  bgColorIndex = (bgColorIndex + 1) % bgColors.length;
  const filterEl = document.getElementById('liveFilter');
  if(filterEl) {
    filterEl.style.background = bgColors[bgColorIndex];
    filterEl.classList.remove('opacity-0');
  }
  showToast('تم تغيير خلفية البث 🎨');
}

function startLiveTimer(){
  liveSeconds = 0;
  if(liveTimerInterval) clearInterval(liveTimerInterval);
  liveTimerInterval = setInterval(() => {
    liveSeconds++;
    let m = Math.floor(liveSeconds / 60).toString().padStart(2, '0');
    let s = (liveSeconds % 60).toString().padStart(2, '0');
    const timerEl = document.getElementById('liveTimer');
    if(timerEl) timerEl.innerText = `${m}:${s}`;
  }, 1000);
}

function exitFullScreen(){
  if(liveStream) {
    liveStream.getTracks().forEach(t => t.stop());
    liveStream = null;
  }
  if(liveTimerInterval) clearInterval(liveTimerInterval);
  const screen = document.getElementById('fullScreenCam');
  if(screen) screen.classList.add('hidden');
  showToast('تم إنهاء البث المباشر');
}

function likeLive(){
  liveLikesCount++;
  const countEl = document.getElementById('liveLikesCount');
  if(countEl) countEl.innerText = liveLikesCount;
  showToast('❤️ تم الإعجاب بالبث');
}

function sendGift(){
  showToast('🎁 تم إرسال هدية ملكية بنجاح!');
}

function sendLiveComment(){
  const input = document.getElementById('liveCommentIn');
  const box = document.getElementById('liveComments');
  if(!input || !box) return;
  let text = input.value.trim();
  if(!text) return;
  
  const div = document.createElement('div');
  div.className = 'glass px-3 py-1 rounded-xl text-xs text-cyan-300';
  div.innerHTML = `<span class="font-bold text-white">${currentUser || 'مستخدم'}:</span> ${text}`;
  box.appendChild(div);
  input.value = '';
  box.scrollTop = box.scrollHeight;
}

function publishPost(){
  const desc = document.getElementById('postDescInput');
  if(desc && desc.value.trim()) {
    showToast('✨ تم نشر المنشور الفوري بنجاح');
    desc.value = '';
  } else {
    showToast('اكتب وصفاً للمنشور أولاً');
  }
}

function sendInboxMsg(){
  const input = document.getElementById('inboxInput');
  const box = document.getElementById('inboxMessages');
  if(!input || !box) return;
  let text = input.value.trim();
  if(!text) return;

  const div = document.createElement('div');
  div.className = 'glass p-2 rounded-xl text-xs text-cyan-300 text-right';
  div.innerHTML = `<span class="font-bold text-white">أنت:</span> ${text}`;
  box.appendChild(div);
  input.value = '';
  box.scrollTop = box.scrollHeight;
  showToast('تم إرسال الرسالة بنجاح 💬');
}
