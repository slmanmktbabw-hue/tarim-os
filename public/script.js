// V23 اوفلاين 100% بدون socket
let currentUser = localStorage.getItem('tarim_user') || null;
let liveStream = null;
let cameraFacing = 'environment';
let videoData = JSON.parse(localStorage.getItem('tarim_videos') || '[]');
let uploadFile = null;
let uploadType = null;

function showToast(msg){
  const box = document.getElementById('toastBox');
  const el = document.createElement('div');
  el.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold mb-2';
  el.innerText = msg;
  box.appendChild(el);
  setTimeout(()=>el.remove(),3000);
}

function updateStats(){
  document.getElementById('balance').innerText = localStorage.getItem('tarim_balance') || '0';
  document.getElementById('walletBalance').innerText = localStorage.getItem('tarim_balance') || '0.00';
  document.getElementById('followers').innerText = localStorage.getItem('tarim_followers') || '0';
  document.getElementById('following').innerText = localStorage.getItem('tarim_following') || '0';
  document.getElementById('likes').innerText = localStorage.getItem('tarim_likes') || '0';
  document.getElementById('postCount').innerText = localStorage.getItem('tarim_posts') || '0';
  document.getElementById('postsCount').innerText = localStorage.getItem('tarim_posts') || '0';
  document.getElementById('usageTime').innerText = localStorage.getItem('tarim_usage') || '0';
}

// بوابة الدخول اوفلاين
function registerAndLogin(){
  const phone = document.getElementById('userPhone').value || 'AL';
  const pass = document.getElementById('userPass').value || '1234';
  const savedPass = localStorage.getItem('tarim_pass_'+phone);
  if(savedPass && savedPass!== pass){ showToast('كلمة السر خطأ'); return; }
  currentUser = phone;
  localStorage.setItem('tarim_user', phone);
  if(!savedPass) localStorage.setItem('tarim_pass_'+phone, pass);
  document.getElementById('authGate').classList.add('hidden');
  loadUserData();
  updateStats();
  openTab('home', {target: document.querySelectorAll('nav button')[0]});
  showToast('مرحبا بك ' + phone);
}

function loadUserData(){
  if(currentUser){
    const name = localStorage.getItem('tarim_name') || 'الإمبراطور AL';
    document.getElementById('profileName').innerText = name;
    document.getElementById('accName').innerText = name;
    document.getElementById('accPhone').innerText = currentUser;
    document.body.style.background = localStorage.getItem('tarim_bg') || '#050b14';
    document.getElementById('privateAcc').checked = localStorage.getItem('tarim_private') === 'true';
    document.getElementById('allowComments').checked = localStorage.getItem('tarim_comments')!== 'false';
  }
}

// التنقل بين التبويبات
function openTab(name, event){
  document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));
  document.getElementById('tab-'+name)?.classList.remove('hidden');

  document.querySelectorAll('nav button').forEach(b=>{
    b.classList.remove('text-cyan-400');
    b.classList.add('text-gray-400');
  });
  event.target.closest('button').classList.add('text-cyan-400');
  event.target.closest('button').classList.remove('text-gray-400');

  if(name==='home') loadVideoFeed();
  if(name==='ai') loadAI();
  if(name==='support') loadSupport();
  if(name==='profile'){ genQR(); backToProfile(); }
  if(name==='inbox') document.getElementById('inboxBadge')?.classList.add('hidden');
  if(name==='create'){
    uploadFile = null; uploadType = null;
    const vid = document.getElementById('camPreview');
    if(vid.tagName === 'IMG') vid.outerHTML = `<video id="camPreview" autoplay muted playsinline class="w-full rounded-2xl bg-black aspect-[9/16] hidden"></video>`;
    else vid.classList.add('hidden');
  }
}

// 1. فيد الفيديو
function loadVideoFeed(){
  const feed = document.getElementById('videoFeed');
  if(videoData.length === 0){
    videoData = [{user:'AL', text:'النظام السيادي TARIM OS', likes:120}];
    localStorage.setItem('tarim_videos', JSON.stringify(videoData));
  }
  feed.innerHTML = videoData.map(v=>`
    <div class="h-screen w-full snap-start relative flex items-end p-4 bg-gradient-to-t from-black via-transparent to-black">
      <div class="w-full text-xs">
        <div class="font-black">@${v.user}</div>
        <div>${v.text}</div>
        <div class="mt-2">❤️ ${v.likes}</div>
      </div>
    </div>
  `).join('');
}

// 2. العمليات
async function startLive(){ document.getElementById('fullScreenCam').classList.remove('hidden'); document.getElementById('preLiveOverlay').style.display='flex'; }
function confirmStartLive(){ document.getElementById('preLiveOverlay').style.display='none'; showToast('🔴 تم بدء البث السيادي 8 دقائق'); }
function exitFullScreen(){ document.getElementById('fullScreenCam').classList.add('hidden'); }
function openMap(){ showToast('خريطة حضرموت Offline جاهزة'); }
function genQR(){ document.getElementById('qrcode').innerHTML='';new QRCode(document.getElementById('qrcode'), {text: "tarimos.org/"+currentUser, width:128, height:128});}

// 3. الانشاء
async function openCamera(facing){ cameraFacing = facing; showToast('الكاميرا: ' + facing); }
async function toggleCameraFacing(){ cameraFacing = cameraFacing === 'user'? 'environment' : 'user'; showToast('تم التبديل'); }
function createPost(type){ document.getElementById('postText').placeholder = 'اكتب ' + type + '...'; }

function handleUpload(input, type){
  const file = input.files[0];
  if(!file) return;
  uploadFile = file; uploadType = type;
  if(type === 'video'){
    const url = URL.createObjectURL(file);
    const vid = document.getElementById('camPreview');
    vid.src = url; vid.classList.remove('hidden'); vid.controls = true;
    showToast('تم رفع الفيديو: ' + file.name);
  }
  if(type === 'image'){
    const url = URL.createObjectURL(file);
    document.getElementById('camPreview').outerHTML = `<img id="camPreview" src="${url}" class="w-full rounded-2xl bg-black aspect-[9/16]">`;
    showToast('تم رفع الصورة: ' + file.name);
  }
}

function publishPost(){
  const txt = document.getElementById('postText').value;
  if(uploadFile || txt) {
    videoData.unshift({user:currentUser, text:txt + (uploadType? ` [${uploadType}]` : ''), likes:0});
    localStorage.setItem('tarim_videos', JSON.stringify(videoData));
    let posts = +localStorage.getItem('tarim_posts') || 0;
    localStorage.setItem('tarim_posts', posts+1);
    updateStats();
    showToast('تم النشر بنجاح');
    uploadFile=null; uploadType=null; document.getElementById('postText').value=''; document.getElementById('camPreview').classList.add('hidden');
  } else { showToast('اكتب نص او ارفع ملف'); }
}

// 4. الوارد
function sendMsg(){
  const txt = document.getElementById('chatIn').value;
  if(!txt) return;
  document.getElementById('chatLogs').innerHTML += `<div class="text-right bg-cyan-500/20 p-2 rounded-xl text-xs">${txt}</div>`;
  document.getElementById('chatIn').value='';
}

// 5. الملفات والاعدادات
function showSettingsPanel(id){
  document.getElementById('profile-main').classList.add('hidden');
  document.querySelectorAll('#tab-profile > div[id^="settings-"]').forEach(el=>el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
function backToProfile(){
  document.getElementById('profile-main').classList.remove('hidden');
  document.querySelectorAll('#tab-profile > div[id^="settings-"]').forEach(el=>el.classList.add('hidden'));
}

function openWallet(){ showSettingsPanel('settings-wallet'); }
function openActivities(){ showSettingsPanel('settings-activities'); }
function openOffline(){ showSettingsPanel('settings-offline'); }
function openMarket(){ showSettingsPanel('settings-market'); }
function openPromo(){ showSettingsPanel('settings-promo'); }
function openSettings(){ showSettingsPanel('settings-posts'); }
function openBgSettings(){ showSettingsPanel('settings-bg'); }
function openAccountSettings(){ showSettingsPanel('settings-account'); }
function openPrivacySettings(){ showSettingsPanel('settings-privacy'); }
function openEditProfile(){ showSettingsPanel('settings-edit-profile'); }

function shareProfile(){ navigator.clipboard.writeText('tarimos.org/'+currentUser); showToast('تم نسخ الرابط: tarimos.org/'+currentUser); }
function changeBg(color){ document.body.style.background = color; localStorage.setItem('tarim_bg', color); document.getElementById('toastProfile').classList.remove('hidden'); setTimeout(()=>document.getElementById('toastProfile').classList.add('hidden'), 2000); }
function addBalance(amount){ let bal = +localStorage.getItem('tarim_balance') || 0; localStorage.setItem('tarim_balance', bal+amount); updateStats(); showToast('تم اضافة ' + amount + ' USD'); }
function runPromo(type){
  if(type==='followers'){ let f=+localStorage.getItem('tarim_followers')||0; localStorage.setItem('tarim_followers', f+100); }
  if(type==='views'){ let v=+localStorage.getItem('tarim_views')||0; localStorage.setItem('tarim_views', v+1000); }
  updateStats(); showToast('تم تشغيل الترويج');
}
function togglePrivacy(){ localStorage.setItem('tarim_private', document.getElementById('privateAcc').checked); showToast('تم الحفظ'); }
function toggleComments(){ localStorage.setItem('tarim_comments', document.getElementById('allowComments').checked); showToast('تم الحفظ'); }
function saveProfile(){
  const newName = document.getElementById('editUsername').value;
  const newPass = document.getElementById('editPassword').value;
  if(newName){ localStorage.setItem('tarim_name', newName); document.getElementById('profileName').innerText = newName; document.getElementById('accName').innerText = newName; }
  if(newPass){ localStorage.setItem('tarim_pass_'+currentUser, newPass); }
  showToast('تم الحفظ'); backToProfile(); updateStats();
}
function logout(){ localStorage.removeItem('tarim_user'); location.reload(); }

// الذكاء
function loadAI(){ document.getElementById('aiLogs').innerHTML = '<div class="text-xs">مرحبا انا عين الذكاء. اسألني</div>' }
function sendAI(){ const txt = document.getElementById('aiIn').value; if(!txt) return; document.getElementById('aiLogs').innerHTML += `<div class="text-right bg-cyan-500/20 p-2 rounded-xl text-xs">${txt}</div>`; document.getElementById('aiIn').value=''; }

// الدعم
function loadSupport(){ document.getElementById('supportLogs').innerHTML = '<div class="text-xs text-yellow-400">فريق الدعم جاهز</div>' }
function sendSupport(){ const txt = document.getElementById('supportIn').value; if(!txt) return; document.getElementById('supportLogs').innerHTML += `<div class="text-right bg-yellow-500/20 p-2 rounded-xl text-xs">${txt}</div>`; document.getElementById('supportIn').value=''; }

// البث
function likeLive(){ document.getElementById('liveLikes').innerText = +document.getElementById('liveLikes').innerText + 1; }
function focusLiveComment(){ document.getElementById('liveCommentIn').focus(); }
function sendLiveComment(){ const txt = document.getElementById('liveCommentIn').value; if(!txt) return; document.getElementById('liveComments').innerHTML += `<div class="bg-black/50 p-1 rounded text-[10px]">${currentUser}: ${txt}</div>`; document.getElementById('liveCommentIn').value=''; }
function sendGift(){ showToast('تم ارسال هدية 🎁'); }
function shareLive(){ navigator.share? navigator.share({title:'TARIM OS', url:location.href}) : showToast('تم نسخ رابط البث'); }

let startTime = Date.now();
setInterval(()=>{ if(currentUser){ let usage = +localStorage.getItem('tarim_usage') || 0; localStorage.setItem('tarim_usage', usage+1); } }, 60000);

window.onload = () => {
  if(currentUser){
    document.getElementById('authGate').classList.add('hidden');
    loadUserData();
    updateStats();
    openTab('home', {target: document.querySelectorAll('nav button')[0]});
  }
}
