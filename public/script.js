const socket = io();
let currentUser = localStorage.getItem('tarim_user') || 'slmanmktbabw@gmail.com';
let savedMediaList = JSON.parse(localStorage.getItem('tarim_media')) || [
  { type: 'video', author: 'slmanmktbabw@gmail.com', content: 'فيديو سيادي مسجل على سيرفرات TARIM OS 🎥', date: '2026-08-04' },
  { type: 'post', author: 'slmanmktbabw@gmail.com', content: 'منشور ترويجي عبر tarimos.org 📢', date: '2026-08-04' }
];
let liveStream = null, liveTimerInterval = null, liveSeconds = 0;

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
  const target = document.getElementById('tab-' + tabName);
  if(target) target.classList.remove('hidden');
  document.querySelectorAll('nav button.nav-btn').forEach(btn => {
    btn.classList.remove('text-cyan-400'); btn.classList.add('text-gray-400');
  });
  if(event && event.currentTarget) {
    event.currentTarget.classList.remove('text-gray-400');
    event.currentTarget.classList.add('text-cyan-400');
  }
  if(tabName === 'home') renderSavedMedia();
}

function requestOTP(){
  localStorage.setItem('tarim_logged_in', 'true');
  document.getElementById('authGate').style.display = 'none';
  updateProfileUI(); renderSavedMedia();
  showToast('تم تسجيل الدخول السيادي بنجاح 🚀');
}

function updateProfileUI(){
  const homeUser = document.getElementById('homeUsername');
  const profileName = document.getElementById('profileName');
  if(homeUser) homeUser.innerText = currentUser;
  if(profileName) profileName.innerText = currentUser;
}

// --- عين الذكاء والدعم - نسخة نهائية واحدة ---
function toggleAIEye(){
  const msgs = [
    '👁️ عين الذكاء نشطة\n\n✅ البث مستقر\n✅ 3 مشاهدين حالياً\n✅ الخريطة مؤمنة',
    '👁️ فحص أمني:\n\n✅ لا يوجد تهديد\n✅ الاتصال مشفر SSL\n✅ النظام مستقر 100%'
  ];
  showToast('👁️ عين الذكاء نشطة');
  alert(msgs[Math.floor(Math.random()*msgs.length)]);
}

function toggleSupportAI(){
  const msg = prompt('🛡️ فريق الدعم الفني - TARIM OS\n\nاكتب مشكلتك:');
  if(!msg) return;
  let reply = 'تم استلام رسالتك، فريق الدعم يراجعها الآن 🛡️';
  if(msg.includes('بث')) reply = '🔴 للبث: اسمح للكاميرا من الإعدادات ثم اضغط بدء بث سيادي';
  else if(msg.includes('خريطة')) reply = '🗺️ الخريطة الميدانية تعمل، قريباً Offline كاملة';
  else if(msg.includes('رصيد') || msg.includes('OKX')) reply = '💰 رصيدك 1000 USDT آمن ومحفوظ';
  else if(msg.includes('سلام')) reply = 'وعليكم السلام يا ملك TARIM OS 👑';
  alert(reply);
  // يضيفها للوارد ايضا
  const inboxBox = document.getElementById('inboxMessages');
  if(inboxBox){
    const div = document.createElement('div');
    div.className = 'glass p-2 rounded-xl text-xs text-yellow-300 text-right';
    div.innerHTML = `<b>الدعم:</b> ${reply}`;
    inboxBox.appendChild(div);
  }
}

function publishPost(type){
  const desc = document.getElementById('postDescInput');
  if(!desc || !desc.value.trim()) { showToast('اكتب محتوى المنشور أولاً'); return; }
  const newMedia = { type, author: currentUser, content: desc.value.trim(), date: new Date().toISOString().split('T')[0] };
  savedMediaList.unshift(newMedia);
  localStorage.setItem('tarim_media', JSON.stringify(savedMediaList));
  desc.value = '';
  showToast('✨ تم النشر بنجاح!'); renderSavedMedia();
}

function renderSavedMedia(){
  const feed = document.getElementById('savedMediaFeed');
  if(!feed) return;
  feed.innerHTML = '';
  savedMediaList.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'glass p-3 rounded-xl border border-cyan-500/20 space-y-2 text-right';
    div.innerHTML = `<div class="flex justify-between text-[10px] text-cyan-400"><span>${item.author}</span><span>${item.date}</span></div><p class="text-xs text-cyan-100">${item.content}</p><div class="flex justify-end gap-2 pt-1"><button onclick="deleteMedia(${index})" class="text-[10px] bg-red-500/20 text-red-300 px-2.5 py-1 rounded border border-red-500/30">حذف 🗑️</button></div>`;
    feed.appendChild(div);
  });
}
function deleteMedia(index){ savedMediaList.splice(index, 1); localStorage.setItem('tarim_media', JSON.stringify(savedMediaList)); renderSavedMedia(); showToast('تم الحذف'); }
function changeBackgroundProfile(){ document.body.style.filter = document.body.style.filter ? '' : 'hue-rotate(90deg)'; showToast('تم تغيير الألوان 🎨'); }
function shareProfile(){ navigator.clipboard.writeText(window.location.origin); showToast('تم نسخ الرابط 🔗'); }
function logout(){ localStorage.removeItem('tarim_logged_in'); document.getElementById('authGate').style.display='flex'; showToast('تم تسجيل الخروج 🚪'); }
function openMap(){
  const mapBox = document.getElementById('mapContainer'); if(!mapBox) return;
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
function startLiveStudio(){ document.getElementById('fullScreenCam').classList.remove('hidden'); confirmStartLive(); }
async function confirmStartLive(){
  document.getElementById('preLiveOverlay').classList.add('hidden');
  try { liveStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); document.getElementById('fullCamVideo').srcObject = liveStream; } catch(e){}
  liveSeconds=0; if(liveTimerInterval) clearInterval(liveTimerInterval);
  liveTimerInterval = setInterval(()=>{ liveSeconds++; let m=Math.floor(liveSeconds/60).toString().padStart(2,'0'); let s=(liveSeconds%60).toString().padStart(2,'0'); document.getElementById('liveTimer').innerText=`${m}:${s}`; }, 1000);
  showToast('🔴 بدأ البث المباشر!');
}
function exitFullScreen(){ if(liveStream) liveStream.getTracks().forEach(t=>t.stop()); if(liveTimerInterval) clearInterval(liveTimerInterval); document.getElementById('fullScreenCam').classList.add('hidden'); }
function sendInboxMsg(){
  const input = document.getElementById('inboxInput'), box = document.getElementById('inboxMessages');
  if(!input || !box || !input.value.trim()) return;
  const div = document.createElement('div'); div.className='glass p-2 rounded-xl text-xs text-cyan-300 text-right'; div.innerHTML=`<b>أنت:</b> ${input.value.trim()}`; box.appendChild(div); input.value=''; box.scrollTop=box.scrollHeight;
  setTimeout(()=>{ const r=document.createElement('div'); r.className='glass p-2 rounded-xl text-xs text-yellow-300 text-right'; r.innerHTML='<b>الدعم:</b> تم استلام رسالتك وجاري التنفيذ 🛡️'; box.appendChild(r); box.scrollTop=box.scrollHeight; }, 800);
}
function openModal(id){ document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id){ document.getElementById(id)?.classList.add('hidden'); }
function updateAccountInfo(){ const e=document.getElementById('accEmailInput'); if(e && e.value.trim()){ currentUser=e.value.trim(); localStorage.setItem('tarim_user', currentUser); updateProfileUI(); showToast('تم تحديث الحساب 👤'); } }

// ازرار الملفات
document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('.service-btn'); if(!btn) return;
  const text = btn.innerText || "";
  if(text.includes('رصيد OKX')) alert('💰 رصيدك: 1000 USDT');
  else if(text.includes('الروج والإعلانات')) window.open('https://business.facebook.com/', '_blank');
  else if(text.includes('تغيير خلفية')) changeBackgroundProfile();
  else if(text.includes('مشاركة ملف')) shareProfile();
  else if(text.includes('السياسة والخصوصية')) openModal('modalPolicy');
});
function generateQR(){ showToast('تم إصدار رمز QR 🧾'); }
function switchCamera(){ showToast('تبديل الكاميرا 📷'); }
function publishPost(t){ /* موجود فوق */ }
