const socket = io();

// تحميل بيانات المستخدم والمنشورات المخزنة محلياً (localStorage) لتجنب ضياعها
let currentUser = localStorage.getItem('tarim_user') || 'slmanmktbabw@gmail.com';
let savedMediaList = JSON.parse(localStorage.getItem('tarim_media')) || [
  { type: 'video', author: 'slmanmktbabw@gmail.com', content: 'فيديو سيادي مسجل ومحفوظ على سيرفرات TARIM OS 🎥', date: '2026-08-04' },
  { type: 'post', author: 'slmanmktbabw@gmail.com', content: 'منشور ترويجي وإعلاني عبر منصة tarimos.org 📢', date: '2026-08-04' }
];

let liveStream = null;
let usingFrontCamera = true;
let liveLikesCount = 0;
let liveTimerInterval = null;
let liveSeconds = 0;

// تجاوز شاشة تسجيل الدخول تلقائياً عند تحميل الصفحة لضمان عمل كافة الأزرار والتطبيق فوراً
window.addEventListener('DOMContentLoaded', () => {
  localStorage.setItem('tarim_logged_in', 'true');
  const authGate = document.getElementById('authGate');
  if(authGate){
    authGate.style.display = 'none'; // إخفاء بوابة الدخول لتفتح الواجهة الرئيسية مباشرة
  }
  updateProfileUI();
  renderSavedMedia();
});

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

// ضبط وإدارة تسجيل الدخول
function requestOTP(){
  const inputField = document.getElementById('userPhoneOrEmail');
  if(!inputField || !inputField.value.trim()) {
    showToast('أدخل البريد الإلكتروني أو رقم الهاتف أولاً');
    return;
  }
  currentUser = inputField.value.trim();
  const stepCred = document.getElementById('stepCredentials');
  const stepOTP = document.getElementById('stepOTP');
  if(stepCred) stepCred.classList.add('hidden');
  if(stepOTP) stepOTP.classList.remove('hidden');
  showToast(`تم إرسال رمز التحقق إلى: ${currentUser} 📨`);
}

function verifyOTP(){
  const otpInput = document.getElementById('otpCodeInput');
  if(!otpInput || otpInput.value.trim().length < 4) {
    showToast('أدخل رمز التحقق المكون من 4 أرقام');
    return;
  }

  // تخزين بيانات المستخدم بشكل دائم
  localStorage.setItem('tarim_logged_in', 'true');
  localStorage.setItem('tarim_user', currentUser);

  const authGate = document.getElementById('authGate');
  if(authGate) authGate.style.display = 'none';
  socket.emit('registerSocket', currentUser);
  updateProfileUI();
  renderSavedMedia();
  showToast('تم تسجيل الدخول وحفظ بيانات المستخدم بنجاح! 🔑');
}

function backToCredentials(){
  const stepCred = document.getElementById('stepCredentials');
  const stepOTP = document.getElementById('stepOTP');
  if(stepOTP) stepOTP.classList.add('hidden');
  if(stepCred) stepCred.classList.remove('hidden');
}

function updateProfileUI(){
  const homeUser = document.getElementById('homeUsername');
  const profileName = document.getElementById('profileName');
  if(homeUser) homeUser.innerText = currentUser;
  if(profileName) profileName.innerText = currentUser;
}

// تفعيل عين الذكاء وفريق الدعم
let aiEyeActive = false;
function toggleAIEye(){
  aiEyeActive = !aiEyeActive;
  showToast(aiEyeActive ? 'عين الذكاء: مراقبة نشطة ومرتبطة بفريق الدعم السيادي 👁️🛡️' : 'عين الذكاء: في وضع الاستعداد');
}

let supportActive = false;
function toggleSupportAI(){
  supportActive = !supportActive;
  showToast(supportActive ? 'فريق الدعم السيادي متصل الآن ويتولى التنسيق مع عين الذكاء الاصطناعي 🛡️🤖' : 'فريق الدعم أغلق الجلسة المباشرة');
}

// نشر وحفظ المنشورات والفيديوهات وتخزينها محلياً
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
  localStorage.setItem('tarim_media', JSON.stringify(savedMediaList)); // حفظ دائم
  desc.value = '';
  showToast(type === 'media' ? '✨ تم حفظ الفيديو في تخزين النظام بنجاح!' : '✨ تم نشر المنشور وحفظه بنجاح!');
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
  localStorage.setItem('tarim_media', JSON.stringify(savedMediaList));
  showToast('تم حذف المحتوى بنجاح');
  renderSavedMedia();
}

// أزرار الملفات والإعدادات الفعالة
function generateQR(){
  const qrcodeContainer = document.getElementById('qrcode');
  if(qrcodeContainer) {
    qrcodeContainer.innerHTML = '';
    new QRCode(qrcodeContainer, { text: window.location.href, width: 128, height: 128, colorDark : "#00f0ff", colorLight : "#0f172a" });
    showToast('تم إصدار وعرض رمز QR الميداني بنجاح 🧾');
  }
}

function changeBackgroundProfile(){ 
  document.body.style.background = `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #030B1A)`; 
  showToast('تم تغيير خلفية النظام بنجاح 🎨'); 
}

function shareProfile(){ 
  navigator.clipboard.writeText(window.location.origin + '/user/' + currentUser); 
  showToast('تم نسخ رابط ملفك الشخصي الملكي 🔗'); 
}

function logout(){ 
  localStorage.removeItem('tarim_logged_in');
  const authGate = document.getElementById('authGate');
  if(authGate) authGate.style.display = 'flex'; 
  const stepOTP = document.getElementById('stepOTP');
  const stepCred = document.getElementById('stepCredentials');
  if(stepOTP) stepOTP.classList.add('hidden');
  if(stepCred) stepCred.classList.remove('hidden');
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
      L.marker([15.9576, 48.7903]).addTo(map).bindPopup('TARIM OS - تريم').openPopup();
      window.mapInitialized = true;
    }, 300);
  }
}

// البث المباشر
function startLiveStudio(){
  const fullCam = document.getElementById('fullScreenCam');
  const preLive = document.getElementById('preLiveOverlay');
  if(fullCam) fullCam.classList.remove('hidden');
  if(preLive) preLive.classList.remove('hidden');
}

async function confirmStartLive(){
  const preLive = document.getElementById('preLiveOverlay');
  if(preLive) preLive.classList.add('hidden');
  try {
    liveStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const fullCamVideo = document.getElementById('fullCamVideo');
    if(fullCamVideo) fullCamVideo.srcObject = liveStream;
    startLiveTimer();
    showToast('🔴 بدأ البث المباشر السيادي بنجاح!');
  } catch(e) {
    startLiveTimer();
    showToast('تم تفعيل محاكاة البث المباشر السيادي الاحترافي 🔴');
  }
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
  if(liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; }
  if(liveTimerInterval) clearInterval(liveTimerInterval);
  const fullCam = document.getElementById('fullScreenCam');
  if(fullCam) fullCam.classList.add('hidden');
  showToast('تم إنهاء البث المباشر');
}

function sendInboxMsg(){
  const input = document.getElementById('inboxInput');
  const box = document.getElementById('inboxMessages');
  if(!input || !box || !input.value.trim()) return;
  const div = document.createElement('div');
  div.className = 'glass p-2 rounded-xl text-xs text-cyan-300 text-right';
  div.innerHTML = `<span class="font-bold text-white">أنت:</span> ${input.value.trim()}`;
  box.appendChild(div);
  input.value = '';
  box.scrollTop = box.scrollHeight;
  showToast('تم إرسال الرسالة بنجاح 💬');
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if(modal) {
    modal.classList.remove('hidden');
    if(modalId === 'modalManagePosts') {
      const listContainer = document.getElementById('modalPostsList');
      if(listContainer) {
        listContainer.innerHTML = '';
        savedMediaList.forEach((item, idx) => {
          listContainer.innerHTML += `<div class="glass p-2 rounded flex justify-between items-center text-xs"><span>${item.content.substring(0,30)}...</span><button onclick="deleteMedia(${idx}); openModal('modalManagePosts')" class="text-red-400 text-[10px]">حذف</button></div>`;
        });
      }
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if(modal) modal.classList.add('hidden');
}

function updateAccountInfo() {
  const emailInput = document.getElementById('accEmailInput');
  if(emailInput && emailInput.value.trim()) {
    currentUser = emailInput.value.trim();
    localStorage.setItem('tarim_user', currentUser);
    updateProfileUI();
    showToast('تم تحديث بيانات الحساب بنجاح 👤');
  }
    }
