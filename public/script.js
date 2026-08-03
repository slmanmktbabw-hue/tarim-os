const socket = io();
let currentRoomId = null;
let userPhone = localStorage.getItem('tarim_phone') || 'AL';

// تسجيل الدخول
function registerAndLogin(){
  const phone = document.getElementById('userPhone').value || 'AL';
  const pass = document.getElementById('userPass').value;

  if(!phone) return showToast('ادخل اسم المستخدم');

  userPhone = phone;
  localStorage.setItem('tarim_phone', phone);

  socket.emit('register', {phone});

  document.getElementById('authGate').style.display = 'none';
  document.getElementById('profileAvatar').innerText = phone.slice(0,2).toUpperCase();
  showToast('مرحبا ' + phone);
}

// بدء البث
function startLive(){
  socket.emit('startLive');
  document.getElementById('fullScreenCam').classList.remove('hidden');
  document.getElementById('preLiveOverlay').classList.remove('hidden');
}

// تأكيد بدء البث
function confirmStartLive(){
  document.getElementById('preLiveOverlay').classList.add('hidden');
  showToast('البث بدأ');
}

// الخروج من البث
function exitFullScreen(){
  socket.emit('stopLive');
  document.getElementById('fullScreenCam').classList.add('hidden');
  document.getElementById('preLiveOverlay').classList.remove('hidden');
  document.getElementById('liveComments').innerHTML = '';
  document.getElementById('liveLikes').innerText = '0';
  document.getElementById('liveTimer').innerText = '00:00';
}

// لايك البث
function likeLive(){
  if(currentRoomId) socket.emit('liveLike', currentRoomId);
  let el = document.getElementById('liveLikes');
  el.innerText = parseInt(el.innerText)+1;
}

// ارسال هدية
function sendGift(){
  if(currentRoomId) socket.emit('sendGift', currentRoomId);
  showToast('تم ارسال هدية 🎁');
}

// فلتر
function applyFilter(){
  const filter = document.getElementById('liveFilter');
  filter.classList.toggle('opacity-0');
  showToast('تم تطبيق الفلتر');
}

// مشاركة
function shareLive(){
  navigator.clipboard.writeText(window.location.href + '?live=' + currentRoomId);
  showToast('تم نسخ رابط البث');
}

// ارسال تعليق البث
function sendLiveComment(){
  const input = document.getElementById('liveCommentIn');
  if(input.value.trim() && currentRoomId){
    socket.emit('liveComment', {roomId: currentRoomId, text: input.value});
    input.value = '';
  }
}

// انشاء QR
function generateQR(){
  fetch('/api/qr', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({phone: userPhone})
  })
.then(res => res.json())
.then(data => {
    document.getElementById('qrcode').innerHTML = '';
    new QRCode(document.getElementById('qrcode'), {
      text: data.qr,
      width: 128,
      height: 128,
      colorDark : "#00f0ff",
      colorLight : "#0f172a"
    });
    showToast('تم انشاء QR');
  });
}

// استقبال الاحداث من السيرفر
socket.on('liveStarted', ({roomId}) => {
  currentRoomId = roomId;
  showToast('البث جاهز');
});

socket.on('liveTimer', (time) => {
  document.getElementById('liveTimer').innerText = time;
});

socket.on('viewersUpdate', (count) => {
  document.getElementById('liveViewers').innerText = count;
});

socket.on('newLike', ({from}) => {
  showToast(from + ' اعجب بالبث ❤️');
});

socket.on('newComment', ({from, text}) => {
  const div = document.createElement('div');
  div.className = 'glass px-2 py-1 rounded text-[10px]';
  div.innerText = from + ': ' + text;
  document.getElementById('liveComments').appendChild(div);
  document.getElementById('liveComments').scrollTop = document.getElementById('liveComments').scrollHeight;
});

socket.on('newGift', ({from}) => {
  showToast(from + ' ارسل هدية 🎁');
});

socket.on('liveEnded', () => {
  showToast('انتهى البث');
  exitFullScreen();
});

// فتح التبويب
function openTab(tab, e){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  document.getElementById('tab-'+tab).classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b=>{
    b.classList.remove('text-cyan-400');
    b.classList.add('text-gray-400');
  });
  e.currentTarget.classList.remove('text-gray-400');
  e.currentTarget.classList.add('text-cyan-400');
}

// فتح الرئيسية تلقائي
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('tab-home').classList.remove('hidden');
  if(localStorage.getItem('tarim_phone')){
    document.getElementById('authGate').style.display = 'none';
  }
});
