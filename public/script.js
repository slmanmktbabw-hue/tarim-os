const socket = io();
let posts = [];
let stream = null;
let facing = 'user';
let currentUser = localStorage.getItem('tarim_user') || 'AL';
let mediaRecorder, chunks = [];
let liveLikeCount = 0;

// التشغيل الاول
if (localStorage.getItem('tarim_user')) {
  document.getElementById('authGate').style.display = 'none';
  openTab('home'); // يفتح فيد الفيديو مباشرة
} else {
  loadPosts()
}
setInterval(updateWalletUI, 3000);
updateWalletUI();

// 1. فتح التبويبات - مطابق للشريط الجديد 5 ازرار
function openTab(name) {
  document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
  document.getElementById('tab-' + name)?.classList.remove('hidden');

  // تفعيل الزر في الشريط
  document.querySelectorAll('nav button').forEach(b => {
    b.classList.remove('text-cyan-400');
    b.classList.add('text-gray-400');
  });
  event?.target.closest('button')?.classList.add('text-cyan-400');
  event?.target.closest('button')?.classList.remove('text-gray-400');

  if (name === 'home') loadVideoFeed(); // اهم شي
  if (name === 'ai') loadAI();
  if (name === 'support') loadSupport();
  if (name === 'profile') genQR();
}

// 2. تسجيل الدخول
function registerAndLogin() {
  const u = document.getElementById('userPhone').value || 'AL';
  const p = document.getElementById('userPass').value;
  if (p.length < 3) return toast('كلمة المرور قصيرة');
  localStorage.setItem('tarim_user', u);
  currentUser = u;
  document.getElementById('authGate').style.display = 'none';
  toast('أهلاً ' + u + ' - النظام جاهز 🌍');
  openTab('home');
  updateWalletUI();
}

// 3. فيد الفيديو - تيك توك
async function loadVideoFeed() {
  await loadPosts();
  const box = document.getElementById('videoFeed'); if (!box) return;
  const videos = posts.filter(p => p.type === 'video' || p.media?.includes('.mp4') || p.media?.includes('.webm'));

  box.innerHTML = videos.length ? videos.map(p => `
    <div class="h-screen w-full relative snap-start">
      <video src="${p.media}" autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover"></video>
      <div class="absolute right-3 bottom-24 flex-col gap-5 items-center">
        <button onclick="likeVideo(this)" class="flex flex-col items-center"><span class="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center text-2xl">❤️</span><span class="text-[10px]">${p.likes || 0}</span></button>
        <button class="flex flex-col items-center"><span class="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center text-2xl">💬</span></button>
        <button onclick="sendPaidGift('🎁')" class="flex flex-col items-center"><span class="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-2xl">🎁</span></button>
        <button onclick="shareVideo('${p.media}')" class="flex flex-col items-center"><span class="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center text-xl">↗️</span></button>
      </div>
      <div class="absolute bottom-20 left-3 right-16 text-xs"><b>@${p.user || 'AL'}</b><p class="mt-1">${p.text || ''}</p></div>
    </div>
  `).join('') : `<div class="flex items-center justify-center h-full text-gray-400">ابدأ اول بث 🔴</div>`;
}

function likeVideo(btn) {
  const countSpan = btn.querySelector('span:last-child');
  countSpan.innerText = parseInt(countSpan.innerText) + 1;
}

function shareVideo(url) {
  navigator.share ? navigator.share({ title: 'TARIM OS', url }) : navigator.clipboard.writeText(url);
  toast('تم نسخ رابط الفيديو');
}

// 4. تحميل المنشورات
async function loadPosts() {
  try {
    const res = await fetch('/api/posts');
    posts = await res.json();
  } catch (e) { }
}

// 5. النشر
async function publishPost(mediaUrl = null, type = 'text') {
  const text = document.getElementById('postText').value;
  if (!text && !mediaUrl) return toast('اكتب شي');
  const post = { user: currentUser, text, media: mediaUrl, type, likes: 0, time: Date.now() };
  await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post) });
  socket.emit('new_post', post);
  document.getElementById('postText').value = '';
  toast('نشر عالمي 🌍');
  exitFullScreen();
  openTab('home'); // يرجع للفيديو
  loadVideoFeed();
}

// 6. الكاميرا والبث
function enterFullScreen() { const fs = document.getElementById('fullScreenCam'); const fv = document.getElementById('fullCamVideo'); const pv = document.getElementById('camPreview'); if (!fs || !fv) return; fs.classList.remove('hidden'); document.querySelector('header').style.display = 'none'; document.querySelector('nav').style.display = 'none'; if (pv.srcObject) fv.srcObject = pv.srcObject; document.getElementById('preLiveOverlay')?.classList.remove('hidden') }
function exitFullScreen() { document.getElementById('fullScreenCam')?.classList.add('hidden'); document.getElementById('preLiveOverlay')?.classList.add('hidden'); document.querySelector('header').style.display = 'flex'; document.querySelector('nav').style.display = 'flex'; if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop(); if (stream) stream.getTracks().forEach(t => t.stop()); document.getElementById('camPreview')?.classList.add('hidden') }
async function openCamera(f) { facing = f; const v = document.getElementById('camPreview'); v.classList.remove('hidden'); try { if (stream) stream.getTracks().forEach(t => t.stop()); stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: f }, audio: true }); v.srcObject = stream; enterFullScreen() } catch (e) { toast('الكاميرا مرفوضة') } }
function toggleCameraFacing() { openCamera(facing === 'user' ? 'environment' : 'user') }
function startLive() { openCamera('user') }
function confirmStartLive() { const overlay = document.getElementById('preLiveOverlay'); if (overlay) overlay.classList.add('hidden'); const v = document.getElementById('camPreview'); if (!v.srcObject) return toast('افتح الكاميرا أولاً'); mediaRecorder = new MediaRecorder(v.srcObject, { mimeType: 'video/webm' }); chunks = []; mediaRecorder.ondataavailable = e => chunks.push(e.data); mediaRecorder.onstop = async () => { const blob = new Blob(chunks, { type: 'video/webm' }); const reader = new FileReader(); reader.onloadend = async () => { const base64 = reader.result; const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoBase64: base64, name: currentUser + '_' + Date.now() }) }); const data = await res.json(); if (data.url) publishPost(data.url, 'video') }; reader.readAsDataURL(blob) }; mediaRecorder.start(); toast('🔴 بدأ البث - الجمهور يربح معك!'); setTimeout(() => { if (mediaRecorder?.state !== 'inactive') mediaRecorder.stop() }, 480000) }
function likeLive() { liveLikeCount++; const el = document.getElementById('liveLikes'); if (el) el.innerText = liveLikeCount; socket.emit('live_like', { count: liveLikeCount }) }
function focusLiveComment() { document.getElementById('liveCommentIn').focus() }
function sendLiveComment() { const inp = document.getElementById('liveCommentIn'); if (!inp.value) return; const box = document.getElementById('liveComments'); box.innerHTML += `<div class="bg-black/40 rounded-full px-2 py-1"><b>${currentUser}:</b> ${inp.value}</div>`; socket.emit('live_comment', { user: currentUser, text: inp.value }); inp.value = '' }
function applyFilter() { toast('✨ فلتر مفعل'); document.getElementById('camPreview').style.filter = 'brightness(1.2)'; document.getElementById('fullCamVideo').style.filter = 'brightness(1.2)' }
function createPost(t) { openTab('create'); toast('اخترت: ' + t) }

// 7. الذكاء والدعم
function loadAI() { document.getElementById('aiLogs').innerHTML = `<div class="glass p-2 rounded-xl text-xs">👁️ عين الذكاء: أهلاً ${currentUser}</div>` }
function sendAI() { const inp = document.getElementById('aiIn'); if (!inp.value) return; const txt = inp.value; const logs = document.getElementById('aiLogs'); logs.innerHTML += `<div class="text-right text-xs mt-2"><b>أنت:</b> ${txt}</div>`; setTimeout(() => { logs.innerHTML += `<div class="glass p-2 rounded-xl text-xs mt-1">👁️ الذكاء: تم تحليل "${txt}" عالمياً</div>`; logs.scrollTop = logs.scrollHeight }, 400); inp.value = '' }
function loadSupport() { document.getElementById('supportLogs').innerHTML = `<div class="glass p-2 rounded-xl text-xs">🛡️ الدعم جاهز يا ${currentUser}؟</div>` }
async function sendSupport() { const inp = document.getElementById('supportIn'); if (!inp.value) return; const txt = inp.value; const logs = document.getElementById('supportLogs'); logs.innerHTML += `<div class="text-right text-xs mt-2"><b>أنت:</b> ${txt}</div>`; try { const res = await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: currentUser, text: txt }) }); const data = await res.json(); logs.innerHTML += `<div class="glass p-2 rounded-xl text-xs mt-1 bg-yellow-500/10">🛡️ الدعم: ${data.reply}</div>` } catch (e) { logs.innerHTML += `<div class="glass p-2 rounded-xl text-xs mt-1 bg-yellow-500/10">🛡️ تم فتح تذكرة</div>` } inp.value = ''; logs.scrollTop = logs.scrollHeight }

// 8. الملفات والادوات
function genQR() { const qr = document.getElementById('qrcode'); if (!qr) return; qr.innerHTML = ''; new QRCode(qr, { text: 'https://tarimos.org/u/' + currentUser, width: 150, height: 150 }) }
function openMap() { toast('🗺️ خريطة حضرموت'); window.open('https://maps.google.com/?q=Hadhramaut', '_blank') }
function changeBg() { document.body.style.background = document.body.style.background === '#050b14' ? '#1a1030' : '#050b14'; toast('🎨 تم تغيير الخلفية') }
function sendMsg() { const inp = document.getElementById('chatIn'); if (!inp.value) return; const logs = document.getElementById('chatLogs'); logs.innerHTML += `<div class="glass p-2 rounded-xl text-xs text-right"><b>${currentUser}:</b> ${inp.value}</div>`; inp.value = ''; logs.scrollTop = logs.scrollHeight }
function toast(m) { const b = document.getElementById('toastBox'); const t = document.createElement('div'); t.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold mb-2 shadow-lg'; t.innerText = m; b.appendChild(t); setTimeout(() => t.remove(), 3000) }
function openWallet() { fetch('/api/wallet/' + currentUser).then(r => r.json()).then(d => { const box = document.createElement('div'); box.className = 'fixed inset-0 z-[800] bg-black/80 flex items-center justify-center p-4'; box.innerHTML = `<div class="glass rounded-3xl p-6 w-full max-w-sm text-center space-y-3 border-cyan-500/50"><div class="text-xl font-black text-cyan-400">💰 محفظة الجمهور</div><div class="text-xs">رصيدك: <b class="text-green-400">${d.balance}</b></div><div class="text-xs">أرباحك: <b class="text-yellow-400">${d.earned}</b></div><div class="text-[10px] font-mono break-all bg-black/50 p-2 rounded">OKX: 0x53...c0af6</div><button onclick="this.parentElement.parentElement.remove()" class="w-full bg-cyan-500 text-black font-black py-2 rounded-xl text-xs">إغلاق</button></div>`; document.body.appendChild(box) }) }
function openActivities() { const box = document.createElement('div'); box.className = 'fixed inset-0 z-[800] bg-black/80 flex items-center justify-center p-4'; box.innerHTML = `<div class="glass rounded-3xl p-6 w-full max-w-sm text-center space-y-3"><div class="font-black text-cyan-400">📊 مركز الأنشطة</div><div class="text-xs">منشوراتك: ${posts.length}</div><div class="text-xs">إعجابات LIVE: ${liveLikeCount}</div><button onclick="this.parentElement.parentElement.remove()" class="w-full bg-cyan-500 text-black font-black py-2 rounded-xl text-xs">إغلاق</button></div>`; document.body.appendChild(box) }
function openOffline() { const off = JSON.parse(localStorage.getItem('offline_videos') || '[]'); const box = document.createElement('div'); box.className = 'fixed inset-0 z-[800] bg-black/80 flex items-center justify-center p-4'; box.innerHTML = `<div class="glass rounded-3xl p-6 w-full max-w-sm space-y-3"><div class="font-black text-cyan-400">📥 فيديوهات بدون نت</div><div class="text-xs max-h-40 overflow-y-auto">${off.length ? off.map(u => `<video src="${u}" controls class="w-full rounded-xl mt-2 h-20"></video>`).join('') : 'لا يوجد'}</div><button onclick="this.parentElement.parentElement.remove()" class="w-full bg-cyan-500 text-black font-black py-2 rounded-xl text-xs">إغلاق</button></div>`; document.body.appendChild(box) }
function openMarket() { toast('🏪 المجموعة التجارية قريباً') }
function openPromo() { toast('📢 الترويج') }
function openSettings() { toast('⚙️ الإعدادات') }
function shareProfile() { navigator.share ? navigator.share({ title: 'AL - TARIM OS', url: 'https://tarimos.org/u/' + currentUser }) : toast('🔗 تم نسخ رابط ملفك') }
async function sendPaidGift(gift) { const res = await fetch('/api/wallet/gift', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: currentUser, to: 'AL', gift }) }); const d = await res.json(); if (d.error) return toast(d.error); toast(`أرسلت ${gift} - ربحت ${d.earned} - رصيدك ${d.yourBalance}`); updateWalletUI() }
function sendGift() { sendPaidGift('🎁') }
function updateWalletUI() { fetch('/api/wallet/' + currentUser).then(r => r.json()).then(d => { const b = document.getElementById('myBalance'); if (b) b.innerText = d.balance; const e = document.getElementById('myEarn'); if (e) e.innerText = d.earned; const bs = document.getElementById('balanceShow'); if (bs) bs.innerText = d.balance }).catch(() => { }) }

// 9. السوكت
socket.on('broadcast_post', p => { posts.unshift(p); if (document.getElementById('tab-home').classList.contains('hidden') === false) loadVideoFeed() });
socket.on('live_like', d => { const el = document.getElementById('liveLikes'); if (el) el.innerText = d.count });
socket.on('live_comment', d => { const box = document.getElementById('liveComments'); if (box) box.innerHTML += `<div class="bg-black/40 rounded-full px-2 py-1"><b>${d.user}:</b> ${d.text}</div>` });
