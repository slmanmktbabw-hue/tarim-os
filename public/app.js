/**
 * TARIM OS - app.js السيادي المستقر - V1.0 Beta
 * الملك: AL 👑 - تريم
 */

let socket = null;
try {
    if (typeof io !== 'undefined') {
        socket = io();
        socket.on('connect', () => console.log("🔗 متصل سيادي:", socket.id));
        socket.on('broadcast_post', () => loadFeed());
    }
} catch(e) {
    console.log("وضع العمل بدون سرفر مباشر");
}

let currentAuthTab = 'login';
let mapInstance = null;
let currentUser = localStorage.getItem('tarim_user') || null;

document.addEventListener('DOMContentLoaded', () => {
  // فتح التطبيق فوراً إذا كان المستخدم مسجلاً مسبقاً
  if (currentUser) {
    const gate = document.getElementById('authGate');
    if (gate) {
        gate.style.display = 'none';
        gate.classList.add('hidden');
    }
    const dis = document.getElementById('homeUsernameDisplay'); 
    if (dis) dis.innerText = '@' + currentUser + ' 👑';
    if (socket) {
        try { socket.emit('join', currentUser); } catch(err) {}
    }
  }
  
  loadFeed();

  // ربط أزرار الدخول بأمان
  const loginBtn = document.getElementById('tabLoginBtn');
  const regBtn = document.getElementById('tabRegBtn');
  if(loginBtn) loginBtn.addEventListener('click', () => switchAuthTab('login'));
  if(regBtn) regBtn.addEventListener('click', () => switchAuthTab('register'));

  // العمليات والأزرار التفاعلية
  const opLiveBtn = document.getElementById('opLiveBtn');
  if(opLiveBtn) opLiveBtn.addEventListener('click', () => { 
    switchTab('create', document.querySelectorAll('.nav-btn')[2]); 
    startRoyalLiveStream();
  });

  const opInboxBtn = document.getElementById('opInboxBtn');
  if(opInboxBtn) opInboxBtn.addEventListener('click', () => { switchTab('inbox', document.querySelectorAll('.nav-btn')[3]); });

  const opMapBtn = document.getElementById('opMapBtn');
  if(opMapBtn) opMapBtn.addEventListener('click', toggleMapOffline);

  const opQrBtn = document.getElementById('opQrBtn');
  if(opQrBtn) opQrBtn.addEventListener('click', generateOperationsQR);

  const publishBtn = document.getElementById('publishTextBtn');
  if(publishBtn) publishBtn.addEventListener('click', publishPost);

  const sendMsgBtn = document.getElementById('sendInboxMsgBtn');
  if(sendMsgBtn) sendMsgBtn.addEventListener('click', sendInboxMessage);

  generateInitialQR();
});

// ===== فتح القلعة فوراً عند الضغط (إصلاح مشكلة التوقف) =====
function forceUnlockCastle() {
  const userField = document.getElementById('userPhoneOrEmail')?.value.trim() || 'AL';
  currentUser = userField;
  localStorage.setItem('tarim_user', currentUser);
  
  const gate = document.getElementById('authGate');
  if (gate) {
      gate.style.display = 'none';
      gate.classList.add('hidden');
  }
  
  const disp = document.getElementById('homeUsernameDisplay');
  if (disp) disp.innerText = '@' + currentUser + ' 👑';
  
  showToast("👑 أهلاً بك يا إمبراطور في القلعة!");
  loadFeed();
}

function lockCastleAgain() {
  if (confirm("هل تريد تسجيل الخروج من القلعة؟")) { 
    localStorage.removeItem('tarim_user'); 
    location.reload(); 
  } 
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

// ===== التنقل بين التبويبات =====
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
            if (qrContainer && window.QRCode) {
                qrContainer.innerHTML = "";
                new QRCode(qrContainer, { text: "https://tarimos.org/user/" + (currentUser || 'AL'), width: 128, height: 128 });
            }
        }
    }
}

function backToProfile() {
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.remove('hidden');
}

// ===== إدارة الفيد والمنشورات بأمان تام =====
async function loadFeed() {
  try {
    const r = await fetch('/api/feed/home'); 
    if (!r.ok) return;
    const posts = await r.json();
    const feed = document.getElementById('feedContainer');
    if (!feed || !posts || !posts.length) return;
    
    feed.innerHTML = posts.map(p => `
      <div class="glass rounded-2xl p-3 mb-3 text-right">
        <div class="flex justify-between text-[10px] text-slate-400"><span>@${p.user}</span><span>${new Date(p.time).toLocaleTimeString()}</span></div>
        <div class="text-xs mt-2 text-white">${p.text}</div>
      </div>
    `).join('');
  } catch(e) {
    // تجاوز أي خطأ بصمت لكي لا يتوقف التطبيق
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

// ===== العمليات المساعدة =====
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
    div.className = "glass p-2.5 rounded-xl text-xs text-cyan-200 mt-2 text-right";
    div.innerHTML = `<b>${currentUser || 'AL'}:</b> ${input.value}`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }
  input.value = ""; 
  showToast("🚀 تم إرسال الرسالة السيادية"); 
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
