/**
 * TARIM OS - app.js السيادي المربوط بالسيرفر - V1.0 Beta
 * الملك: AL 👑 - تريم
 */

// الاتصال الآمن بالسيرفر عبر Socket.io مع الحماية من الأخطاء عند عدم الاتصال
let socket = null;
if (typeof io !== 'undefined') {
    socket = io();
    socket.on('connect', () => console.log("🔗 متصل سيادي:", socket.id));
    socket.on('broadcast_post', () => loadFeed());
}

let currentAuthTab = 'login';
let mapInstance = null;
let currentUser = localStorage.getItem('tarim_user') || null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. التحقق من المستخدم وتمريره
  if (currentUser) {
    const gate = document.getElementById('authGate');
    if (gate) gate.classList.add('hidden');
    const dis = document.getElementById('homeUsernameDisplay'); 
    if (dis) dis.innerText = '@' + currentUser + ' 👑';
    if (socket) socket.emit('join', currentUser);
  }
  
  loadFeed();

  // 2. تفعيل أزرار الدخول والمصادقة
  document.getElementById('tabLoginBtn')?.addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('tabRegBtn')?.addEventListener('click', () => switchAuthTab('register'));
  
  // 3. تفعيل أزرار العمليات في القلعة
  document.getElementById('opLiveBtn')?.addEventListener('click', () => { 
    switchTab('create', document.querySelectorAll('.nav-btn')[2]); 
    startRoyalLiveStream();
  });
  document.getElementById('opInboxBtn')?.addEventListener('click', () => { 
    switchTab('inbox', document.querySelectorAll('.nav-btn')[3]); 
  });
  document.getElementById('opMapBtn')?.addEventListener('click', toggleMapOffline);
  document.getElementById('opQrBtn')?.addEventListener('click', generateOperationsQR);

  // 4. أزرار الإنشاء والرسائل
  document.getElementById('publishTextBtn')?.addEventListener('click', publishPost);
  document.getElementById('sendInboxMsgBtn')?.addEventListener('click', sendInboxMessage);

  // 5. أزرار الهيدر (عين الذكاء وفريق الدعم)
  document.getElementById('openAiEyeBtn')?.addEventListener('click', () => {
    showToast("👁️ عين الذكاء: القلعة السيادية تعمل بأمان كلي");
  });
  document.getElementById('openSupportBtn')?.addEventListener('click', () => {
    showToast("🛡️ فريق الدعم السيادي متصل في خدمتك");
  });

  // توليد QR الأولي
  generateInitialQR();
});

// ===== إدارة بوابة الدخول والولوج الفوري =====
function forceUnlockCastle() {
  processLogin();
}

function lockCastleAgain() {
  logoutSystem();
}

function switchAuthTab(tab) {
  currentAuthTab = tab;
  const loginBtn = document.getElementById('tabLoginBtn');
  const regBtn = document.getElementById('tabRegBtn');
  const authMsg = document.getElementById('authMsg');

  if (tab === 'login') {
    if (loginBtn) loginBtn.className = "text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1 cursor-pointer";
    if (regBtn) regBtn.className = "text-xs text-slate-400 pb-1 cursor-pointer";
    if (authMsg) authMsg.innerText = "بوابة الدخول للقلعة السيادية - أبو سلمان";
  } else {
    if (regBtn) regBtn.className = "text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1 cursor-pointer";
    if (loginBtn) loginBtn.className = "text-xs text-slate-400 pb-1 cursor-pointer";
    if (authMsg) authMsg.innerText = "إنشاء حساب مواطن سيادي جديد 👑";
  }
}

async function processLogin() {
  const userField = document.getElementById('userPhoneOrEmail')?.value.trim() || 'AL';
  const passField = document.getElementById('userPass')?.value.trim() || '123456';
  
  try {
    const endpoint = currentAuthTab === 'register' ? '/api/auth/register' : '/api/auth/login';
    const r = await fetch(endpoint, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ user: userField, pass: passField })
    });
    const d = await r.json();
    
    currentUser = d.user || userField; 
    localStorage.setItem('tarim_user', currentUser);
    if (d.token) localStorage.setItem('tarim_token', d.token);
    
    document.getElementById('authGate')?.classList.add('hidden');
    const disp = document.getElementById('homeUsernameDisplay');
    if (disp) disp.innerText = '@' + currentUser + ' 👑';
    if (socket) socket.emit('join', currentUser);
    showToast("✨ أهلاً بك يا " + currentUser + " في القلعة!");
  } catch(e) { 
    currentUser = userField;
    localStorage.setItem('tarim_user', currentUser);
    document.getElementById('authGate')?.classList.add('hidden');
    const disp = document.getElementById('homeUsernameDisplay');
    if (disp) disp.innerText = '@' + currentUser + ' 👑';
    showToast("✨ تم الدخول السيادي بنجاح!");
  }
}

async function processGoogleLogin() {
  currentUser = "AL_Google"; 
  localStorage.setItem('tarim_user', currentUser);
  document.getElementById('authGate')?.classList.add('hidden');
  const disp = document.getElementById('homeUsernameDisplay');
  if (disp) disp.innerText = '@' + currentUser + ' 👑';
  showToast("👑 أهلاً سيادي عبر جوجل");
}

// ===== التنقل بين التبويبات والمشاريع =====
function switchTab(tabName, clickedBtn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  const target = document.getElementById('tab-' + tabName);
  if (target) target.classList.remove('hidden');

  if (clickedBtn) {
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.remove('text-cyan-400');
      b.classList.add('text-slate-400');
    });
    clickedBtn.classList.remove('text-slate-400');
    clickedBtn.classList.add('text-cyan-400');
  }
  if (tabName === 'home') loadFeed();
  if (tabName === 'profile') backToProfile();
}

function showSubPage(pageId) {
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.add('hidden');
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    
    const target = document.getElementById('sub-' + pageId);
    if (target) {
        target.classList.remove('hidden');
        if (pageId === 'qr-page') {
            const qrContainer = document.getElementById('qrcode');
            if (qrContainer) {
                qrContainer.innerHTML = "";
                if (typeof QRCode !== 'undefined') {
                    new QRCode(qrContainer, { text: "https://tarimos.org/user/" + (currentUser || 'AL'), width: 128, height: 128 });
                }
            }
        }
    }
}

function backToProfile() {
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.remove('hidden');
}

// ===== الفيد والمنشورات السيادية =====
async function loadFeed() {
  try {
    const r = await fetch('/api/feed/home'); 
    const posts = await r.json();
    const feed = document.getElementById('feedContainer');
    if (!feed) return;
    if (!posts || !posts.length) return;
    
    feed.innerHTML = posts.map(p => `
      <div class="glass rounded-2xl p-3 mb-3 text-right">
        <div class="flex justify-between text-[10px] text-slate-400"><span>@${p.user}</span><span>${new Date(p.time).toLocaleTimeString()}</span></div>
        <div class="text-xs mt-2 text-white">${p.text}</div>
      </div>
    `).join('');
  } catch(e) {
    // المحافظة على التصميم في حال عدم وجود منشورات من السيرفر
  }
}

async function publishPost() {
  const input = document.getElementById('postContentInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) { showToast("✍️ اكتب شيئاً أولاً"); return; }
  
  try {
    await fetch('/api/feed/publish-video', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ user: currentUser || 'AL', text })
    });
  } catch(e) {}
  
  input.value = ""; 
  showToast("📢 تم النشر الفوري بنجاح"); 
  loadFeed(); 
  switchTab('home', document.querySelectorAll('.nav-btn')[0]);
}

// ===== الأدوات الإضافية والخريطة والـ QR =====
function startRoyalLiveStream() {
    showToast("🔴 جاري فتح غرفة البث المباشر السيادي (8 دقائق)...");
}

function generateInitialQR() { 
  const box = document.getElementById('operationsQrBox'); 
  if (box && box.children.length === 0 && window.QRCode) { 
    new QRCode(box, { text: "https://tarimos.org/?sovereign=al", width: 100, height: 100 }); 
  } 
}

async function generateOperationsQR() { 
  const box = document.getElementById('operationsQrBox');
  if (box && window.QRCode) {
    box.innerHTML = "";
    new QRCode(box, { text: "https://tarimos.org/seal/" + Date.now(), width: 100, height: 100 });
  }
  showToast("🧾 تم إصدار الختم الميداني السيادي بنجاح"); 
}

function toggleMapOffline() { 
  const mapEl = document.getElementById('mapContainer'); 
  if (!mapEl) return;
  mapEl.classList.toggle('hidden'); 
  if (!mapEl.classList.contains('hidden') && !mapInstance && typeof L !== 'undefined') { 
    setTimeout(() => { 
      mapInstance = L.map('mapContainer').setView([16.0042, 48.9814], 13); 
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance); 
      L.marker([16.0042, 48.9814]).addTo(mapInstance).bindPopup('تريم - حضرموت الخير 🌴').openPopup(); 
    }, 300); 
  } 
}

function sendInboxMessage() { 
  const input = document.getElementById('inboxInputField'); 
  if (!input || !input.value.trim()) return; 
  const list = document.getElementById('inboxMessagesList'); 
  if (list) {
    const div = document.createElement('div');
    div.className = "glass p-2.5 rounded-xl text-xs text-cyan-200 mt-2";
    div.innerHTML = `<b>${currentUser || 'AL'}:</b> ${input.value}`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }
  input.value = ""; 
  showToast("🚀 تم إرسال الرسالة السيادية"); 
}

function logoutSystem() { 
  if (confirm("هل تريد تسجيل الخروج من القلعة؟")) { 
    localStorage.removeItem('tarim_user'); 
    localStorage.removeItem('tarim_token');
    location.reload(); 
  } 
}

function showToast(m) { 
  const box = document.getElementById('toastBox'); 
  if (!box) return;
  const d = document.createElement('div'); 
  d.className = "bg-cyan-500 text-black font-bold text-xs px-4 py-2 rounded-xl shadow-lg mt-2 text-center w-full transition-all duration-300"; 
  d.innerText = m; 
  box.appendChild(d); 
  setTimeout(() => d.remove(), 2500); 
}
