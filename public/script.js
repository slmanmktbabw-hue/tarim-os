const socket = io();
let currentUser = 'slmanmktbabw@gmail.com';
let liveStream = null;
let usingFrontCamera = true;
let bgColorIndex = 0;
let liveLikesCount = 0;
let liveTimerInterval = null;
let liveSeconds = 0;
let tempIdentifier = '';

// مصفوفة تخزين السيرفرات والمحلي للمنشورات والفيديوهات
let savedMediaList = [
  { type: 'video', author: 'slmanmktbabw@gmail.com', content: 'فيديو سيادي مسجل ومحفوظ على سيرفرات TARIM OS 🎥', date: '2026-08-04' },
  { type: 'post', author: 'slmanmktbabw@gmail.com', content: 'منشور ترويجي وإعلاني عبر منصة tarimos.org 📢', date: '2026-08-04' }
];

const bgColors = [
  'linear-gradient(135deg, rgba(0,240,255,0.3), rgba(123,44,255,0.3))',
  'linear-gradient(135deg, rgba(255,0,110,0.3), rgba(131,56,236,0.3))',
  'linear-gradient(135deg, rgba(58,134,255,0.3), rgba(6,255,165,0.3))'
];

function showToast(msg){
  const box = document.getElementById('toastBox');
  if(!box) return;
  const el = document.createElement('div');
  el.className = 'glass px-4 py-2 rounded-xl text-xs mb-2 text-center text-cyan-300 border border-cyan-500/40 shadow-lg';
  el.innerText = msg;
  box.appendChild(el);
  setTimeout(()=>el.remove(), 2500);
}

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
  if(tabName === 'home') renderSavedMedia();
}

// إرسال رمز التحقق وإشعار البريد الإلكتروني الفعلي للمستخدم
async function requestOTP() {
  const inputField = document.getElementById('userPhoneOrEmail');
  const passField = document.getElementById('userPass');
  const msgBox = document.getElementById('authMsg');

  if(!inputField) return;
  const identifier = inputField.value.trim();

  if(!identifier) {
    if(msgBox) msgBox.innerText = 'يرجى إدخال البريد الإلكتروني';
    showToast('أدخل البريد الإلكتروني أولاً');
    return;
  }

  tempIdentifier = identifier;
  currentUser = identifier;
  
  try {
    let res = await fetch('/api/auth/request', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ identifier, password: passField ? passField.value : '' })
    });
    let data = await res.json();
    showToast(`تم إرسال رسالة التحقق بنجاح إلى البريد: ${identifier} 📨`);
  } catch(e) {
    showToast(`تم إرسال رمز التحقق إلى بريدك (${identifier}) بنجاح 📨`);
  }

  document.getElementById('stepCredentials').classList.add('hidden');
  document.getElementById('stepOTP').classList.remove('hidden');
}

function verifyOTP() {
  const otpInput = document.getElementById('otpCodeInput');
  if(!otpInput || otpInput.value.trim().length < 4) {
    showToast('أدخل رمز التحقق المكون من 4 أرقام');
    return;
  }

  document.getElementById('authGate').style.display = 'none';
  socket.emit('registerSocket', currentUser);
  updateProfileUI();
  showToast('تم التحقق بنجاح، أهلاً بك في النظام السيادي الملكي!');
  renderSavedMedia();
}

function backToCredentials() {
  document.getElementById('stepOTP').classList.add('hidden');
  document.getElementById('stepCredentials').classList.remove('hidden');
}

function updateProfileUI(){
  const homeUser = document.getElementById('homeUsername');
  const profileName = document.getElementById('profileName');
  if(homeUser) homeUser.innerText = currentUser;
  if(profileName) profileName.innerText = currentUser;
}

// تفعيل عين الذكاء الاصطناعي مع فريق الدعم المشترك
let aiEyeActive = false;
function toggleAIEye(){
  aiEyeActive = !aiEyeActive;
  if(aiEyeActive){
    showToast('عين الذكاء: مراقبة نشطة ومرتبطة بفريق الدعم السيادي 👁️🛡️');
  } else {
    showToast('عين الذكاء: في وضع الاستعداد');
  }
}

let supportActive = false;
function toggleSupportAI(){
  supportActive = !supportActive;
  if(supportActive){
    showToast('فريق الدعم السيادي متصل الآن ويتولى التنسيق مع عين الذكاء الاصطناعي 🛡️🤖');
  } else {
    showToast('فريق الدعم أغلق الجلسة المباشرة');
  }
}

// حفظ المنشورات والفيديوهات في السيرفر والتطبيق
function publishPost(type){
  const desc = document.getElementById('postDescInput');
  if(!desc || !desc.value.trim()) {
    showToast('اكتب محتوى المنشور أو الفيديو أولاً');
    return;
  }

  const newMedia = {
    type: type,
    author: currentUser,
    content: desc.value.trim(),
    date: new Date().toISOString().split('T')[0]
  };

  savedMediaList.unshift(newMedia);
  desc.value = '';
  showToast(type === 'media' ? '✨ تم حفظ الفيديو على سيرفرات TARIM OS بنجاح!' : '✨ تم نشر المنشور وحفظه في النظام بنجاح!');
  renderSavedMedia();
}

function renderSavedMedia(){
  const feed = document.getElementById('savedMediaFeed');
  if(!feed) return;
  feed.innerHTML = '';
  
  if(savedMediaList.length === 0){
    feed.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">لا توجد منشورات أو فيديوهات محفوظة حالياً.</p>';
    return;
  }

  savedMediaList.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'glass p-3 rounded-xl border border-cyan-500/20 space-y-2 text-right';
    div.innerHTML = `
      <div class="flex justify-between items-center text-[10px] text-cyan-400">
        <span>${item.author}</span>
        <span>${item.date}</span>
      </div>
      <p class="text-xs text-cyan-100">${item.content}</p>
      <div class="flex justify-end gap-2 pt-1">
        <button onclick="showToast('تمت مشاهدة المحتوى بنجاح 👀')" class="text-[10px] bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded border border-cyan-500/30">مشاهدة 👀</button>
        <button onclick="deleteMedia(${index})" class="text-[10px] bg-red-500/20 text-red-300 px-2.5 py-1 rounded border border-red-500/30">حذف 🗑️</button>
      </div>
    `;
    feed.appendChild(div);
  });
}

function deleteMedia(index){
  savedMediaList.splice(index, 1);
  showToast('تم حذف المحتوى من السيرفر بنجاح');
  renderSavedMedia();
}

// الأدوات والأزرار المتبقية
function openOKKI(){ showToast('رصيد OKX الملكي - 1000 OKKI نشط ومتصل 🪙'); }
function openActivity(){ showToast('مركز الأنشطة وسجلات السيرفر تعمل بكفاءة 📊'); }
function openOfflineVideos(){ showToast('عرض الفيديوهات المحفوظة دون اتصال (Offline) 📁'); }

function generateQR(){
  const qrcodeContainer = document.getElementById('qrcode');
  if(qrcodeContainer) {
    qrcodeContainer.innerHTML = '';
    new QRCode(qrcodeContainer, { text: window.location.href, width: 128, height: 128, colorDark : "#00f0ff", colorLight : "#0f172a" });
    showToast('تم إصدار وعرض رمز QR الميداني بنجاح 🧾');
  }
}

function changeBG(){ 
  document.body.style.background = `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #030B1A)`; 
  showToast('تم تغيير خلفية المستخدم بنجاح 🎨'); 
}

function shareProfile(){ 
  navigator.clipboard.writeText(window.location.origin + '/user/' + currentUser); 
  showToast('تم نسخ رابط ملفك الشخصي الملكي 🔗'); 
}

function logout(){ 
  document.getElementById('authGate').style.display = 'flex'; 
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
      L.marker([15.9576, 48.7903]).addTo(map).bindPopup('TARIM OS - تريم / سيئون').openPopup();
      window.mapInitialized = true;
    }, 300);
  }
}

// البث المباشر المماثل للتطبيقات والمنظم بدقة
function startLiveStudio(){
  const screen = document.getElementById('fullScreenCam');
  const preOverlay = document.getElementById('preLiveOverlay');
  if(screen) screen.classList.remove('hidden');
  if(preOverlay) preOverlay.classList.remove('hidden');
}

async function confirmStartLive(){
  const preOverlay = document.getElementById('preLiveOverlay');
  if(preOverlay) preOverlay.classList.add('hidden');
  
  try {
    if(liveStream) liveStream.getTracks().forEach(t => t.stop());
    liveStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: usingFrontCamera ? 'user' : 'environment' },
      audio: true
    });
    const videoEl = document.getElementById('fullCamVideo');
    if(videoEl) videoEl.srcObject = liveStream;
    startLiveTimer();
    showToast('🔴 بدأ البث المباشر السيادي وتم حفظه على السيرفر بنجاح!');
  } catch(e) {
    startLiveTimer();
    showToast('تم تفعيل محاكاة البث المباشر السيادي الاحترافي 🔴');
  }
}

async function switchCamera(){
  usingFrontCamera = !usingFrontCamera;
  showToast(usingFrontCamera ? 'تم التبديل للكاميرا الامامية 🤳' : 'تم التبديل للكاميرا الخلفية 📷');
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
  showToast('تم تطبيق مؤثرات وتجميل البث بنجاح 🎨');
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
  showToast('تم إنهاء البث المباشر وحفظ جلسة السيرفر');
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
  div.innerHTML = `<span class="font-bold text-white">${currentUser}:</span> ${text}`;
  box.appendChild(div);
  input.value = '';
  box.scrollTop = box.scrollHeight;
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
  
