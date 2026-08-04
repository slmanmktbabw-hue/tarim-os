const socket = io();

// تحميل بيانات المستخدم والمنشورات
let currentUser = localStorage.getItem('tarim_user') || 'slmanmktbabw@gmail.com';
let savedMediaList = JSON.parse(localStorage.getItem('tarim_media')) || [];

let liveStream = null;
let liveTimerInterval = null;
let liveSeconds = 0;

// فتح التطبيق مباشرة
window.addEventListener('DOMContentLoaded', () => {
  localStorage.setItem('tarim_logged_in', 'true');
  const authGate = document.getElementById('authGate');
  if(authGate) authGate.style.display = 'none';
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
  document.getElementById('tab-' + tabName).classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('text-cyan-400'), btn.classList.add('text-gray-400'));
  event.currentTarget.classList.add('text-cyan-400');
  if(tabName === 'home') renderSavedMedia();
}

function requestOTP(){ showToast('تم ارسال OTP وهمي: 1234') }
function verifyOTP(){
  localStorage.setItem('tarim_logged_in', 'true');
  document.getElementById('authGate').style.display = 'none';
  updateProfileUI();
  showToast('تم الدخول بنجاح 🔑');
}
function backToCredentials(){}

function updateProfileUI(){
  document.getElementById('homeUsername').innerText = currentUser;
  document.getElementById('profileName').innerText = currentUser;
}

function toggleAIEye(){ showToast('عين الذكاء: مراقبة نشطة 👁️🛡️') }
function toggleSupportAI(){ showToast('فريق الدعم متصل 🛡️🤖') }

function publishPost(type){
  const desc = document.getElementById('postDescInput');
  if(!desc.value.trim()) return showToast('اكتب محتوى اولاً');
  savedMediaList.unshift({ type, author: currentUser, content: desc.value, date: new Date().toISOString().split('T')[0] });
  localStorage.setItem('tarim_media', JSON.stringify(savedMediaList));
  desc.value = '';
  showToast('تم الحفظ بنجاح');
  renderSavedMedia();
}

function renderSavedMedia(){
  const feed = document.getElementById('savedMediaFeed');
  feed.innerHTML = '';
  if(savedMediaList.length === 0) return feed.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">لا توجد منشورات</p>';
  savedMediaList.forEach((item, index) => {
    feed.innerHTML += `
      <div class="glass p-3 rounded-xl border border-cyan-500/20 space-y-2 text-right">
        <div class="flex justify-between text-[10px] text-cyan-400"><span>${item.author}</span><span>${item.date}</span></div>
        <p class="text-xs text-cyan-100">${item.content}</p>
        <button onclick="deleteMedia(${index})" class="text-[10px] bg-red-500/20 text-red-300 px-2.5 py-1 rounded">حذف 🗑️</button>
      </div>`;
  });
}

function deleteMedia(index){
  savedMediaList.splice(index, 1);
  localStorage.setItem('tarim_media', JSON.stringify(savedMediaList));
  renderSavedMedia();
}

function generateQR(){ new QRCode(document.getElementById("qrcode"), window.location.href); showToast('تم انشاء QR 🧾') }
function changeBackgroundProfile(){ document.body.style.background = '#050b14'; showToast('تم تغيير الخلفية 🎨') }
function shareProfile(){ navigator.clipboard.writeText(window.location.href); showToast('تم نسخ الرابط 🔗') }
function logout(){ localStorage.removeItem('tarim_logged_in'); location.reload(); }

function openMap(){
  document.getElementById('mapContainer').classList.toggle('hidden');
  if(!window.mapInitialized){
    L.map('map').setView([15.9576, 48.7903], 13).addLayer(L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'));
    window.mapInitialized = true;
  }
}

// البث
function startLiveStudio(){ document.getElementById('fullScreenCam').classList.remove('hidden'); }
async function confirmStartLive(){
  document.getElementById('preLiveOverlay').classList.add('hidden');
  try {
    liveStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('fullCamVideo').srcObject = liveStream;
    liveSeconds = 0; clearInterval(liveTimerInterval);
    liveTimerInterval = setInterval(() => { liveSeconds++; document.getElementById('liveTimer').innerText = `${Math.floor(liveSeconds/60).toString().padStart(2,'0')}:${(liveSeconds%60).toString().padStart(2,'0')}` }, 1000);
    showToast('🔴 بدأ البث');
  } catch(e){ showToast('محاكاة بث 🔴') }
}
function exitFullScreen(){ if(liveStream) liveStream.getTracks().forEach(t => t.stop()); clearInterval(liveTimerInterval); document.getElementById('fullScreenCam').classList.add('hidden'); }

function sendInboxMsg(){
  const input = document.getElementById('inboxInput');
  const box = document.getElementById('inboxMessages');
  if(!input.value.trim()) return;
  box.innerHTML += `<div class="glass p-2 rounded-xl text-xs text-cyan-300 text-right"><span class="font-bold text-white">أنت:</span> ${input.value}</div>`;
  input.value = '';
}

function openModal(id){ document.getElementById(id).classList.remove('hidden'); }
function closeModal(id){ document.getElementById(id).classList.add('hidden'); }
function updateAccountInfo(){ currentUser = document.getElementById('accEmailInput').value; localStorage.setItem('tarim_user', currentUser); updateProfileUI(); showToast('تم التحديث 👤') }
function switchCamera(){ showToast('تم تبديل الكاميرا') }
function changeBackgroundLive(){ showToast('تم تغيير خلفية البث') }
function sendLiveComment(){ showToast('تم ارسال التعليق') }
