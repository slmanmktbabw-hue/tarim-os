const socket = typeof io!== 'undefined'? io() : null;

function loginCEO() {
    const p = document.getElementById('userPhone').value.trim();
    const pass = document.getElementById('userPass').value.trim();
    if (!p ||!pass) {
        alert('أدخل رقم الجوال والبريد وكلمة السر');
        return;
    }
    localStorage.setItem('ceo_user', p);
    const disp = document.getElementById('userDisplay');
    if(disp) disp.innerText = p;
    document.getElementById('authGate').style.display = 'none';
    showToast('تم فتح القلعة السيادية 🏰');
    loadTasks();
}

if (localStorage.getItem('ceo_user')) {
    setTimeout(()=>{
        const gate = document.getElementById('authGate');
        if(gate) gate.style.display = 'none';
        const userDisp = document.getElementById('userDisplay');
        if(userDisp) userDisp.innerText = localStorage.getItem('ceo_user');
    },200);
}

function openTab(t) {
    document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
    const target = document.getElementById('tab-' + t);
    if(target) target.classList.remove('hidden');
    document.querySelectorAll('[data-nav]').forEach(b => {
        b.classList.remove('text-cyan-400');
        b.classList.add('text-white/40');
    });
    const b = document.querySelector('[data-nav=' + t + ']');
    if (b) {
        b.classList.remove('text-white/40');
        b.classList.add('text-cyan-400');
    }
}

function openCreate() {
    const sheet = document.getElementById('createSheet');
    if(sheet) sheet.classList.remove('hidden');
}
function closeCreate() {
    const sheet = document.getElementById('createSheet');
    if(sheet) sheet.classList.add('hidden');
}

function genQR() {
    const c = document.getElementById('qr');
    if(!c) return;
    c.classList.remove('hidden');
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = '#000';
    for (let i = 0; i < 300; i++) {
        ctx.fillRect(Math.random() * 160, Math.random() * 160, 3, 3);
    }
    const seal = document.getElementById('sealCode');
    if(seal) seal.innerText = 'TARIM-SEAL-' + Date.now();
    showToast('تم توليد الختم الميداني 🔏');
}

async function loadTasks(){
  try{
    const res = await fetch('/api/tasks');
    const data = await res.json();
    const container = document.getElementById('tasksContainer');
    if(!container) return;
    if(data.length===0){
      container.innerHTML='<div class="glass p-3 rounded-xl text-center text-[11px] text-gray-500">لا توجد مهام - جاهز لاستقبال الأوامر السيادية</div>';
    } else {
      container.innerHTML = data.map(t=>`<div class="glass p-3 rounded-xl flex justify-between"><span class="text-[12px]">${t.title||'مهمة'}</span><span class="text-cyan-400 text-[10px]">${t.priority||''}</span></div>`).join('');
    }
  }catch(e){}
}

function showToast(msg){
  let box = document.getElementById('toastBox');
  if(!box){
    box = document.createElement('div');
    box.id='toastBox';
    box.className='fixed top-16 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm space-y-2';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className='bg-[#10131f] border border-cyan-500/20 text-cyan-300 text-xs px-4 py-2.5 rounded-xl text-center';
  t.innerText=msg;
  box.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

function createPost(type){ closeCreate(); showToast('إنشاء '+type+' - قريبا سيادي'); }
function executeOrder(){ showToast('⚡ تم تنفيذ الأمر السيادي'); }
function scanAI(){ const r=document.getElementById('aiRes'); if(r) r.innerText='👁️ فريق الدعم AL - تم الفحص سيادي ✅'; showToast('تم فحص عين الذكاء'); }

if(socket){
  socket.on('newTask', ()=>loadTasks());
}
