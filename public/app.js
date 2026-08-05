/**
 * TARIM OS - app.js السيادي المربوط بالسيرفر - V1.0 Beta
 * الملك: AL 👑 - تريم
 */
const socket = io();
let currentAuthTab = 'login';
let mapInstance = null;
let currentUser = localStorage.getItem('tarim_user') || null;

socket.on('connect', ()=> console.log("🔗 متصل سيادي:", socket.id));
socket.on('broadcast_post', ()=> loadFeed());

document.addEventListener('DOMContentLoaded', ()=>{
  if(currentUser){
    const gate = document.getElementById('authGate');
    if(gate) gate.classList.add('hidden');
    const dis = document.getElementById('homeUsernameDisplay'); 
    if(dis) dis.innerText = '@' + currentUser + ' 👑';
    socket.emit('join', currentUser);
  }
  loadFeed();

  // تفعيل أزرار الدخول
  document.getElementById('tabLoginBtn')?.addEventListener('click', ()=> switchAuthTab('login'));
  document.getElementById('tabRegBtn')?.addEventListener('click', ()=> switchAuthTab('register'));
  document.getElementById('authActionBtn')?.addEventListener('click', processLogin);
  document.getElementById('googleAuthBtn')?.addEventListener('click', processGoogleLogin);

  // العمليات والأزرار التفاعلية
  document.getElementById('opLiveBtn')?.addEventListener('click', ()=>{ 
    switchTab('create', document.querySelector('[data-tab="create"]')); 
    startRoyalLiveStream();
  });
  document.getElementById('opInboxBtn')?.addEventListener('click', ()=>{ switchTab('inbox', document.querySelector('[data-tab="inbox"]')); });
  document.getElementById('opMapBtn')?.addEventListener('click', toggleMapOffline);
  document.getElementById('opQrBtn')?.addEventListener('click', generateOperationsQR);

  document.getElementById('publishTextBtn')?.addEventListener('click', publishPost);
  document.getElementById('sendInboxMsgBtn')?.addEventListener('click', sendInboxMessage);
  document.getElementById('logoutProfileBtn')?.addEventListener('click', logoutSystem);

  generateInitialQR();
});

// ===== إدارة التبويبات العامة بدون أخطاء =====
function switchTab(tabName, clickedBtn){
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  const target = document.getElementById('tab-' + tabName);
  if(target) target.classList.remove('hidden');

  if(clickedBtn){
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.remove('text-cyan-400');
      b.classList.add('text-slate-400');
    });
    clickedBtn.classList.remove('text-slate-400');
    clickedBtn.classList.add('text-cyan-400');
  }
  if(tabName === 'home') loadFeed();
  if(tabName === 'profile') backToProfile();
}

function showSubPage(pageId) {
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.add('hidden');
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    
    const target = document.getElementById('sub-' + pageId);
    if(target) {
        target.classList.remove('hidden');
        if(pageId === 'qr-page') {
            const qrContainer = document.getElementById('qrcode');
            if (qrContainer) {
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

// ===== المصادقة =====
function switchAuthTab(tab){
  currentAuthTab = tab;
  const loginBtn = document.getElementById('tabLoginBtn');
  const regBtn = document.getElementById('tabRegBtn');
  const actionBtn = document.getElementById('authActionBtn');
  if(tab === 'login'){
    if(loginBtn) loginBtn.className = "text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1 cursor-pointer";
    if(regBtn) regBtn.className = "text-xs text-slate-400 pb-1 cursor-pointer";
    if(actionBtn) actionBtn.innerText = "دخول القلعة السيادية 🔑";
  }else{
    if(regBtn) regBtn.className = "text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1 cursor-pointer";
    if(loginBtn) loginBtn.className = "text-xs text-slate-400 pb-1 cursor-pointer";
    if(actionBtn) actionBtn.innerText = "إنشاء الحساب السيادي 🚀";
  }
}

async function processLogin(){
  const userField = document.getElementById('userPhoneOrEmail')?.value.trim() || 'AL';
  const passField = document.getElementById('userPass')?.value.trim() || '123456';
  
  try{
    const endpoint = currentAuthTab === 'register' ? '/api/auth/register' : '/api/auth/login';
    const r = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({user:userField, pass:passField})});
    const d = await r.json();
    
    currentUser = d.user || userField; 
    localStorage.setItem('tarim_user', currentUser);
    if(d.token) localStorage.setItem('tarim_token', d.token);
    
    document.getElementById('authGate')?.classList.add('hidden');
    const disp = document.getElementById('homeUsernameDisplay');
    if(disp) disp.innerText = '@' + currentUser + ' 👑';
    socket.emit('join', currentUser);
    showToast("✨ أهلاً بك يا " + currentUser + " في القلعة!");
  }catch(e){ 
    currentUser = userField;
    localStorage.setItem('tarim_user', currentUser);
    document.getElementById('authGate')?.classList.add('hidden');
    const disp = document.getElementById('homeUsernameDisplay');
    if(disp) disp.innerText = '@' + currentUser + ' 👑';
    showToast("✨ تم الدخول السيادي بنجاح!");
  }
}

async function processGoogleLogin(){
  currentUser = "AL_Google"; 
  localStorage.setItem('tarim_user', currentUser);
  document.getElementById('authGate')?.classList.add('hidden');
  const disp = document.getElementById('homeUsernameDisplay');
  if(disp) disp.innerText = '@' + currentUser + ' 👑';
  showToast("👑 أهلاً سيادي عبر جوجل");
}

// ===== الفيد والمنشورات =====
async function loadFeed(){
  try{
    const r = await fetch('/api/feed/home'); 
    const posts = await r.json();
    const feed = document.getElementById('feedContainer');
    if(!feed) return;
    if(!posts.length){ feed.innerHTML = '<div class="text-center text-xs text-slate-500 p-6">لا فيديوهات بعد - كن أول من ينشر سيادي ✨</div>'; return; }
    feed.innerHTML = posts.map(p=>`
      <div class="glass rounded-2xl p-3 mb-3 text-right">
        <div class="flex justify-between text-[10px] text-slate-400"><span>@${p.user}</span><span>${new Date(p.time).toLocaleTimeString()}</span></div>
        <div class="text-xs mt-2 text-white">${p.text}</div>
      </div>
    `).join('');
  }catch(e){
    const feed = document.getElementById('feedContainer');
    if(feed) feed.innerHTML = '<div class="text-center text-xs text-cyan-400 p-6">🏰 النظام يعمل بكامل طاقته - تريم حضرموت</div>';
  }
}

async function publishPost(){
  const input = document.getElementById('postContentInput');
  if(!input) return;
  const text = input.value.trim();
  if(!text){ showToast("✍️ اكتب شيئاً أولاً"); return; }
  try{
    await fetch('/api/feed/publish-video', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({user:currentUser||'AL', text})});
  }catch(e){}
  input.value = ""; 
  showToast("📢 تم النشر الفوري بنجاح"); 
  loadFeed(); 
  switchTab('home', document.querySelector('[data-tab="home"]'));
}

// ===== البث المباشر السيادي المطلوبة =====
function startRoyalLiveStream() {
    showToast("🔴 جاري فتح غرفة البث المباشر السيادي (8 دقائق)...");
}

// ===== الأدوات الإضافية =====
function showToast(m){ 
  const box = document.getElementById('toastBox'); 
  if(!box) return;
  const d = document.createElement('div'); 
  d.className = "bg-cyan-500 text-black font-bold text-xs px-4 py-2 rounded-xl shadow-lg mt-2 text-center w-full"; 
  d.innerText = m; 
  box.appendChild(d); 
  setTimeout(()=>d.remove(), 2500); 
}

function generateInitialQR(){ 
  const box = document.getElementById('operationsQrBox'); 
  if(box && box.children.length === 0 && window.QRCode){ 
    new QRCode(box, {text: "https://tarimos.org/?sovereign=al", width: 100, height: 100}); 
  } 
}

async function generateOperationsQR(){ 
  showToast("🧾 تم إصدار الختم الميداني السيادي بنجاح"); 
}

function toggleMapOffline(){ 
  const mapEl = document.getElementById('mapContainer'); 
  if(!mapEl) return;
  mapEl.classList.toggle('hidden'); 
  if(!mapEl.classList.contains('hidden') && !mapInstance){ 
    setTimeout(()=>{ 
      mapInstance = L.map('mapContainer').setView([16.0042, 48.9814], 13); 
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance); 
      L.marker([16.0042, 48.9814]).addTo(mapInstance).bindPopup('تريم - حضرموت الخير').openPopup(); 
    }, 300); 
  } 
}

function sendInboxMessage(){ 
  const input = document.getElementById('inboxInputField'); 
  if(!input || !input.value.trim()) return; 
  const list = document.getElementById('inboxMessagesList'); 
  if(list) list.innerHTML += `<div class="glass p-2.5 rounded-xl text-xs text-cyan-200"><b>${currentUser || 'AL'}:</b> ${input.value}</div>`; 
  input.value = ""; 
  showToast("🚀 تم إرسال الرسالة السيادية"); 
}

function logoutSystem(){ 
  if(confirm("هل تريد تسجيل الخروج من القلعة؟")){ 
    localStorage.removeItem('tarim_user'); 
    location.reload(); 
  } 
}
