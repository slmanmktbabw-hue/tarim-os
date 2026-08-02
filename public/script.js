let currentUser = localStorage.getItem('tarim_user');

function showToast(msg){
  const box = document.getElementById('toastBox');
  const el = document.createElement('div');
  el.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold mb-2';
  el.innerText = msg;
  box.appendChild(el);
  setTimeout(()=>el.remove(),2000);
}

function registerAndLogin(){
  const phone = document.getElementById('userPhone').value || 'AL';
  const pass = document.getElementById('userPass').value || '1234';
  localStorage.setItem('tarim_user', phone);
  document.getElementById('authGate').classList.add('hidden');
  openTab('home', {target: document.querySelectorAll('nav button')[4]});
  showToast('مرحبا بك ' + phone);
}

function openTab(name, event){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  document.getElementById('tab-'+name).classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('text-cyan-400'));
  event.target.closest('button').classList.add('text-cyan-400');
  if(name==='home') document.getElementById('videoFeed').innerHTML = `<div class="h-screen flex items-center justify-center">مرحبا ${currentUser}</div>`;
}

window.onload = () => {
  if(currentUser){
    document.getElementById('authGate').classList.add('hidden');
    openTab('home', {target: document.querySelectorAll('nav button')[4]});
  }
}
