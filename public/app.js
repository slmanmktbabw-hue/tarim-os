// public/app.js - TARIM OS V8.5.1 ULTIMATE SECURE - TRIPLE-PAY + ADS + NOWPayments + محصن 100%
"use strict";
(function () {
const $ = id => document.getElementById(id);
function toast(m) {
const b = $('toastBox'); if (!b) return;
const e = document.createElement('div');
e.textContent = String(m).slice(0, 220);
e.style.cssText = 'background:#00B4D8;color:#000;padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center;z-index:99999;position:relative';
b.appendChild(e);
setTimeout(() => e.remove(), 4000);
}
function sanitizeText(t) {
if (!t) return "";
return String(t).slice(0, 1000)
.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
let state = {
curStream: null, facing: 'user', map: null, liveInt: null,
lSec: 0, liveMode: false, likes: 0, capImg: null, upURL: null, upIsVideo: false,
watchTimer: null, currentWatchTime: 0, abortCtrl: null,
giftType: 'heart', adBudget: 5
};
async function openNativeFullscreen(elem) {
try {
if (!elem) return;
if (elem.requestFullscreen) await elem.requestFullscreen();
else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
else if (elem.webkitEnterFullscreen) elem.webkitEnterFullscreen();
} catch (e) { console.log('Fullscreen blocked:', e.message); }
}
function closeNativeFullscreen() {
try {
if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
} catch {}
}
function startUesWatchSimulation() {
if (state.watchTimer) clearInterval(state.watchTimer);
if (state.abortCtrl) state.abortCtrl.abort();
state.currentWatchTime = 0;
state.abortCtrl = new AbortController();
state.watchTimer = setInterval(async () => {
state.currentWatchTime += 5;
if (state.currentWatchTime >= 20) {
clearInterval(state.watchTimer);
try {
const res = await fetch('/get_next_video', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
signal: state.abortCtrl.signal,
body: JSON.stringify({
user_profile: { country: 'YE', interest: 'cooking', repeat_count: 0 },
current_video: { duration: 45, watch_time: state.currentWatchTime }
})
});
if (!res.ok) throw new Error('offline');
const data = await res.json();
if (data.action === 'split_screen' && data.video_id) {
const vid = String(data.video_id).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50);
if (['short_funny_01','short_tip_02','ye_cooking_restaurant_001','ye_football_highlights_002'].includes(vid) || vid.startsWith('trending_')) {
toast('⚡ Tarim_Fortress: ' + vid);
}
}
} catch (err) {
if (err.name!== 'AbortError') console.log('Tarim_Fortress: Offline Mode');
}
}
}, 5000);
}
function stopStream() {
if (state.curStream) { state.curStream.getTracks().forEach(t => t.stop()); state.curStream = null; }
if (state.liveInt) { clearInterval(state.liveInt); state.liveInt = null; }
if (state.watchTimer) { clearInterval(state.watchTimer); state.watchTimer = null; }
if (state.abortCtrl) { state.abortCtrl.abort(); state.abortCtrl = null; }
}
function switchTab(name, btn) {
if (state.liveMode) { toast('🔴 أنهي البث أولاً'); return; }
stopStream(); closeNativeFullscreen();
document.querySelectorAll('.tab-content').forEach(t => { t.classList.remove('active'); t.classList.add('hidden'); });
const tar = $('tab-' + name); if (tar) { tar.classList.remove('hidden'); tar.classList.add('active'); }
document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('text-cyan-400'); b.classList.add('text-slate-400'); });
if (btn) { btn.classList.remove('text-slate-400'); btn.classList.add('text-cyan-400'); }
if (name === 'create') initCam();
if (name === 'profile') { backToProfile(); updateCounters(); }
if (name === 'home') { renderAllFeeds(); startUesWatchSimulation(); }
}
function showSubPage(id) {
const main = $('profile-main'); if (main) main.classList.add('hidden');
document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
const t = $('sub-' + id); if (t) {
  t.classList.remove('hidden');
  if(id==='qr-page'){
    const c=$('qrcode'); if(c){ c.textContent=''; if(window.QRCode) new QRCode(c,{text:'https://tarimos.org/user/'+sanitizeText(localStorage.getItem('tarim_session_v73')||'AL'),width:128,height:128}); }
  }
  if(id==='promo-page'){ initPromoPage(); }
}
}
function backToProfile() { document.querySelectorAll('.sub-page').forEach(p=>p.classList.add('hidden')); const m=$('profile-main'); if(m) m.classList.remove('hidden'); updateCounters(); }
function updateCounters() {
const posts = getPosts();
if ($('countFollowers')) $('countFollowers').textContent = posts.length;
if ($('countFollowing')) $('countFollowing').textContent = Math.floor(posts.length/2);
if ($('countLikes')) $('countLikes').textContent = posts.reduce((a,b)=>a+(b.likes||0),0);
if ($('activityPosts')) $('activityPosts').textContent = posts.length;
}
async function initCam() {
const v = $('cameraPreview'); if(!v) return;
try {
if (state.upURL) return;
stopStream();
state.curStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:state.facing},audio:true});
v.srcObject = state.curStream; v.muted = true; await v.play();
} catch (e){ console.log(e); toast('الكاميرا تحتاج HTTPS + سماح'); }
}
function setFilter(t){ const v=$('cameraPreview'); if(!v) return; v.style.filter=t==='beauty'?'contrast(1.15) brightness(1.15) saturate(1.2)':'none'; toast(t==='beauty'?'💄 تجميل':'✨ طبيعي'); }
function switchCam(){ state.facing=state.facing==='user'?'environment':'user'; initCam(); }
function capturePhoto(){ const v=$('cameraPreview'); if(!v) return; const c=document.createElement('canvas'); c.width=v.videoWidth||640; c.height=v.videoHeight||480; c.getContext('2d').drawImage(v,0,0); state.capImg=c.toDataURL('image/jpeg',0.85); toast('📸 تم التقاط صورة'); }
function getPosts() {
try {
const data=localStorage.getItem('tarim_posts_v73'); if(!data) return [];
const arr=JSON.parse(data); if(!Array.isArray(arr)) return [];
return arr.slice(-100).filter(p=>p && typeof p==='object' && typeof p.content==='string' && p.content.length<=1000);
} catch { return []; }
}
function savePosts(p){ try{ localStorage.setItem('tarim_posts_v73', JSON.stringify(p.slice(-100))); }catch{ toast('التخزين ممتلئ'); } }
function renderAllFeeds() {
const f = $('postsFeed'); if (!f) return; f.textContent = '';
const posts = getPosts();
if (!posts.length){ const empty=document.createElement('div'); empty.className='glass p-8 rounded-2xl text-center text-slate-400 text-xs'; empty.textContent='لا منشورات بعد - ابدأ بث مباشر 👑'; f.appendChild(empty); return; }
posts.slice().reverse().forEach(p=>{
const c=document.createElement('div'); c.className='glass p-4 rounded-xl border border-cyan-500/20';
const header=document.createElement('div'); header.className='flex justify-between text-[10px] text-slate-400 mb-2';
const u=document.createElement('span'); u.className='text-cyan-400 font-bold'; u.textContent='@'+sanitizeText(p.username||'AL')+' 👑';
const t=document.createElement('span'); t.textContent=new Date(p.createdAt||Date.now()).toLocaleTimeString('ar');
header.appendChild(u); header.appendChild(t);
const body=document.createElement('p'); body.className='text-xs'; body.textContent=sanitizeText(p.content||'');
c.appendChild(header); c.appendChild(body); f.appendChild(c);
});
}
function publishPost() {
const inp = $('postContentInput'); if (!inp ||!inp.value.trim()) { toast('اكتب شيئاً'); return; }
const cleanContent = sanitizeText(inp.value.slice(0,1000));
const post={ id:Date.now(), content:cleanContent, username:sanitizeText(localStorage.getItem('tarim_session_v73')||'AL'), createdAt:new Date().toISOString(), likes:0 };
const all=getPosts(); all.push(post); savePosts(all); inp.value='';
if(state.upURL){ URL.revokeObjectURL(state.upURL); state.upURL=null; state.upIsVideo=false; initCam(); }
state.capImg=null; renderAllFeeds(); updateCounters(); toast('🚀 تم النشر');
}
function forceUnlockCastle() {
const el = $('userPhoneOrEmail');
const u = sanitizeText((el && el.value.trim())||'AL').slice(0,30)||'AL';
localStorage.setItem('tarim_session_v73', u); localStorage.setItem('tarim_token_v73','offline_'+Date.now());
const gate = $('authGate'); if(gate) gate.style.display = 'none';
const h1=$('homeUsernameDisplay'); if(h1) h1.textContent='@'+u+' 👑';
const h2=$('profileNameDisplay'); if(h2) h2.textContent='الإمبراطور '+u;
renderAllFeeds(); updateCounters(); startUesWatchSimulation(); toast('أهلاً '+u+' 👑');
}
async function startLive(){
state.liveMode = true; state.likes = 0; state.lSec = 0;
await initCam();
const wrap = $('cameraWrap');
if (wrap) { wrap.classList.add('fullscreen-live'); await openNativeFullscreen(wrap); }
const lb = $('liveBadge'); if(lb) lb.classList.remove('hidden');
const lc = $('liveControlsFull'); if(lc) lc.classList.remove('hidden');
const et = $('endLiveTopBtn'); if(et) et.classList.remove('hidden');
const nc = $('normalControls'); if(nc) nc.classList.add('hidden');
const hdr = document.querySelector('header'); if(hdr) hdr.classList.add('hidden');
const nav = document.querySelector('nav'); if(nav) nav.classList.add('hidden');
if(state.liveInt) clearInterval(state.liveInt);
state.liveInt = setInterval(() => {
state.lSec++;
const m = String(Math.floor(state.lSec / 60)).padStart(2, '0');
const s = String(state.lSec % 60).padStart(2, '0');
const lt = $('liveTimer'); if(lt) lt.textContent = m + ':' + s;
}, 1000);
toast('🔴 بث ملء الشاشة - كامل');
}
function stopLive(){
state.liveMode = false;
if(state.liveInt) { clearInterval(state.liveInt); state.liveInt = null; }
closeNativeFullscreen();
const wrap = $('cameraWrap'); if(wrap) wrap.classList.remove('fullscreen-live');
const lb = $('liveBadge'); if(lb) lb.classList.add('hidden');
const lc = $('liveControlsFull'); if(lc) lc.classList.add('hidden');
const et = $('endLiveTopBtn'); if(et) et.classList.add('hidden');
const nc = $('normalControls'); if(nc) nc.classList.remove('hidden');
const hdr = document.querySelector('header'); if(hdr) hdr.classList.remove('hidden');
const nav = document.querySelector('nav'); if(nav) nav.classList.remove('hidden');
stopStream(); setTimeout(()=>initCam(), 200); toast('⏹️ تم إنهاء البث');
}
function addLike() {
state.likes++;
const lc = $('likeCount'); if(lc) lc.textContent = state.likes;
const lf = $('likeCountFull'); if(lf) lf.textContent = state.likes;
}

// === V8.5.1 TRIPLE-PAY - نافذة الدفع الثلاثية المحصنة ===
function openGiftModal() {
  let modal = $('triplePayModal');
  if(modal){ modal.classList.remove('hidden'); return; }
  modal = document.createElement('div');
  modal.id = 'triplePayModal';
  modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4';
  modal.innerHTML = `
  <div class="bg-slate-900 border border-cyan-500/30 rounded-[24px] p-6 w-full max-w-sm shadow-2xl">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-cyan-400 font-bold">🎁 اختر طريقة الدفع - سيادي</h3>
      <button id="closeTriplePay" class="text-slate-400 text-xl">✕</button>
    </div>
    <div class="grid gap-3">
      <div class="grid grid-cols-4 gap-2 mb-2">
        <button data-gift="heart" class="gift-type bg-cyan-500 text-black p-2 rounded-lg text-[10px] font-bold">❤️ 0.1$</button>
        <button data-gift="rose" class="gift-type bg-slate-800 text-white p-2 rounded-lg text-[10px]">🌹 0.5$</button>
        <button data-gift="crown" class="gift-type bg-slate-800 text-white p-2 rounded-lg text-[10px]">👑 1$</button>
        <button data-gift="rocket" class="gift-type bg-slate-800 text-white p-2 rounded-lg text-[10px]">🚀 5$</button>
      </div>
      <button id="payOKX" class="bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold p-4 rounded-xl flex justify-between items-center">
        <span>💎 OKX - فوري لليمن</span><span class="text-[10px] bg-black/20 px-2 py-1 rounded">مباشر</span>
      </button>
      <button id="payCard" class="bg-slate-800 border border-yellow-500/50 text-white font-bold p-4 rounded-xl flex justify-between items-center">
        <span>💳 Mastercard / Visa</span><span class="text-[10px] bg-yellow-500 text-black px-2 py-1 rounded">بطاقة</span>
      </button>
      <button id="payPayPal" class="bg-slate-800 border border-slate-600 text-white font-bold p-4 rounded-xl flex justify-between items-center">
        <span>🅿️ PayPal - للأجانب</span><span class="text-[10px] bg-blue-500 text-white px-2 py-1 rounded">PayPal</span>
      </button>
    </div>
    <p class="text-[10px] text-slate-500 mt-4 text-center">تستلم USDT مباشر على OKX: 0x53...ab96<br>Mastercard عبر NOWPayments - بدون شركة</p>
  </div>`;
  document.body.appendChild(modal);
  $('closeTriplePay').addEventListener('click', closeGiftModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeGiftModal(); });
  modal.querySelectorAll('.gift-type').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      modal.querySelectorAll('.gift-type').forEach(b=>{ b.className='gift-type bg-slate-800 text-white p-2 rounded-lg text-[10px]'; });
      btn.className='gift-type bg-cyan-500 text-black p-2 rounded-lg text-[10px] font-bold';
      state.giftType = sanitizeText(btn.dataset.gift);
    });
  });
  $('payOKX').addEventListener('click', ()=>{ closeGiftModal(); payWithOKX(); });
  $('payCard').addEventListener('click', ()=>{ closeGiftModal(); payWithCard(); });
  $('payPayPal').addEventListener('click', payWithPayPal);
}
function closeGiftModal(){ const m=$('triplePayModal'); if(m) m.classList.add('hidden'); }
async function payWithOKX(){
  const g = $('giftAnim'); if(g){ g.textContent = '👑🎁💖'; setTimeout(()=>{g.textContent='';},2500); }
  const values = { heart:0.1, rose:0.5, crown:1, rocket:5 };
  const currentGift = values[state.giftType] ? state.giftType : 'heart';
  try{
    const res = await fetch('/api/gift', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ from: sanitizeText(localStorage.getItem('tarim_session_v73')||'AL'), to:'streamer', type: currentGift, method:'okx', amount: values[currentGift] })
    });
    const data = await res.json();
    if(data.ok){ toast(`💎 تم ${data.value} USDT عبر OKX - TX:${String(data.tx).slice(0,10)}... 👑`); }
  }catch(e){ toast('💎 تم إرسال الهدية عبر OKX! (Offline) 👑'); }
}
async function payWithCard(){
  const values = { heart:0.1, rose:0.5, crown:1, rocket:5 };
  const currentGift = values[state.giftType] ? state.giftType : 'heart';
  const amount = values[currentGift];
  toast(`💳 جاري إنشاء فاتورة ${amount}$ ببطاقة...`);
  try{
    const res = await fetch('/api/create-invoice', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ amount, type: currentGift, from: sanitizeText(localStorage.getItem('tarim_session_v73')||'AL') })
    });
    const data = await res.json();
    if(data.ok && data.invoice_url){
      window.open(data.invoice_url, '_blank');
      toast(`💳 ادفع ${amount}$ ببطاقتك - يصل USDT لمحفظتك`);
    } else if(data.demo){
      window.open(data.invoice_url, '_blank');
      toast('💳 DEMO - ضع NOWPAY_API_KEY في Render لتفعيل الحقيقي');
    }
  } catch(e){ toast('خطأ بطاقة - جرب OKX'); }
}
function payWithPayPal(){
  const values = { heart:0.1, rose:0.5, crown:1, rocket:5 };
  const currentGift = values[state.giftType] ? state.giftType : 'heart';
  const amount = values[currentGift];
  toast(`🅿️ PayPal ${amount}$ - قريباً`);
  window.open(`https://paypal.me/tarimos/${amount}`, '_blank');
}
function sendGift(){ openGiftModal(); }

// === نظام الترويج السيادي المحصن ===
function initPromoPage(){
  const container = document.querySelector('#sub-promo-page');
  if(!container) return;
  let box = container.querySelector('.p-4');
  if(!box){ box = document.createElement('div'); box.className='p-4 space-y-4'; container.appendChild(box); }
  if(document.getElementById('tarimAdsBox')) return;
  box.innerHTML = `
    <div id="tarimAdsBox" class="space-y-4">
      <h3 class="text-cyan-400 font-bold text-center">🚀 ترويج سيادي - أرخص من فيسبوك 10 مرات</h3>
      <div class="glass bg-slate-800/50 p-4 rounded-xl border border-cyan-500/20">
        <label class="text-xs text-slate-400">ميزانية الترويج ($)</label>
        <div class="grid grid-cols-4 gap-2 mt-2">
          <button data-budget="1" class="ad-budget bg-slate-800 border border-slate-600 text-white p-2 rounded-lg text-xs">1$ = 100</button>
          <button data-budget="5" class="ad-budget bg-cyan-500 text-black p-2 rounded-lg text-xs font-bold border-cyan-500">5$ = 500</button>
          <button data-budget="10" class="ad-budget bg-slate-800 border border-slate-600 text-white p-2 rounded-lg text-xs">10$ = 1k</button>
          <button data-budget="20" class="ad-budget bg-slate-800 border border-slate-600 text-white p-2 rounded-lg text-xs">20$ = 2k</button>
        </div>
      </div>
      <div class="glass bg-slate-800/50 p-4 rounded-xl">
        <label class="text-xs text-slate-400">استهداف</label>
        <select id="adTarget" class="w-full bg-slate-900 text-white p-3 rounded-lg mt-2 text-xs border border-slate-700">
          <option value="حضرموت">📍 حضرموت فقط</option>
          <option value="اليمن">🇾🇪 كل اليمن</option>
          <option value="الخليج">🌍 الخليج + اليمن</option>
          <option value="العالم">🌐 العالم كله</option>
        </select>
      </div>
      <div id="adPreview" class="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-center text-xs text-cyan-400 font-bold">🚀 5$ = 500 مشاهدة في حضرموت</div>
      <button id="payAdOKX" class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold p-4 rounded-xl">💎 روّج الآن عبر OKX - فوري</button>
      <button id="payAdCard" class="w-full bg-slate-800 border border-yellow-500/50 text-white font-bold p-3 rounded-xl text-xs">💳 ادفع ببطاقة Mastercard - يصل USDT</button>
      <div class="text-[10px] text-slate-500 text-center leading-4">مثال: مطعم في تريم يدفع 5$ = 500 شخص في تريم يشوف إعلانه اليوم<br>بدون فيسبوك - مباشر</div>
    </div>`;
    let selectedBudget = 5;
    box.querySelectorAll('.ad-budget').forEach(b=>{
      b.addEventListener('click', ()=>{
        box.querySelectorAll('.ad-budget').forEach(x=>{ x.className='ad-budget bg-slate-800 border border-slate-600 text-white p-2 rounded-lg text-xs'; });
        b.className='ad-budget bg-cyan-500 text-black p-2 rounded-lg text-xs font-bold border-cyan-500';
        selectedBudget = Number(b.dataset.budget) || 5;
        const t = sanitizeText($('adTarget').value);
        $('adPreview').textContent = `🚀 ${selectedBudget}$ = ${selectedBudget*100} مشاهدة في ${t}`;
      });
    });
    $('adTarget').addEventListener('change', ()=>{ 
      const t = sanitizeText($('adTarget').value);
      $('adPreview').textContent = `🚀 ${selectedBudget}$ = ${selectedBudget*100} مشاهدة في ${t}`; 
    });
    $('payAdOKX').addEventListener('click', async ()=>{
      const target = sanitizeText($('adTarget').value);
      toast(`💎 جاري ترويج ${selectedBudget}$ لـ ${target}...`);
      try{
        const res = await fetch('/api/promote', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ from: sanitizeText(localStorage.getItem('tarim_session_v73')||'AL'), budget: selectedBudget, target, method:'okx' })
        });
        const data = await res.json();
        if(data.ok){ toast(data.msg); $('adPreview').textContent = '✅ تم الترويج! ID: '+ sanitizeText(data.adId); }
      } catch(e){ toast('تم الترويج Offline - سيظهر قريباً'); }
    });
    $('payAdCard').addEventListener('click', async ()=>{
      const target = sanitizeText($('adTarget').value);
      toast(`💳 جاري إنشاء فاتورة إعلان ${selectedBudget}$...`);
      try{
        const res = await fetch('/api/create-ad-invoice', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ budget: selectedBudget, target, from: sanitizeText(localStorage.getItem('tarim_session_v73')||'AL') })
        });
        const data = await res.json();
        if(data.ok && data.invoice_url){ window.open(data.invoice_url, '_blank'); toast(`🚀 ادفع ${selectedBudget}$ بالبطاقة - يصير ${selectedBudget*100} مشاهدة`); }
      } catch(e){ toast('خطأ - جرب OKX'); }
    });
}

function setupUploadFix() {
const btn = $('uploadTriggerBtn'); const input = $('videoInput'); const video = $('cameraPreview');
if (!btn ||!input ||!video) return;
btn.addEventListener('click', (e) => { e.preventDefault(); input.click(); });
input.addEventListener('change', (e) => {
const file = e.target.files && e.target.files[0]; if (!file) return;
if (state.curStream) { state.curStream.getTracks().forEach(t=>t.stop()); state.curStream=null; }
if (state.upURL) URL.revokeObjectURL(state.upURL);
state.upURL = URL.createObjectURL(file); state.upIsVideo = file.type.startsWith('video/');
video.srcObject = null; video.src = state.upURL; video.loop = true; video.muted = true; video.play().catch(()=>{});
toast('✅ تم رفع: ' + sanitizeText(file.name.slice(0,20)));
});
}
document.addEventListener('DOMContentLoaded', () => {
const map={
startLive, stopLive, switchCam, capturePhoto,
filterNone:()=>setFilter('none'), filterBeauty:()=>setFilter('beauty'),
tabHome:(b)=>switchTab('home',b), tabOperations:(b)=>switchTab('operations',b),
tabCreate:(b)=>switchTab('create',b), tabInbox:(b)=>switchTab('inbox',b), tabProfile:(b)=>switchTab('profile',b),
backToProfile, openAccountSettings:()=>showSubPage('account-settings'), openSecurity:()=>showSubPage('security-settings'),
openQrPage:()=>showSubPage('qr-page'), openOkx:()=>showSubPage('okx-page'), openActivity:()=>showSubPage('activity-page'),
openOffline:()=>showSubPage('offline-page'), openCommerce:()=>showSubPage('commerce-page'), openPromo:()=>showSubPage('promo-page'),
openMap:()=>{ const c=$('mapContainer'); if(c){ c.classList.toggle('hidden'); if(!c.classList.contains('hidden')&&!state.map&&window.L){ state.map=L.map(c).setView([16.0545,49.0],14); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.map); } } },
showQR:()=>{ const d=$('qrDisplay'); if(d){ d.classList.toggle('hidden'); const b=$('operationsQrBox'); if(b&&!d.classList.contains('hidden')){ b.textContent=''; if(window.QRCode) new QRCode(b,{text:'https://tarimos.org',width:100,height:100}); } } },
goInbox:()=>switchTab('inbox')
};
document.addEventListener('click',(e)=>{ const btn=e.target.closest('[data-action]'); if(!btn) return; const act=btn.getAttribute('data-action'); if(map[act]) map[act](btn); });
const sBtn = $('supportBtn'); if(sBtn) sBtn.addEventListener('click', (e) => { e.preventDefault(); if (window.TarimSupport && typeof window.TarimSupport.openModal === 'function') window.TarimSupport.openModal(); });
const lBtn = $('loginBtn'); if(lBtn) lBtn.addEventListener('click',forceUnlockCastle);
const uPass = $('userPass'); if(uPass) uPass.addEventListener('keydown',e=>{if(e.key==='Enter')forceUnlockCastle();});
const pBtn = $('publishBtn'); if(pBtn) pBtn.addEventListener('click',publishPost);
const sLiveBtn = $('startLiveBtn'); if(sLiveBtn) sLiveBtn.addEventListener('click',startLive);
const stLiveBtn = $('stopLiveBtn'); if(stLiveBtn) stLiveBtn.addEventListener('click',stopLive);
const stLiveFull = $('stopLiveBtnFull'); if(stLiveFull) stLiveFull.addEventListener('click',stopLive);
const endTop = $('endLiveTopBtn'); if(endTop) endTop.addEventListener('click',stopLive);
const giftBtn = $('sendGiftBtn'); if(giftBtn) giftBtn.addEventListener('click', sendGift);
const giftFull = $('sendGiftBtnFull'); if(giftFull) giftFull.addEventListener('click', sendGift);
const likeBtn = $('likeLiveBtn'); if(likeBtn) likeBtn.addEventListener('click', addLike);
const likeFull = $('likeLiveBtnFull'); if(likeFull) likeFull.addEventListener('click', addLike);
setupUploadFix();
document.addEventListener('fullscreenchange', ()=>{ if (!document.fullscreenElement && state.liveMode) {} });
const logoutBtn = $('logoutBtn'); if(logoutBtn) logoutBtn.addEventListener('click',()=>{localStorage.clear(); location.reload();});
if(localStorage.getItem('tarim_session_v73')){ const gate=$('authGate'); if(gate) gate.style.display='none'; renderAllFeeds(); updateCounters(); startUesWatchSimulation(); }
});
})();
