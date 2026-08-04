const socket = io();

let currentUser = localStorage.getItem('tarim_user') || 'الإمبراطور AL';
let savedMediaList = JSON.parse(localStorage.getItem('tarim_media')) || [];
let warningCount = parseInt(localStorage.getItem('tarim_warnings') || '0');

let liveStream = null;
let liveTimerInterval = null;
let liveSeconds = 0;
let usingFrontCamera = true;
let flashEnabled = false;

window.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('tarim_logged_in');
  if(isLoggedIn === 'true') {
    const authGate = document.getElementById('authGate');
    if(authGate) authGate.style.display = 'none';
  }
  updateProfileUI();
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

function switchAuthTab(tab){
  const loginBtn = document.getElementById('tabLoginBtn');
  const regBtn = document.getElementById('tabRegBtn');
  if(tab === 'login'){
    loginBtn.className = 'text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1';
    regBtn.className = 'text-xs text-slate-400 pb-1';
  } else {
    regBtn.className = 'text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1';
    loginBtn.className = 'text-xs text-slate-400 pb-1';
  }
}

function loginCastle(){
  const userField = document.getElementById('userPhoneOrEmail');
  if(userField && userField.value.trim()){
    currentUser = userField.value.trim();
  }
  localStorage.setItem('tarim_logged_in', 'true');
  localStorage.setItem('tarim_user', currentUser);
  const authGate = document.getElementById('authGate');
  if(authGate) authGate.style.display = 'none';
  updateProfileUI();
  showToast('تم دخول القلعة السيادية بنجاح 🏰✨');
}

function loginWithGoogle(){
  localStorage.setItem('tarim_logged_in', 'true');
  localStorage.setItem('tarim_user', 'الإمبراطور AL');
  const authGate = document.getElementById('authGate');
  if(authGate) authGate.style.display = 'none';
  updateProfileUI();
  showToast('تم الربط وتسجيل الدخول عبر جوجل بنجاح 🌐');
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
}

function updateProfileUI(){
  const homeUser = document.getElementById('homeUsername');
  const profileName = document.getElementById('profileName');
  if(homeUser) homeUser.innerText = '@' + currentUser;
  if(profileName) profileName.innerText = currentUser;
}

// عين الذكاء الاصطناعي
let aiEyeActive = false;
function toggleAIEye(){
  aiEyeActive = !aiEyeActive;
  showToast(aiEyeActive ? 'عين الذكاء: مراقبة الأمان والجمهور نشطة 👁️🛡️' : 'عين الذكاء: وضع الاستعداد');
}

// فريق الدعم الفني الذكي
let supportActive = false;
function toggleSupportAI(){
  supportActive = !supportActive;
  if(supportActive) {
    showToast('🛡️ فريق الدعم الفني متصل وجاهز للرد الفوري!');
    const box = document.getElementById('inboxMessages');
    if(box){
      const div = document.createElement('div');
      div.className = 'glass p-2 rounded-xl text-xs text-yellow-300 text-right';
      div.innerHTML = `<span class="font-bold text-white">فريق الدعم الفني:</span> أهلاً بك يا أبو سلمان، النظام السيادي يعمل بكامل كفاءته والأمان تام.`;
      box.appendChild(div);
    }
  } else {
    showToast('تم إغلاق جلسة الدعم المؤقتة');
  }
}

function likeVideo(btn){
  const countSpan = btn.querySelector('.like-count');
  if(countSpan){
    let val = parseInt(countSpan.innerText) + 1;
    countSpan.innerText = val;
    showToast('❤️ تم تسجيل الإعجاب');
  }
}

function publishPost(type){
  const desc = document.getElementById('postDescInput');
  if(!desc || !desc.value.trim()) {
    showToast('اكتب محتوى المنشور أولاً');
    return;
  }
  const newMedia = { type, author: currentUser, content: desc.value.trim(), date: new Date().toISOString().split('T')[0] };
  savedMediaList.unshift(newMedia);
  localStorage.setItem('tarim_media', JSON.stringify(savedMediaList));
  desc.value = '';
  showToast('✨ تم النشر والحفظ بنجاح!');
}

function generateQR(){
  const qrcodeContainer = document.getElementById('qrcode');
  if(qrcodeContainer) {
    qrcodeContainer.innerHTML = '';
    new QRCode(qrcodeContainer, { text: window.location.href, width: 128, height: 128, colorDark : "#00f0ff", colorLight : "#0f172a" });
    showToast('تم إصدار الختم الميداني QR 🧾');
  }
}

function changeBackgroundProfile(){ 
  document.body.style.background = `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #030B1A)`; 
  showToast('تم تغيير خلفية النظام بنجاح 🎨'); 
}

function shareProfile(){ 
  navigator.clipboard.writeText(window.location.origin + '/user/' + currentUser); 
  showToast('تم نسخ رابط التخصيص السيادي 🔗'); 
}

function logout(){ 
  localStorage.removeItem('tarim_logged_in');
  const authGate = document.getElementById('authGate');
  if(authGate) authGate.style.display = 'flex'; 
  showToast('تم تسجيل الخروج الآمن 🚪'); 
}

// نظام الإنذارات والحظر (3 تنبيهات)
function triggerWarning(){
  warningCount++;
  localStorage.setItem('tarim_warnings', warningCount);
  if(warningCount >= 3){
    alert('⚠️ تنبيه نهائي: تم تعليق حسابك مؤقتاً لمخالفة سياسة النظام السيادي (الإنذار الثالث)');
  } else {
    showToast(`⚠️ تحذير سيادي (${warningCount}/3). احذر مخالفة المعايير.`);
  }
}

function openMap(){
  const mapBox = document.getElementById('mapContainer');
  if(!mapBox) return;
  mapBox.classList.toggle('hidden');
  if(!window.mapInitialized && !mapBox.classList.contains('hidden')){
    setTimeout(() => {
      const map = L.map('map').setView([15.9576, 48.7903], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([15.9576, 48.7903]).addTo(map).bindPopup('TARIM OS - حضرموت تريم').openPopup();
      window.mapInitialized = true;
    }, 300);
  }
}

// استوديو البث المباشر الكامل
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
    liveStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: usingFrontCamera ? 'user' : 'environment' }, audio: true });
    const fullCamVideo = document.getElementById('fullCamVideo');
    if(fullCamVideo) fullCamVideo.srcObject = liveStream;
    startLiveTimer();
    showToast('🔴 بدأ البث المباشر السيادي بنجاح!');
  } catch(e) {
    startLiveTimer();
    showToast('🔴 بدأ البث المباشر (وضع المحاكاة نشط)');
  }
}

function switchCamera(){
  usingFrontCamera = !usingFrontCamera;
  if(liveStream){
    liveStream.getTracks().forEach(t => t.stop());
  }
  confirmStartLive();
  showToast('📷 تم تبديل الكاميرا');
}

// تشغيل وإطفاء فلاش الكاميرا الخلفية
async function toggleFlashlight(){
  if(!liveStream) {
    showToast('الكاميرا غير مفعلة حالياً');
    return;
  }
  try {
    const track = liveStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    if (!capabilities.torch) {
      showToast('خاصية الفلاش غير متوفرة في هذه الكاميرا');
      return;
    }
    flashEnabled = !flashEnabled;
    await track.applyConstraints({ advanced: [{ torch: flashEnabled }] });
    showToast(flashEnabled ? '⚡ تم تشغيل الفلاش' : '⚡ تم إطفاء الفلاش');
  } catch(err) {
    showToast('تعذر التحكم بفلاش الكاميرا');
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

    // محاكاة الجمهور الحقيقي المتفاعل
    if(liveSeconds % 3 === 0) {
      const commentsBox = document.getElementById('liveComments');
      if(commentsBox) {
        const names = ['أبو بكر الحضرمي', 'سالم التميمي', 'فريق الدعم الفني', 'عضو الجيش السيادي'];
        const msgs = ['منور البث يا أبو سلمان 🚀', 'عاشت تريم وعاش النظام السيادي 🏰', 'دعم كامل ومطلق لك يا غالي 🔥'];
        const name = names[Math.floor(Math.random() * names.length)];
        const text = msgs[Math.floor(Math.random() * msgs.length)];
        
        const div = document.createElement('div');
        div.className = 'text-xs text-cyan-200 bg-black/40 p-1.5 rounded-lg';
        div.innerHTML = `<span class="font-bold text-cyan-400">${name}:</span> ${text}`;
        commentsBox.appendChild(div);
        commentsBox.scrollTop = commentsBox.scrollHeight;
      }
    }
  }, 1000);
}

function sendLiveComment(){
  const input = document.getElementById('liveCommentIn');
  const box = document.getElementById('liveComments');
  if(!input || !box || !input.value.trim()) return;
  const div = document.createElement('div');
  div.className = 'text-xs text-cyan-200 bg-cyan-950/60 p-1.5 rounded-lg border border-cyan-500/30';
  div.innerHTML = `<span class="font-bold text-cyan-400">أنت:</span> ${input.value.trim()}`;
  box.appendChild(div);
  input.value = '';
  box.scrollTop = box.scrollHeight;
  showToast('تم إرسال التعليق 💬');
}

function sendLiveLike(){
  showToast('❤️ تفاعل إعجاب جديد في البث');
}

// قسم الهدايا السيادية في البث 🎁
function sendLiveGift(giftName, giftVal){
  const box = document.getElementById('liveComments');
  if(box) {
    const div = document.createElement('div');
    div.className = 'text-xs text-yellow-300 bg-yellow-950/60 p-2 rounded-lg border border-yellow-500/40 font-bold';
    div.innerHTML = `🎁 هدية سيادية: ${giftName} (+${giftVal} نقطة دعم)!`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }
  showToast(`تم إرسال ${giftName} بنجاح! 🎁✨`);
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

  setTimeout(() => {
    const reply = document.createElement('div');
    reply.className = 'glass p-2 rounded-xl text-xs text-yellow-300 text-right';
    reply.innerHTML = `<span class="font-bold text-white">فريق الدعم الفني:</span> تم استلام رسالتك وجاري معالجتها سيادياً يا أبو سلمان. 🛡️✨`;
    box.appendChild(reply);
    box.scrollTop = box.scrollHeight;
  }, 1000);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if(modal) {
    modal.classList.remove('hidden');
    if(id === 'modalManagePosts') {
      const listContainer = document.getElementById('modalPostsList');
      if(listContainer) {
        listContainer.innerHTML = '';
        savedMediaList.forEach((item, idx) => {
          listContainer.innerHTML += `<div class="glass p-2 rounded flex justify-between items-center text-xs"><span>${item.content.substring(0,30)}...</span><button onclick="savedMediaList.splice(${idx},1); localStorage.setItem('tarim_media', JSON.stringify(savedMediaList)); openModal('modalManagePosts')" class="text-red-400 text-[10px]">حذف</button></div>`;
        });
      }
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if(modal) modal.classList.add('hidden');
}

function updateAccountInfo() {
  const emailInput = document.getElementById('accEmailInput');
  if(emailInput && emailInput.value.trim()) {
    currentUser = emailInput.value.trim();
    localStorage.setItem('tarim_user', currentUser);
    updateProfileUI();
    showToast('تم تحديث الحساب بنجاح 👤');
  }
}
  
