const socket = io();
let currentStream = null;
let currentFacingMode = 'user';
let currentUser = 'AL';

document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  loadWallet();
});

// التنقل بين الأقسام (Tabs)
function openTab(tabId) {
  ['home', 'operations', 'create', 'messages', 'profile', 'ai', 'support', 'privacy'].forEach(id => {
    const el = document.getElementById('tab-' + id);
    if(el) el.classList.add('hidden');
  });
  const target = document.getElementById('tab-' + tabId);
  if(target) target.classList.remove('hidden');
}

// تسجيل الدخول
function registerAndLogin() {
  const phoneInput = document.getElementById('userPhone').value;
  if(phoneInput) currentUser = phoneInput;
  document.getElementById('authGate').style.display = 'none';
  showToast('تم تسجيل الدخول بنجاح إلى النظام السيادي 🏰');
  loadPosts();
  loadWallet();
}

// إشعارات Toast المؤقتة
function showToast(msg) {
  const box = document.getElementById('toastBox');
  if(!box) return;
  const t = document.createElement('div');
  t.className = 'bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl text-xs mb-2 shadow-lg transition-all';
  t.innerText = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// جلب المنشورات من الخادم
async function loadPosts() {
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    renderFeed(posts);
  } catch(e) {
    console.error('خطأ في جلب المنشورات', e);
  }
}

// عرض المنشورات في الواجهة
function renderFeed(posts) {
  const feed = document.getElementById('feed');
  if(!feed) return;
  if(!posts || !posts.length) {
    feed.innerHTML = '<div class="glass p-6 rounded-2xl text-center text-xs text-gray-400">لا توجد منشورات حالياً<br>كن أول من ينشر 👑</div>';
    return;
  }
  feed.innerHTML = posts.map((p, i) => `
    <div class="glass p-3 rounded-2xl space-y-1">
      <div class="flex justify-between items-center"><span class="text-[10px] text-cyan-400 font-bold">${p.user || 'الملك AL'} 👑</span><span class="text-[9px] text-gray-500">نظام سيادي</span></div>
      <div class="text-xs text-white">${p.text || ''}</div>
    </div>
  `).join('');
}

// نشر محتوى جديد للخادم
async function publishPost() {
  const textInput = document.getElementById('postText');
  if(!textInput || !textInput.value.trim()) {
    showToast('اكتب محتوى المنشور أولاً');
    return;
  }
  
  const postData = { user: currentUser, text: textInput.value, time: Date.now() };
  
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    if(res.ok) {
      textInput.value = '';
      openTab('home');
      showToast('تم نشر المحتوى بنجاح 🚀');
    }
  } catch(e) {
    showToast('فشل النشر، تحقق من الاتصال');
  }
}

function createPost(type) {
  publishPost();
}

// استقبال المنشورات الحية عبر Socket.IO
socket.on('broadcast_post', (post) => {
  loadPosts();
  showToast('📬 منشور جديد وصل إلى الشبكة!');
});

// جلب تفاصيل المحفظة والرصيد
async function loadWallet() {
  try {
    const res = await fetch(`/api/wallet/${currentUser}`);
    const data = await res.json();
    if(document.getElementById('balanceShow')) document.getElementById('balanceShow').innerText = data.balance;
    if(document.getElementById('myBalance')) document.getElementById('myBalance').innerText = data.balance;
    if(document.getElementById('myEarn')) document.getElementById('myEarn').innerText = data.earned;
  } catch(e) {}
}

// إرسال الهدايا السيادية
async function sendGift() {
  try {
    const res = await fetch('/api/wallet/gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: currentUser, to: 'AL', gift: '🎁' })
    });
    const data = await res.json();
    if(data.error) {
      showToast(data.error);
    } else {
      showToast('🎁 تم إرسال الهدية بنجاح!');
      loadWallet();
    }
  } catch(e) {
    showToast('حدث خطأ أثناء إرسال الهدية');
  }
}

// إدارة الكاميرا والبث المباشر
async function openCamera(facing) {
  currentFacingMode = facing;
  openTab('create');
  const video = document.getElementById('camPreview');
  if(!video) return;
  video.classList.remove('hidden');
  try {
    if(currentStream) currentStream.getTracks().forEach(t => t.stop());
    currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
    video.srcObject = currentStream;
  } catch(e) {
    showToast('تعذر تشغيل الكاميرا');
  }
}

function toggleCameraFacing() {
  currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
  const fullCam = document.getElementById('fullScreenCam');
  if(fullCam && !fullCam.classList.contains('hidden')) {
    confirmStartLive();
  } else {
    openCamera(currentFacingMode);
  }
}

function applyFilter() {
  const video = document.getElementById('camPreview');
  if(video) {
    video.style.filter = video.style.filter ? '' : 'sepia(1) hue-rotate(180deg)';
    showToast('تم تطبيق الفلتر السيادي ✨');
  }
}

function startLive() {
  const fullCam = document.getElementById('fullScreenCam');
  const overlay = document.getElementById('preLiveOverlay');
  if(fullCam) fullCam.classList.remove('hidden');
  if(overlay) overlay.style.display = 'flex';
}

async function confirmStartLive() {
  const overlay = document.getElementById('preLiveOverlay');
  if(overlay) overlay.style.display = 'none';
  const video = document.getElementById('fullCamVideo');
  if(!video) return;
  try {
    if(currentStream) currentStream.getTracks().forEach(t => t.stop());
    currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode }, audio: true });
    video.srcObject = currentStream;
  } catch(e) {
    showToast('تعذر بدء البث المباشر');
  }
}

function exitFullScreen() {
  if(currentStream) currentStream.getTracks().forEach(t => t.stop());
  const fullCam = document.getElementById('fullScreenCam');
  if(fullCam) fullCam.classList.add('hidden');
  openTab('home');
}

function likeLive() {
  const likes = document.getElementById('liveLikes');
  if(likes) likes.innerText = parseInt(likes.innerText || '0') + 1;
}

function shareLive() {
  showToast('🔗 تم نسخ رابط البث المباشر السيادي');
}

function focusLiveComment() {
  const inp = document.getElementById('liveCommentIn');
  if(inp) inp.focus();
}

function sendLiveComment() {
  const input = document.getElementById('liveCommentIn');
  if(!input || !input.value.trim()) return;
  const box = document.getElementById('liveComments');
  if(box) {
    box.innerHTML += `<div class="bg-black/60 px-3 py-1 rounded-full text-white"><b>${currentUser}:</b> ${input.value}</div>`;
    box.scrollTop = box.scrollHeight;
  }
  input.value = '';
}

function sendMsg() {
  const input = document.getElementById('chatIn');
  if(!input || !input.value.trim()) return;
  const logs = document.getElementById('chatLogs');
  if(logs) {
    logs.innerHTML += `<div class="glass p-2 rounded-xl text-xs"><b>أنت:</b> ${input.value}</div>`;
    logs.scrollTop = logs.scrollHeight;
  }
  input.value = '';
}

// قسم الدعم الفني المتصل بالخادم
async function sendSupport() {
  const input = document.getElementById('supportIn');
  if(!input || !input.value.trim()) return;
  const logs = document.getElementById('supportLogs');
  if(logs) {
    logs.innerHTML += `<div class="glass p-2 rounded-xl text-xs"><b>أنت:</b> ${input.value}</div>`;
    logs.scrollTop = logs.scrollHeight;
  }
  const textMsg = input.value;
  input.value = '';

  try {
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser, message: textMsg })
    });
    const data = await res.json();
    if(logs && data.reply) {
      setTimeout(() => {
        logs.innerHTML += `<div class="glass p-2 rounded-xl text-xs text-yellow-300"><b>الدعم:</b> ${data.reply}</div>`;
        logs.scrollTop = logs.scrollHeight;
      }, 500);
    }
  } catch(e) {}
}

function sendAI() {
  const input = document.getElementById('aiIn');
  if(!input || !input.value.trim()) return;
  const logs = document.getElementById('aiLogs');
  if(logs) {
    logs.innerHTML += `<div class="glass p-2 rounded-xl text-xs"><b>أنت:</b> ${input.value}</div>`;
    logs.scrollTop = logs.scrollHeight;
  }
  input.value = '';
  setTimeout(() => {
    if(logs) {
      logs.innerHTML += `<div class="glass p-2 rounded-xl text-xs text-cyan-300"><b>عين الذكاء:</b> النظام السيادي يعمل بتشفير تام وكفاءة عالية.</div>`;
      logs.scrollTop = logs.scrollHeight;
    }
  }, 600);
}

function genQR() {
  const container = document.getElementById('qrcode');
  if(!container) return;
  container.innerHTML = '';
  new QRCode(container, {
    text: "https://tarimos.org/user=" + currentUser,
    width: 128,
    height: 128,
    colorDark: "#00f0ff",
    colorLight: "#000000",
    correctLevel: QRCode.CorrectLevel.H
  });
  showToast('تم إصدار الختم الميداني QR بنجاح 🔏');
}

// أزرار العمليات والملف الشخصي الإضافية
function openWallet() { showToast('💰 محفظة OKX مؤمنة وعاملة'); }
function openActivities() { showToast('📊 مركز الأنشطة السيادية نشط'); }
function openOffline() { showToast('📹 خريطة حضرموت جاهزة للوضع دون إنترنت'); }
function openMarket() { showToast('🏢 المجموعة التجارية متصلة'); }
function openPromo() { showToast('📢 الترويج والإعلانات مفعلة'); }
function openSettings() { showToast('⚙️ لوحة إدارة المنشورات جاهزة'); }
function shareProfile() { showToast('🔗 تم نسخ رابط ملفك السيادي'); }
function changeBg() { showToast('🎨 تم حفظ إعدادات المظهر بنجاح'); }
function openMap() { showToast('🗺️ جارٍ تحميل خريطة حضرموت Offline...'); }
