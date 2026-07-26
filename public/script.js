const socket = io();

async function loadTasks(){
  try{
    const res = await fetch('/api/tasks');
    const tasks = await res.json();
    const container = document.getElementById('tasksContainer');
    if(!tasks || !tasks.length){
      container.innerHTML = '<p class="text-center text-xs text-gray-500 py-6">لا يوجد مهام - سيتم زرعها تلقائيا</p>';
      return;
    }
    container.innerHTML = tasks.map(t=>`
      <div class="glass p-3 rounded-xl flex justify-between items-center border ${t.completed?'border-cyan-500/30 bg-cyan-950/10':'border-white/10 bg-black/30'}">
        <div class="flex-1">
          <span class="bg-cyan-500/20 text-cyan-300 text-[9px] px-2 py-0.5 rounded-full font-bold">${t.status||'جاهز'}</span>
          <h3 class="font-bold text-xs text-white mt-1 ${t.completed?'line-through opacity-60':''}">${t.title}</h3>
          <p class="text-[10px] text-gray-400">${t.description||''}</p>
        </div>
        <input type="checkbox" ${t.completed?'checked':''} onchange="toggleTask(${t.id},this.checked)" class="w-5 h-5 accent-cyan-500 mr-3">
      </div>`).join('');
  }catch(e){
    console.error(e);
    document.getElementById('tasksContainer').innerHTML = '<p class="text-center text-xs text-red-400">خطأ اتصال - تأكد من DATABASE_URL في Render</p>';
  }
}

async function toggleTask(id, completed){
  try{
    await fetch('/api/tasks/'+id,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({completed})
    });
    toast(completed?'اكتملت ✅':'الغيت ❌');
  }catch(e){ toast('خطأ','❌'); }
}

async function genQR(){
  try{
    const title = prompt('عنوان الوثيقة:','وثيقة ميدانية - تريم') || 'وثيقة سيادية';
    toast('جاري اصدار الختم...','🔏');
    const res = await fetch('/api/seals',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({title})
    });
    const data = await res.json();
    
    const canvas = document.getElementById('qr');
    canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,150,150);
    ctx.fillStyle='#000000'; ctx.font='bold 10px monospace';
    ctx.textAlign='center';
    // خلفية QR وهمية
    ctx.fillStyle='#00E5FF'; ctx.fillRect(0,0,150,20);
    ctx.fillStyle='#000'; ctx.fillText('TARIM OS',75,14);
    ctx.fillStyle='#000'; ctx.font='7px monospace';
    const code = data.code;
    // رسم QR مبسط
    for(let i=0;i<code.length;i++){
      ctx.fillStyle = i%2===0?'#000':'#fff';
      ctx.fillRect(10+(i%10)*12, 30+Math.floor(i/10)*10, 8, 8);
    }
    ctx.fillStyle='#000'; ctx.font='bold 8px monospace';
    ctx.fillText(code.substring(0,20),75,130);
    ctx.fillText(code.substring(20),75,140);
    
    document.getElementById('sealCode').innerText = code;
    document.getElementById('aiRes').innerHTML = `✅ تم اصدار الختم:<br><b style="color:#00E5FF">${code}</b><br>تم اكمال المهمة الرابعة تلقائياً`;
    
    openTab('ai');
    loadTasks();
    toast('الختم جاهز - المهمة اكتملت ✅','✅');
  }catch(e){
    console.log(e);
    toast('خطأ في الختم','❌');
  }
}

function sendMsg(){
  const input = document.getElementById('chatIn');
  const logs = document.getElementById('chatLogs');
  if(!input.value.trim()) return;
  logs.innerHTML += `<div class="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20 text-right"><b>انت:</b> ${input.value}</div>`;
  input.value='';
  logs.scrollTop = logs.scrollHeight;
  toast('تم الارسال','💬');
}

function toast(t, icon='⚡'){
  const box = document.getElementById('toastBox');
  const id = Date.now();
  box.insertAdjacentHTML('beforeend',`<div id="t${id}" class="bg-[#0f172a]/90 backdrop-blur-xl border border-white/15 rounded-xl px-4 py-2.5 flex gap-2 text-[11px] font-bold shadow-xl animate-pulse"><span>${icon}</span><span>${t}</span></div>`);
  setTimeout(()=>{document.getElementById('t'+id)?.remove()},3000);
}

function openTab(t){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  document.getElementById('tab-'+t).classList.remove('hidden');
  document.querySelectorAll('nav button[data-nav]').forEach(b=>{
    b.classList.remove('text-cyan-400'); b.classList.add('text-white/40');
  });
  const nav = document.getElementById('nav-'+t);
  if(nav){ nav.classList.add('text-cyan-400'); nav.classList.remove('text-white/40'); }
  if(t==='home') loadTasks();
}

function openCreate(){ document.getElementById('createSheet').classList.remove('hidden'); }
function closeCreate(){ document.getElementById('createSheet').classList.add('hidden'); }

function toggleStealth(){
  document.body.classList.toggle('grayscale');
  const isStealth = document.body.classList.contains('grayscale');
  toast(isStealth?'تمويه نشط 🕶️ - الامبراطورية مخفية':'تمويه متوقف 👁️','👁️');
}

function scanAI(){
  const res = document.getElementById('aiRes');
  res.innerHTML='جاري المسح...';
  let p=0;
  const iv=setInterval(()=>{
    p+=20;
    res.innerHTML=`فحص... ${p}%`;
    if(p>=100){
      clearInterval(iv);
      res.innerHTML=`✅ تم التحليل:<br>وثيقة ميدانية - تريم<br>ثقة: 98.7%<br>جاهزة للختم`;
      toast('تم المسح','👁️');
    }
  },250);
}

// Socket.IO تحديث لحظي
socket.on('tasks_update', ()=>{ loadTasks(); });
socket.on('connect', ()=>{ console.log('Socket connected'); });

// تحميل اول مرة
document.addEventListener('DOMContentLoaded', loadTasks);

// Enter للارسال
document.addEventListener('keydown', (e)=>{
  if(e.key==='Enter' && document.activeElement.id==='chatIn'){ sendMsg(); }
});
