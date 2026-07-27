function showToast(msg){
  const box=document.getElementById('toastBox');
  const div=document.createElement('div');
  div.className='glass p-3 rounded-xl text-xs text-center font-bold bg-cyan-500/20 text-cyan-300';
  div.innerText=msg; box.appendChild(div);
  setTimeout(()=>div.remove(),3000);
}
function openTab(id){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  const target=document.getElementById('tab-'+id);
  if(target) target.classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('text-cyan-400'));
  const active=document.querySelector(`button[data-nav="${id}"]`);
  if(active) active.classList.add('text-cyan-400');
}
function updateUserInterface(){
  const name=localStorage.getItem('ceo_name')||'الإمبراطور AL';
  document.querySelectorAll('.userNameDisplay').forEach(e=>e.innerText=name);
}
function loadTasks(){
  const container=document.getElementById('tasksContainer');
  if(!container) return;
  container.innerHTML='<div class="glass p-3 rounded-2xl text-xs">✅ النظام جاهز - محفظة OKX مرتبطة</div>';
}
function loginCEO(){
  const phone=document.getElementById('userPhone').value.trim();
  const pass=document.getElementById('userPass').value.trim();
  if(!phone){showToast('❌ أدخل الجوال');return}
  if(pass.length<8){showToast('🔒 كلمة السر 8+ خانات');return}
  localStorage.setItem('ceo_user',phone);
  localStorage.setItem('ceo_name','الإمبراطور '+phone);
  document.getElementById('authGate').style.display='none';
  updateUserInterface(); loadTasks();
  showToast('🏰 تم فتح القلعة - OKX مربوط');
}
function sendMsg(){
  const input=document.getElementById('chatIn');
  if(!input.value.trim()) return;
  if(window.socket) socket.emit('message',{text:input.value, user:localStorage.getItem('ceo_name')});
  const log=document.getElementById('chatLogs');
  const div=document.createElement('div');
  div.className='glass p-2 rounded-xl'; div.innerText=input.value; log.appendChild(div);
  input.value='';
}
function handleInner(t){showToast('🚀 فتح: '+t)}
function genQR(){showToast('🔏 QR الخاص بك: TARIM-'+(localStorage.getItem('ceo_user')||'AL'))}
function changeUserBackground(){
  const url=document.getElementById('bgUrlInput').value;
  if(url) document.getElementById('tab-home').style.backgroundImage=`url('${url}')`;
}
let socket;
try{socket=io()}catch(e){}
window.addEventListener('load',()=>{
  if(localStorage.getItem('ceo_user')){
    document.getElementById('authGate').style.display='none';
    updateUserInterface(); loadTasks();
  }
});
