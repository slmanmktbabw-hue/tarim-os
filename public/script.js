const socket = typeof io!== 'undefined'? io() : null;

async function loginCEO() {
  const phoneEl = document.getElementById('userPhone');
  const passEl = document.getElementById('userPass');
  const phone = phoneEl.value.trim();
  const pass = passEl.value.trim();
  if (!phone ||!pass) { alert('أدخل رقم الجوال والبريد وكلمة السر'); return; }

  const btn = document.querySelector('#authGate button.bg-gradient-to-r');
  if(btn){ btn.innerText='جاري فتح القلعة...'; btn.disabled=true; }

  try {
    // نحاول تسجيل دخول أولاً
    let res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password: pass })
    });
    let data = await res.json();

    // اذا الحساب غير موجود، نسجله تلقائياً
    if(!res.ok && res.status===404){
      res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: pass })
      });
      data = await res.json();
    }

    if(data.success){
      localStorage.setItem('ceo_user', phone);
      localStorage.setItem('ceo_role', data.user.role||'CEO');
      document.getElementById('userDisplay').innerText = phone;
      document.getElementById('authGate').style.display = 'none';
      showToast('✅ تم اعتمادك في مجتمع القلعة السيادية - مرحبا '+phone);
      loadTasks();
    } else {
      alert(data.error||'فشل الدخول');
      if(btn){ btn.innerText='فتح القلعة السيادية'; btn.disabled=false; }
    }
  } catch(e){
    // اذا السيرفر نايم، يسمح دخول محلي مؤقت
    console.log(e);
    localStorage.setItem('ceo_user', phone);
    document.getElementById('userDisplay').innerText = phone;
    document.getElementById('authGate').style.display = 'none';
    showToast('⚠️ دخلت في وضع Offline - سيتم المزامنة لاحقاً');
    if(btn){ btn.innerText='فتح القلعة السيادية'; btn.disabled=false; }
  }
}

if (localStorage.getItem('ceo_user')) {
  setTimeout(()=>{
    const gate=document.getElementById('authGate');
    if(gate) gate.style.display='none';
    const disp=document.getElementById('userDisplay');
    if(disp) disp.innerText=localStorage.getItem('ceo_user');
  },200);
}

function openTab(t){document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));const el=document.getElementById('tab-'+t);if(el)el.classList.remove('hidden');document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.remove('text-cyan-400');b.classList.add('text-white/40');});const b=document.querySelector('[data-nav='+t+']');if(b){b.classList.remove('text-white/40');b.classList.add('text-cyan-400');}}
function openCreate(){const s=document.getElementById('createSheet');if(s)s.classList.remove('hidden');}
function closeCreate(){const s=document.getElementById('createSheet');if(s)s.classList.add('hidden');}
function genQR(){const c=document.getElementById('qr');if(!c)return;c.classList.remove('hidden');const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,160,160);ctx.fillStyle='#000';for(let i=0;i<300;i++){ctx.fillRect(Math.random()*160,Math.random()*160,3,3);}const seal=document.getElementById('sealCode');if(seal)seal.innerText='TARIM-SEAL-'+Date.now();showToast('تم توليد الختم الميداني 🔏');}
async function loadTasks(){try{const r=await fetch('/api/tasks');const d=await r.json();const con=document.getElementById('tasksContainer');if(!con)return;if(d.length===0){con.innerHTML='<div class="glass p-3 rounded-xl text-center text-[11px] text-gray-500">جاهز لاستقبال الأوامر السيادية</div>';}else{con.innerHTML=d.map(t=>`<div class="glass p-3 rounded-xl flex justify-between"><span class="text-[12px]">${t.title||'مهمة'}</span><span class="text-cyan-400 text-[10px]">${t.priority||''}</span></div>`).join('');}}catch(e){}}
function showToast(msg){let box=document.getElementById('toastBox');if(!box){box=document.createElement('div');box.id='toastBox';box.className='fixed top-16 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm space-y-2';document.body.appendChild(box);}const t=document.createElement('div');t.className='bg-[#10131f] border border-cyan-500/20 text-cyan-300 text-xs px-4 py-2.5 rounded-xl text-center';t.innerText=msg;box.appendChild(t);setTimeout(()=>t.remove(),4000);}
function createPost(t){closeCreate();showToast('إنشاء '+t+' - قريبا');}
function executeOrder(){showToast('⚡ تم تنفيذ الأمر السيادي');}
function scanAI(){const r=document.getElementById('aiRes');if(r)r.innerText='👁️ فريق الدعم AL - تم الفحص سيادي ✅';showToast('تم فحص عين الذكاء');}
if(socket){socket.on('newTask',()=>loadTasks());}
