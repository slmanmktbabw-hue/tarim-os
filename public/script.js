const socket = io();
let currentRoomId = null;
let currentUser = null;
let liveStream = null, liveTrack = null;
let usingFrontCamera = true;
let flash = false;
let warnings = 0;
let authMode = 'login';

// الوان خلفية البث
const bgColors = [
  'linear-gradient(135deg, #00f0ff, #7b2cff)',
  'linear-gradient(135deg, #ff006e, #8338ec)',
  'linear-gradient(135deg, #3a86ff, #06ffa5)',
  'linear-gradient(135deg, #ffbe0b, #fb5607)'
];
let bgColorIndex = 0;

// 1. الاشعارات
function showToast(msg){
  const box = document.getElementById('toastBox');
  if(!box) return alert(msg);
  const el = document.createElement('div');
  el.className = 'glass px-4 py-2 rounded-xl text-xs mb-2 text-center text-cyan-300 border-cyan-500/40 shadow-lg';
  el.innerText = msg;
  box.appendChild(el);
  setTimeout(()=>el.remove(), 2000);
}

// 2. شاشة الدخول
function switchTab(t) {
    document.querySelectorAll('.tab button').forEach(b => b.classList.remove('bg-cyan-500', 'text-black'));
    document.querySelectorAll('.tab button').forEach(b => b.classList.add('text-slate-400'));
    document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.add('bg-cyan-500', 'text-black');
    document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.remove('text-slate-400');
    authMode = t;
}

async function login() {
    const username = document.getElementById('userInput').value.trim();
    const password = document.getElementById('passInput').value.trim();
    if (!username ||!password) return showToast('ادخل الايميل وكلمة السر');

    let endpoint = authMode === 'login'? '/api/login' : '/api/register';

    try {
      let res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
      });
      let data = await res.json();

      if(data.success){
        currentUser = data.user.username;
        localStorage.setItem('tarim_user', currentUser);
        document.getElementById('login').classList.remove('active');
        document.getElementById('mainApp').classList.remove('hidden');
        updateProfileUI(data.user);
        socket.emit('registerSocket', currentUser);
        showToast('مرحباً بك يا ' + currentUser);
      } else {
        showToast(data.message);
      }
    } catch(e) { showToast('خطأ في الاتصال بالسيرفر'); }
}

function googleLogin() {
    currentUser = "Gooaz";
    localStorage.setItem('tarim_user', currentUser);
    document.getElementById('login').classList.remove('active');
    document.getElementById('mainApp').classList.remove('hidden');
    updateProfileUI({username: "Gooaz", okx_balance: 500, followers: 25, likes: 120, posts: 5});
    socket.emit('registerSocket', currentUser);
    showToast('تم تسجيل الدخول بحساب الملك Gooaz 👑');
}

// 3. التنقل بين الصفحات
function switchPage(id, el) {
    document.querySelectorAll('#mainApp.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('nav button').forEach(n => n.classList.remove('nav-active', 'text-cyan-400'));
    document.querySelectorAll('nav button').forEach(n => n.classList.add('text-gray-400'));
    if(el) {
      el.classList.add('nav-active', 'text-cyan-400');
      el.classList.remove('text-gray-400');
    }
}

// 4. تحديث واجهة الملف
function updateProfileUI(user){
  if(document.getElementById('profileAvatar')) document.getElementById('profileAvatar').innerText = user.username.slice(0,2).toUpperCase();
  if(document.getElementById('profileName')) document.getElementById('profileName').innerText = user.username;
  if(document.getElementById('homeUsername')) document.getElementById('homeUsername').innerText = user.username + '@';
  if(document.getElementById('statFollowers')) document.getElementById('statFollowers').innerText = user.followers || 0;
  if(document.getElementById('statLikes')) document.getElementById('statLikes').innerText = user.likes || 0;
  if(document.getElementById('statPosts')) document.getElementById('statPosts').innerText = user.posts || 0;
}

// 5. الملفات والادوات
function editProfile(){ showToast('تعديل الملف الشخصي') }
function checkWarnings(){ warnings++; document.getElementById('warn').innerText = warnings+'/3'; if(warnings >= 3) showToast('تم تعليق الحساب') }
function logout(){ localStorage.removeItem('tarim_user'); currentUser = null; document.getElementById('mainApp').classList.add('hidden'); document.getElementById('login').classList.add('active'); showToast('تم تسجيل الخروج') }
function openOKX(){ showToast('رصيد OKX الملكي') }
function openActivity(){ showToast('مركز الانشطة') }
function openOfflineVideos(){ showToast('فيديوهات دون اتصال') }
function openBusiness(){ showToast('المجموعة التجارية') }
function openAds(){ showToast('الترويج والاعلانات') }
function openPosts(){ showToast('ادارة المنشورات') }
function openAccount(){ showToast('اعدادات الحساب') }
function openPrivacy(){ showToast('الخصوصية والامان') }
function changeBG(){ document.body.style.background = `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #050b14)`; showToast('تم تغيير الخلفية') }
function shareProfile(){ navigator.clipboard.writeText(window.location.origin); showToast('تم نسخ الرابط') }
function openPolicy(){ showToast('السياسة والخصوصية') }

// 6. العمليات
function start8MinLive(){ switchPage('tab-create', document.querySelector('.nav-plus')); openLive() }
function secureChat(){ showToast('المراسلة الامنة قريباً') }
function offlineMap(){ openMap() }
function generateQR(){
  fetch('/api/qr', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({phone: currentUser || 'tarim_os'}) })
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
function openMap(){
  const mapBox = document.getElementById('mapContainer');
  if(!mapBox) return;
  mapBox.classList.toggle('hidden');
  if(!window.mapInitialized &&!mapBox.classList.contains('hidden')){
    setTimeout(() => {
      const map = L.map('map').setView([15.9576, 48.7903], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([15.9576, 48.7903]).addTo(map).bindPopup('TARIM OS - سيئون/تريم').openPopup();
      window.mapInitialized = true;
    }, 300);
  }
}

// 7. البث المباشر
async function openLive(){
  document.getElementById('liveScreen').classList.remove('hidden');
  try{
    liveStream = await navigator.mediaDevices.getUserMedia({video: {facingMode: usingFrontCamera? "user" : "environment"}, audio: true});
    document.getElementById('cam').srcObject = liveStream;
    liveTrack = liveStream.getVideoTracks()[0];
    socket.emit('startLive');
    showToast('البث بدأ 🔴');
  }catch(e){ showToast('اسمح بالكاميرا'); closeLive(); }
}

function closeLive(){
  document.getElementById('liveScreen').classList.add('hidden');
  if(liveStream) liveStream.getTracks().forEach(t => t.stop());
  socket.emit('stopLive');
}

async function toggleFlash(){
  flash =!flash;
  try{ await liveTrack.applyConstraints({advanced:[{torch:flash}]}) }catch(e){ showToast('الفلاش غير مدعوم') }
}

async function switchCamera(){
  usingFrontCamera =!usingFrontCamera;
  showToast(usingFrontCamera? 'الكاميرا الامامية 🤳' : 'الكاميرا الخلفية 📷');
  if(liveStream){ closeLive(); await openLive(); }
}

function changeBackground(){
  bgColorIndex = (bgColorIndex + 1) % bgColors.length;
  const filterEl = document.getElementById('liveFilter');
  if(filterEl) { filterEl.style.background = bgColors[bgColorIndex]; filterEl.classList.remove('opacity-0'); }
  showToast('تم تغيير خلفية البث');
}

function sendGift(){ if(currentRoomId) socket.emit('sendGift', currentRoomId); showToast('تم ارسال هدية 🎁'); }
function liveLike(){ if(currentRoomId) socket.emit('liveLike', currentRoomId); }

// 8. الوارد والمنشورات
function sendMsg(){
  let msg = document.getElementById('msgInput').value;
  if(msg){
    document.getElementById('chatBox').innerHTML += `<div class="glass p-2 rounded-lg mb-2 text-xs">${msg}</div>`;
    document.getElementById('msgInput').value = ''
  }
}

function publishPost(){
  const desc = document.getElementById('postText');
  if(!desc.value.trim()) return showToast('اكتب وصف المنشور اولاً');
  showToast('تم النشر الفوري 🚀');
  desc.value = '';
}

// 9. الرئيسية
function like(){ showToast('تم الاعجاب ❤️') }
function openAIEye(){ showToast('عين الذكاء: مراقبة نشطة') }
function openSupport(){ showToast('فريق الدعم السيادي متصل') }
function pickImage(){ showToast('رفع صورة') }
function pickVideo(){ showToast('رفع فيديو') }

// 10. استقبال الاحداث من السيرفر
socket.on('liveStarted', ({roomId}) => { currentRoomId = roomId; });
socket.on('viewersUpdate', (count) => { const el = document.getElementById('liveViewers'); if(el) el.innerText = count; });
socket.on('newLike', ({from}) => { showToast(from + ' اعجب بالبث ❤️'); });
socket.on('newComment', ({from, text}) => {
  const commentsContainer = document.getElementById('liveComments');
  if(commentsContainer) {
    const div = document.createElement('div');
    div.className = 'glass px-2 py-1 rounded text-[10px] text-white mb-1';
    div.innerText = from + ': ' + text;
    commentsContainer.appendChild(div);
  }
});
socket.on('newGift', ({from}) => { showToast(from + ' ارسل هدية 🎁'); });
socket.on('liveEnded', () => { showToast('انتهى البث'); closeLive(); });

// 11. تحميل الحساب المحفوظ
document.addEventListener('DOMContentLoaded', ()=>{
  switchPage('tab-home', document.querySelector('nav button'));
  const savedUser = localStorage.getItem('tarim_user');
  if(savedUser) {
    document.getElementById('userInput').value = savedUser;
  }
});
