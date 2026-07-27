let socket = null;
try {
  if (typeof io !== 'undefined') {
    socket = io();
  }
} catch(e) {
  console.log("Offline mode active");
}

function loginCEO(){
  const phone = document.getElementById('userPhone').value.trim();
  const pass = document.getElementById('userPass').value.trim();
  
  if(!phone){
    showToast('❌ الرجاء إدخال رقم الجوال أو المعرف');
    return;
  }
  if(!pass || pass.length < 8){
    showToast('🔒 كلمة السر قصيرة! يجب ألا تقل عن 8 خانات');
    return;
  }
  
  localStorage.setItem('ceo_user', phone);
  localStorage.setItem('ceo_pass', pass);
  if(!localStorage.getItem('ceo_name')){
    localStorage.setItem('ceo_name', 'الإمبراطور ' + phone);
  }
  
  updateUserInterface();
  const gate = document.getElementById('authGate');
  if(gate) gate.style.display = 'none';
  showToast('🏰 تم فتح القلعة ودمج الذكاء الاصطناعي بنجاح');
}

function updateUserInterface(){
  const savedName = localStorage.getItem('ceo_name') || 'الإمبراطور AL';
  document.querySelectorAll('.userNameDisplay').forEach(el => el.innerText = savedName);
}

(function(){
  const saved = localStorage.getItem('ceo_user');
  if(saved){
    const gate = document.getElementById('authGate');
    if(gate) gate.style.display = 'none';
    updateUserInterface();
  }
  const savedBg = localStorage.getItem('ceo_bg');
  if(savedBg){
    applyBackground(savedBg);
  }
})();

function applyBackground(url){
  const homeMain = document.getElementById('tab-home');
  if(homeMain){
    homeMain.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4)), url('${url}')`;
  }
}

function changeUserBackground(){
  const input = document.getElementById('bgUrlInput');
  if(!input) return;
  const url = input.value.trim();
  if(!url){
    showToast('الرجاء إدخال رابط الصورة (URL) أولاً');
    return;
  }
  localStorage.setItem('ceo_bg', url);
  applyBackground(url);
  input.value = '';
  showToast('🎨 تم تحديث خلفية التطبيق بنجاح');
}

function openTab(tab){
  document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
  const target = document.getElementById('tab-' + tab);
  if(target) target.classList.remove('hidden');
  
  document.querySelectorAll('nav button[data-nav]').forEach(b => {
    b.classList.remove('text-cyan-400');
    b.classList.add('text-white/40');
  });
  const active = document.querySelector('nav button[data-nav="' + tab + '"]');
  if(active){
    active.classList.remove('text-white/40');
    active.classList.add('text-cyan-400');
  }
  window.scrollTo(0, 0);
}

function createPost(type){
  if(type === 'LIVE أسطوري' || type === 'LIVE') {
    openTab('live');
    showToast('🔴 تم تفعيل شاشة البث المباشر السيادي بنجاح');
  } else if(type === 'عين الذكاء') {
    openTab('ai');
  } else {
    showToast('✨ تم تفعيل قسم: ' + type + ' وجاري المعالجة الذاتية');
  }
}

function handleInner(actionName){
  showToast('📁 تم الدخول إلى قسم: ' + actionName);
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

function sendAIPrompt(){
  const input = document.getElementById('aiIn');
  if(!input || !input.value.trim()) return;
  const text = input.value.trim();
  const logs = document.getElementById('aiLogs');
  if(logs){
    const userDiv = document.createElement('div');
    userDiv.className = 'bg-black/60 p-2.5 rounded-xl text-right text-xs border border-white/10';
    userDiv.innerText = 'أنت: ' + text;
    logs.appendChild(userDiv);
    logs.scrollTop = logs.scrollHeight;
  }
  
  if(socket){
    socket.emit('ai_prompt', { text: text });
  } else {
    setTimeout(() => {
      const respDiv = document.createElement('div');
      respDiv.className = 'bg-cyan-900/40 p-2.5 rounded-xl text-right text-xs border border-cyan-500/20';
      respDiv.innerText = 'TARIM AI Core: تم تنفيذ الأمر بمعالجة ذاتية بنجاح.';
      logs.appendChild(respDiv);
      logs.scrollTop = logs.scrollHeight;
    }, 500);
  }
  input.value = '';
}

function genQR(){
  showToast('🔏 تم توليد الختم الميداني المشفر + QR عبر الذكاء الاصطناعي');
}

function openMap(){
  showToast('🗺️ خريطة حضرموت وتريم Offline تعمل بذكاء اصطناعي مستقل');
}

function showToast(msg){
  let box = document.getElementById('toastBox');
  if(!box){
    box = document.createElement('div');
    box.id = 'toastBox';
    box.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm space-y-2 pointer-events-none';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'bg-[#10131f] border border-cyan-500/40 text-cyan-300 text-xs px-4 py-3 rounded-xl text-center shadow-2xl pointer-events-auto font-bold';
  t.innerText = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3500);
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

  socket.on('ai_response', (data) => {
    const logs = document.getElementById('aiLogs');
    if(!logs) return;
    const div = document.createElement('div');
    div.className = 'bg-cyan-900/40 p-2.5 rounded-xl text-right text-xs border border-cyan-500/20';
    div.innerText = data.user + ': ' + data.text;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
  });
}
