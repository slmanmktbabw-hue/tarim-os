const socket = io();
let currentUser = 'AL';
let liveStream = null;
let likes = 0;
let filterOn = false;
let liveSeconds = 0;
let liveInterval;

function startLive() {
  document.getElementById('fullScreenCam').classList.remove('hidden');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
 .then(stream => {
    liveStream = stream;
    document.getElementById('fullCamVideo').srcObject = stream;
  }).catch(err => showToast('اسمح بالكاميرا والمايك يا ملك'));
}

function confirmStartLive(){
  document.getElementById('preLiveOverlay').style.display='none';
  showToast('🔴 تم بدء البث 8 دقائق');
  liveSeconds=0;
  liveInterval = setInterval(()=>{
    liveSeconds++;
    let m = String(Math.floor(liveSeconds/60)).padStart(2,'0');
    let s = String(liveSeconds%60).padStart(2,'0');
    document.getElementById('liveTimer').innerText = `${m}:${s}`;
    if(liveSeconds >= 480){ exitFullScreen(); showToast('انتهى البث 8 دقائق'); }
  },1000);
}

function exitFullScreen(){
  document.getElementById('fullScreenCam').classList.add('hidden');
  document.getElementById('preLiveOverlay').style.display='flex';
  clearInterval(liveInterval);
  if(liveStream){ liveStream.getTracks().forEach(t=>t.stop()); liveStream=null; }
}

function likeLive(){
  likes++;
  document.getElementById('liveLikes').innerText = likes;
  const heart = document.createElement('div');
  heart.innerText='❤️';
  heart.className='absolute bottom-20 right-10 text-2xl animate-bounce z-20';
  document.getElementById('fullScreenCam').appendChild(heart);
  setTimeout(()=>heart.remove(),1000);
  socket.emit('like_live', {user: currentUser});
}

function sendLiveComment(){
  const input = document.getElementById('liveCommentIn');
  const txt = input.value.trim(); if(!txt) return;
  document.getElementById('liveComments').innerHTML += `<div class="bg-black/60 p-1.5 rounded-full px-3">${currentUser}: ${txt}</div>`;
  input.value='';
  document.getElementById('liveComments').scrollTop = document.getElementById('liveComments').scrollHeight;
  socket.emit('comment_live', {user: currentUser, text: txt});
}

function sendGift(){
  const gifts = ['🎁','❤️','👑','🚀'];
  const gift = gifts[Math.floor(Math.random()*gifts.length)];
  document.getElementById('liveComments').innerHTML += `<div class="bg-yellow-500/30 p-1.5 rounded-full px-3">🎁 ${currentUser} ارسل ${gift}</div>`;
  fetch('/api/wallet/gift', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({from: currentUser, to: 'AL', gift})});
  showToast('تم ارسال '+gift);
}

function applyFilter(){
  filterOn =!filterOn;
  document.getElementById('liveFilter').style.opacity = filterOn? '1' : '0';
  showToast(filterOn? 'تم تفعيل الفلتر السيادي 🎨' : 'تم إيقاف الفلتر');
}

function shareLive(){
  if(navigator.share) navigator.share({title:'TARIM OS LIVE', url: location.href});
  else { navigator.clipboard.writeText(location.href); showToast('تم نسخ رابط البث'); }
}

socket.on('like_live', (data) => {
  likes++;
  document.getElementById('liveLikes').innerText = likes;
})
socket.on('comment_live', (data) => {
  document.getElementById('liveComments').innerHTML += `<div class="bg-black/60 p-1.5 rounded-full px-3">${data.user}: ${data.text}</div>`;
  document.getElementById('liveComments').scrollTop = document.getElementById('liveComments').scrollHeight;
})
socket.on('viewers_count', (count) => {
  document.getElementById('liveViewers').innerText = count;
})

function openTab(tab, e){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  document.getElementById('tab-'+tab).classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('text-cyan-400'));
  if(e) e.currentTarget.classList.add('text-cyan-400');
}
function showToast(msg){
  const box = document.getElementById('toastBox');
  const div = document.createElement('div');
  div.className = 'bg-cyan-500 text-black px-4 py-2 rounded-full text-xs font-bold mb-2 animate-pulse';
  div.innerText = msg;
  box.appendChild(div);
  setTimeout(()=>div.remove(), 3000);
}
function registerAndLogin(){
  currentUser = document.getElementById('userPhone').value || 'AL';
  document.getElementById('authGate').classList.add('hidden');
  openTab('home');
  socket.emit('register', {phone: currentUser});
}
