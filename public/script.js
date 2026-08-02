let currentUser = localStorage.getItem('tarim_user') || 'AL';
let videoData = JSON.parse(localStorage.getItem('tarim_videos') || '[{"user":"AL","text":"النظام السيادي TARIM OS","likes":120}]');

function showToast(msg){const box=document.getElementById('toastBox');const el=document.createElement('div');el.className='bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold mb-2';el.innerText=msg;box.appendChild(el);setTimeout(()=>el.remove(),2000);}
function updateStats(){document.getElementById('balance').innerText=localStorage.getItem('tarim_balance')||'0';document.getElementById('walletBalance').innerText=localStorage.getItem('tarim_balance')||'0.00';document.getElementById('followers').innerText=localStorage.getItem('tarim_followers')||'0';document.getElementById('following').innerText=localStorage.getItem('tarim_following')||'0';document.getElementById('likes').innerText=localStorage.getItem('tarim_likes')||'0';document.getElementById('usageTime').innerText=localStorage.getItem('tarim_usage')||'0';}
function openTab(name,event){document.querySelectorAll('main').forEach(m=>m.classList.add('hidden'));document.getElementById('tab-'+name).classList.remove('hidden');document.querySelectorAll('nav button').forEach(b=>b.classList.remove('text-cyan-400'));event.target.closest('button').classList.add('text-cyan-400');if(name==='home')loadVideoFeed();if(name==='profile')updateStats();}
function loadVideoFeed(){document.getElementById('videoFeed').innerHTML=videoData.map(v=>`<div class="h-screen w-full snap-start relative flex items-end p-4"><div class="w-full text-xs"><div class="font-black">@${v.user}</div><div>${v.text}</div><div class="mt-2">❤️ ${v.likes}</div></div></div>`).join('');}
function startLive(){document.getElementById('fullScreenCam').classList.remove('hidden');}
function confirmStartLive(){document.getElementById('fullScreenCam').classList.add('hidden');showToast('🔴 تم بدء البث 8 دقائق');}
function exitFullScreen(){document.getElementById('fullScreenCam').classList.add('hidden');}
function openMap(){showToast('خريطة حضرموت Offline');}
function genQR(){document.getElementById('qrcode').innerHTML='';new QRCode(document.getElementById('qrcode'),{text:"tarimos.org/"+currentUser,width:128,height:128});}
async function openCamera(f){showToast('الكاميرا: '+f);}
async function toggleCameraFacing(){showToast('تم التبديل');}
function createPost(t){document.getElementById('postText').placeholder='اكتب '+t+'...';}
function handleUpload(input){showToast('تم رفع: '+input.files[0].name);}
function publishPost(){const txt=document.getElementById('postText').value;if(txt){videoData.unshift({user:currentUser,text:txt,likes:0});localStorage.setItem('tarim_videos',JSON.stringify(videoData));let p=+localStorage.getItem('tarim_posts')||0;localStorage.setItem('tarim_posts',p+1);updateStats();showToast('تم النشر');document.getElementById('postText').value='';}}
function sendMsg(){showToast('تم الارسال');document.getElementById('chatIn').value='';}
function showSettingsPanel(id){document.querySelectorAll('#tab-profile > div[id^="settings-"]').forEach(el=>el.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');}
function backToProfile(){document.querySelectorAll('#tab-profile > div[id^="settings-"]').forEach(el=>el.classList.add('hidden'));}
function openWallet(){showSettingsPanel('settings-wallet');}
function openActivities(){showSettingsPanel('settings-activities');}
function openBgSettings(){showSettingsPanel('settings-bg');}
function openAccountSettings(){showSettingsPanel('settings-account');}
function openPrivacySettings(){showSettingsPanel('settings-privacy');}
function changeBg(c){document.body.style.background=c;localStorage.setItem('tarim_bg',c);showToast('تم تغيير الخلفية');}
function addBalance(a){let b=+localStorage.getItem('tarim_balance')||0;localStorage.setItem('tarim_balance',b+a);updateStats();showToast('تم اضافة '+a+' USD');}
function togglePrivacy(){localStorage.setItem('tarim_private',document.getElementById('privateAcc').checked);showToast('تم الحفظ');}
function logout(){localStorage.removeItem('tarim_user');location.reload();}
setInterval(()=>{if(currentUser){let u=+localStorage.getItem('tarim_usage')||0;localStorage.setItem('tarim_usage',u+1);}},60000);
window.onload=()=>{updateStats();openTab('home',{target:document.querySelectorAll('nav button')[4]});}
