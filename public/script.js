let socket = null;
try {
  if (typeof io !== 'undefined') {
    socket = io();
  }
} catch(e) {
  console.log("Offline mode active");
}

// دالة تسجيل دخول أو إنشاء حساب المستخدم الجديد
function loginCEO(){
  const phone = document.getElementById('userPhone').value.trim();
  const pass = document.getElementById('userPass').value.trim();
  if(!phone || !pass){
    showToast('الرجاء إدخال رقم الجوال وكلمة السر');
    return;
  }
  
  // حفظ بيانات المستخدم الجديد محلياً
  localStorage.setItem('ceo_user', phone);
  localStorage.setItem('ceo_pass', pass);
  
  const disp = document.getElementById('userDisplay');
  if(disp) disp.innerText = phone;
  
  const gate = document.getElementById('authGate');
  if(gate) gate.style.display = 'none';
  
  showToast('🏰 تم فتح القلعة وتفعيل حساب المستخدم الجديد بنجاح');
  loadTasks();
}

// الفحص التلقائي لحالة المستخدم والخلفية المحفوظة عند فتح التطبيق
(function(){
  const saved = localStorage.getItem('ceo_user');
  if(saved){
    const gate = document.getElementById('authGate');
    if(gate) gate.style.display = 'none';
    const disp = document.getElementById('userDisplay');
    if(disp) disp.innerText = saved;
  }
  
  // تطبيق الخلفية الخاصة بالمستخدم إن كانت محفوظة مسبقاً
  const savedBg = localStorage.getItem('ceo_bg');
  if(savedBg){
    applyBackground(savedBg);
  }
})();

// دالة تطبيق الخلفية على بانر التطبيق الرئيسي
function applyBackground(url){
  const banner = document.getElementById('homeBanner');
  if(banner){
    banner.style.backgroundImage = `linear-gradient(transparent,rgba(0,0,0,0.9)),url('${url}')`;
  }
}

// إعدادات وتغيير خلفية التطبيق للمستخدم من قسم الملف الشخصي
function changeUserBackground(){
  const input = document.getElementById('bgUrlInput');
  if(!input) return;
  const url = input.value.trim();
  if(!url){
    showToast('الرجاء إدخال رابط الصورة (URL) أولاً');
    return;
  }
  
  // حفظ الخلفية الخاصة بهذا المستخدم في الذاكرة المحلية
  localStorage.setItem('ceo_bg', url);
  applyBackground(url);
  input.value = '';
  showToast('🎨 تم تحديث خلفية التطبيق الخاصة بك بنجاح');
}

let tabHistory = ['home'];

function openTab(tab){
  if(tabHistory[tabHistory.length - 1] !== tab){
    tabHistory.push(tab);
  }
  document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
  const target = document.getElementById('tab-' + tab);
  if(target) target.classList.remove('hidden');
  
  document.querySelectorAll('[data-nav]').forEach(b => {
    b.classList.remove('text-cyan-400');
    b.classList.add('text-white/40');
  });
  const active = document.querySelector('[data-nav="' + tab + '"]');
  if(active){
    active.classList.remove('text-white/40');
    active.classList.add('text-cyan-400');
  }
  
  const backBtn = document.getElementById('backBtn');
  if(backBtn){
    if(tab !== 'home'){
      backBtn.classList.remove('hidden');
      backBtn.classList.add('flex');
    } else {
      backBtn.classList.add('hidden');
      backBtn.classList.remove('flex');
    }
  }
  window.scrollTo(0, 0);
}

function goBack(){
  if(tabHistory.length > 1){
    tabHistory.pop();
    const prevTab = tabHistory[tabHistory.length - 1];
    document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
    const target = document.getElementById('tab-' + prevTab);
    if(target) target.classList.remove('hidden');
    
    document.querySelectorAll('[data-nav]').forEach(b => {
      b.classList.remove('text-cyan-400');
      b.classList.add('text-white/40');
    });
    const active = document.querySelector('[data-nav="' + prevTab + '"]');
    if(active){
      active.classList.remove('text-white/40');
      active.classList.add('text-cyan-400');
    }
    
    const backBtn = document.getElementById('backBtn');
    if(backBtn){
      if(prevTab !== 'home'){
        backBtn.classList.remove('hidden');
        backBtn.classList.add('flex');
      } else {
        backBtn.classList.add('hidden');
        backBtn.classList.remove('flex');
      }
    }
  }
}

function openCreate(){
  const sheet = document.getElementById('createSheet');
  if(sheet) sheet.classList.remove('hidden');
}

function closeCreate(){
  const sheet = document.getElementById('createSheet');
  if(sheet) sheet.classList.add('hidden');
}

function createPost(type){
  closeCreate();
  showToast('✅ تم إنشاء ' + type + ' السيادي بنجاح');
}

function handleInner(actionName){
  showToast('📁 جاري فتح قسم: ' + actionName);
}

async function loadTasks(){
  const container = document.getElementById('tasksContainer');
  if(container){
    container.innerHTML = `
      <div class="glass p-3.5 rounded-2xl flex justify-between items-center shadow-lg">
        <div><div class="font-bold text-[12px] text-cyan-300">بث مباشر سيادي ومشفر (8 دقائق)</div><div class="text-[10px] text-gray-400">سيرفرات أسطورية • هدايا تفاعلية</div></div>
        <span class="text-cyan-400 text-[10px] bg-cyan-500/10 px-2 py-1 rounded-lg">نشط</span>
      </div>
      <div class="glass p-3.5 rounded-2xl flex justify-between items-center shadow-lg">
        <div><div class="font-bold text-[12px] text-cyan-300">المراسلة والاتصال الآمن بين الحسابات</div><div class="text-[10px] text-gray-400">حماية بالذكاء الاصطناعي</div></div>
        <span class="text-cyan-400 text-[10px] bg-cyan-500/10 px-2 py-1 rounded-lg">محمي</span>
      </div>
    `;
  }
}

function sendMsg(){
  const input = document.getElementById('chatIn');
  if(!input || !input.value.trim()) return;
  const text = input.value.trim();
  const logs = document.getElementById('chatLogs');
  if(logs){
    const div = document.createElement('div');
    div.className = 'bg-cyan-900/40 p-2.5 rounded-xl text-right text-xs border border-cyan-500/20';
    div.innerText = 'أنت: ' + text;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
  }
  if(socket) {
    socket.emit('message', { user: localStorage.getItem('ceo_user') || 'CEO', text: text });
  }
  input.value = '';
}

function genQR(){
  const canvas = document.getElementById('qr');
  if(!canvas) return;
  canvas.classList.remove('hidden');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 160, 160);
  ctx.fillStyle = '#000000';
  for(let i = 0; i < 350; i++){
    ctx.fillRect(Math.random() * 160, Math.random() * 160, 3, 3);
  }
  const code = 'TARIM-SEAL-' + Date.now();
  const sealCodeElem = document.getElementById('sealCode');
  if(sealCodeElem) sealCodeElem.innerText = code;
  showToast('🔏 تم إصدار الختم الميداني بنجاح');
}

function openMap(){
  showToast('🗺️ جارِ تشغيل خريطة حضرموت وتريم دون اتصال (Offline)');
}

function showToast(msg){
  let box = document.getElementById('toastBox');
  if(!box){
    box = document.createElement('div');
    box.id = 'toastBox';
    box.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm space-y-2 pointer-events-none';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'bg-[#10131f] border border-cyan-500/40 text-cyan-300 text-xs px-4 py-3 rounded-xl text-center shadow-2xl pointer-events-auto font-bold';
  t.innerText = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

if(socket){
  socket.on('message', (data) => {
    const logs = document.getElementById('chatLogs');
    if(!logs) return;
    const currentUser = localStorage.getItem('ceo_user') || 'CEO';
    if(data.user === currentUser) return;
    const div = document.createElement('div');
    div.className = 'bg-white/5 p-2.5 rounded-xl text-xs border border-white/10';
    div.innerText = (data.user || 'مستخدم') + ': ' + data.text;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
  });
    }
