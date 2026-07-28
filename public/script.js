let socket = null;
try {
  if (typeof io !== 'undefined') socket = io();
} catch(e) { console.log("Offline Mode"); }

async function loginCEO(){
  const phone = document.getElementById('userPhone').value.trim();
  const pass = document.getElementById('userPass').value.trim();
  
  if(!phone || pass.length < 8){
    showRealAlert('❌ أدخل رقم أو بريد صحيح وكلمة سر من 8 خانات فأكثر');
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pass })
    });
    const data = await res.json();
    
    if(data.success){
      localStorage.setItem('ceo_user', data.user);
      document.getElementById('authGate').style.display = 'none';
      showRealAlert('🏰 تم الاتصال بالسيرفر وتسجيل الدخول حقيقياً بنجاح');
      loadWalletData();
    } else {
      showRealAlert(data.error || 'فشل تسجيل الدخول');
    }
  } catch(e) {
    showRealAlert('⚠️ خطأ في الاتصال بالسيرفر الحقيقي');
  }
}

async function loadWalletData(){
  try {
    const res = await fetch('/api/wallet/status');
    const data = await res.json();
    if(data.success){
      const el = document.getElementById('walletBalanceDisplay');
      if(el) el.innerText = data.balance;
    }
  } catch(e) { console.log("Wallet load error"); }
}

(function(){
  if(localStorage.getItem('ceo_user')){
    const gate = document.getElementById('authGate');
    if(gate) gate.style.display = 'none';
    loadWalletData();
  }
})();

function openTab(tab){
  document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
  const t = document.getElementById('tab-' + tab);
  if(t) t.classList.remove('hidden');
  window.scrollTo(0, 0);
}

function openSupportTeam(){ openTab('chat'); }
function openLiveStream(){ openTab('live'); }

async function createPost(type){
  const user = localStorage.getItem('ceo_user') || 'AL';
  const content = prompt(`أدخل تفاصيل ${type}:`);
  if(!content) return;

  try {
    const res = await fetch('/api/posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content, user })
    });
    const data = await res.json();
    if(data.success){
      showRealAlert('✅ ' + data.message);
    }
  } catch(e) {
    showRealAlert('⚠️ خطأ أثناء إرسال المنشور للسيرفر');
  }
}

function handleSub(name){
  if(name.includes('رصيد')) {
    loadWalletData();
    showRealAlert('💰 تم جلب بيانات محفظة OKX الحقيقية من السيرفر بنجاح');
  } else {
    showRealAlert('📁 قسم حقيقي: ' + name);
  }
}

async function sendAIPrompt(){
  const inp = document.getElementById('aiIn');
  if(!inp || !inp.value.trim()) return;
  const txt = inp.value.trim();
  const logs = document.getElementById('aiLogs');
  
  if(logs){
    const userDiv = document.createElement('div');
    userDiv.className = 'bg-blue-950/40 p-2.5 rounded-xl text-right border border-blue-500/20 text-xs';
    userDiv.innerText = 'أنت: ' + txt;
    logs.appendChild(userDiv);
    logs.scrollTop = logs.scrollHeight;
  }

  if(socket){
    socket.emit('ai_prompt', { text: txt });
  }
  inp.value = '';
}

if(socket){
  socket.on('ai_response', (data) => {
    const logs = document.getElementById('aiLogs');
    if(!logs) return;
    const div = document.createElement('div');
    div.className = 'bg-blue-900/50 p-2.5 rounded-xl text-right border border-blue-500/40 text-xs';
    div.innerText = data.user + ': ' + data.text;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
  });

  socket.on('message', (data) => {
    const logs = document.getElementById('chatLogs');
    if(!logs) return;
    const div = document.createElement('div');
    div.className = 'bg-white/5 p-2.5 rounded-xl text-left border border-white/10 text-xs';
    div.innerText = (data.user || 'مستخدم') + ': ' + data.text;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
  });
}

function sendMsg(){
  const inp = document.getElementById('chatIn');
  if(!inp || !inp.value.trim()) return;
  const txt = inp.value.trim();
  const logs = document.getElementById('chatLogs');
  if(logs){
    const div = document.createElement('div');
    div.className = 'bg-cyan-950/40 p-2.5 rounded-xl text-right border border-cyan-500/20 text-xs';
    div.innerText = 'أنت: ' + txt;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
  }
  if(socket) socket.emit('message', { user: localStorage.getItem('ceo_user') || 'AL', text: txt });
  inp.value = '';
}

function showRealAlert(msg){
  let box = document.getElementById('toastBox');
  if(!box){
    box = document.createElement('div');
    box.id = 'toastBox';
    box.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-[700] w-[90%] max-w-sm space-y-2 pointer-events-none';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'bg-[#131824] border border-cyan-500 text-cyan-300 text-xs px-4 py-3 rounded-xl text-center shadow-2xl font-bold pointer-events-auto';
  t.innerText = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
