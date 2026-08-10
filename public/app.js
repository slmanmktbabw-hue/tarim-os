// public/app.js - TARIM OS V8.6 KING EDITION - SECURED & HARDENED WITH SUB-PAGES & HOME BUTTONS
"use strict";
(function () {
const $ = id => document.getElementById(id);
function sanitizeText(t) {
if (!t) return "";
return String(t).slice(0, 1000)
.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function toast(m) {
const b = $('toastBox'); if (!b) return;
const e = document.createElement('div');
e.textContent = sanitizeText(m).slice(0, 220);
e.style.cssText = 'background:#00B4D8;color:#000;padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center;z-index:99999;position:relative';
b.appendChild(e);
setTimeout(() => e.remove(), 4000);
}
let state = {
curStream: null, facing: 'user', map: null, liveInt: null,
lSec: 0, liveMode: false, likes: 0, capImg: null, upURL: null, upIsVideo: false,
watchTimer: null, currentWatchTime: 0, abortCtrl: null,
giftType: 'heart', adBudget: 5, homeLikesCount: 120
};

// === نظام الملك المحصن ===
const KING_KEY = 'TARIM_KING_2026';
const KING_USERS = ['al','slmanmktbabw-hue','الامبراطور','الملك','gooaz'];
function isKing(){
  const u = (localStorage.getItem('tarim_session_v73')||'').toLowerCase();
  return KING_USERS.includes(u) || localStorage.getItem('tarim_king_auth')===KING_KEY;
}
async function openNativeFullscreen(elem) {
try {
if (!elem) return;
if (elem.requestFullscreen) await elem.requestFullscreen();
else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
else if (elem.webkitEnterFullscreen) elem.webkitEnterFullscreen();
} catch (e) { console.log('Fullscreen blocked'); }
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
toast('⚡ Tarim_Fortress: ' + sanitizeText(vid));
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
    const c=$('qrcode'); if(c){ c.textContent=''; if(window.QRCode) new QRCode(c,{text:'https://tarimos.org/user/'+sanitizeText(localStorage.getItem('tarim_session_v73')||'Gooaz'),width:128,height:128}); }
  }
  if(id==='promo-page'){ initPromoPage(); }
}
}
function backToProfile() { document.querySelectorAll('.sub-page').forEach(p=>p.classList.add('hidden')); const m=$('profile-main'); if(m) m.classList.remove('hidden'); updateCounters(); }
function updateCounters() {
const posts = getPosts();
if ($('countFollowers')) $('countFollowers').textContent = posts.length || 1;
if ($('countFollowing')) $('countFollowing').textContent = Math.floor(posts.length/2);
if ($('countLikes')) $('countLikes').textContent = posts.reduce((a,b)=>a+(Number(b.likes)||0),0);
if ($('activityPosts')) $('activityPosts').textContent = posts.length;
}
async function initCam() {
const v = $('cameraPreview'); if(!v) return;
try {
if (state.upURL) return;
stopStream();
state.curStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:state.facing},audio:true});
v.srcObject = state.curStream; v.muted = true; await v.play();
} catch (e){ toast('الكاميرا تحتاج HTTPS + سماح'); }
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
const u=document.createElement('span'); u.className='text-cyan-400 font-bold'; u.textContent='@'+sanitizeText(p.username||'Gooaz')+' 👑';
const t=document.createElement('span'); t.textContent=new Date(p.createdAt||Date.now()).toLocaleTimeString('ar');
header.appendChild(u); header.appendChild(t);
const body=document.createElement('p'); body.className='text-xs'; body.textContent=sanitizeText(p.content||'');
c.appendChild(header); c.appendChild(body); f.appendChild(c);
});
}
function publishPost() {
const inp = $('postContentInput'); if (!inp ||!inp.value.trim()) { toast('اكتب شيئاً'); return; }
const cleanContent = sanitizeText(inp.value.slice(0,1000));
const post={ id:Date.now(), content:cleanContent, username:sanitizeText(localStorage.getItem('tarim_session_v73')||'Gooaz'), createdAt:new Date().toISOString(), likes:0 };
const all=getPosts(); all.push(post); savePosts(all); inp.value='';
if(state.upURL){ URL.revokeObjectURL(state.upURL); state.upURL=null; state.upIsVideo=false; initCam(); }
state.capImg=null; renderAllFeeds(); updateCounters(); toast('🚀 تم النشر');
}
function forceUnlockCastle() {
const el = $('userPhoneOrEmail');
let raw = (el && el.value.trim())||'Gooaz';
if(raw.toUpperCase()==='KING'){
  localStorage.setItem('tarim_king_auth', KING_KEY);
  raw='Gooaz';
  toast('👑 تم تفعيل صلاحية الملك');
}
const u = sanitizeText(raw).slice(0,30)||'Gooaz';
localStorage.setItem('tarim_session_v73', u); localStorage.setItem('tarim_token_v73','offline_'+Date.now());
const gate = $('authGate'); if(gate) gate.style.display = 'none';
const h1=$('homeUsernameDisplay'); if(h1) h1.textContent='@'+u+' 👑'+(isKing()?' [الملك]':'');
const h2=$('profileNameDisplay'); if(h2) h2.textContent='الإمبراطور '+u+(isKing()?' 👑':'');
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
      <div class="bg-slate-800/50 p-2 rounded text-[10px] text-slate-400 text-center">الملك 10% + المبدع 90% 👑</div>
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
    <p class="text-[10px] text-slate-500 mt-4 text-center">تستلم USDT مباشر على OKX: 0x53...ab96<br>الملك: 10% | المبدع: 90%</p>
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
  const currentGift = values[state.giftType]? state.giftType : 'heart';
  try{
    const res = await fetch('/api/gift', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ from: sanitizeText(localStorage.getItem('tarim_session_v73')||'Gooaz'), to:'streamer', type: currentGift, method:'okx', amount: values[currentGift] })
    });
    const data = await res.json();
    if(data.ok){ toast(`💎 ${sanitizeText(data.value)}$ | الملك ${sanitizeText(data.kingCut)}$ + المبدع ${sanitizeText(data.creatorCut)}$ 👑`); }
  }catch(e){ toast('💎 تم إرسال الهدية عبر OKX! (Offline) 👑'); }
}
async function payWithCard(){
  const values = { heart:0.1, rose:0.5, crown:1, rocket:5 };
  const currentGift = values[state.giftType]? state.giftType : 'heart';
  const amount = values[currentGift];
  toast(`💳 جاري إنشاء فاتورة ${amount}$ ببطاقة...`);
  try{
    const res = await fetch('/api/create-invoice', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ amount, type: currentGift, from: sanitizeText(localStorage.getItem('tarim_session_v73')||'Gooaz') })
    });
    const data = await res.json();
    if(data.ok && data.invoice_url){
      window.open(sanitizeText(data.invoice_url), '_blank');
      toast(`💳 ادفع ${amount}$ - الملك 10%`);
    } else if(data.demo){
      window.open(sanitizeText(data.invoice_url), '_blank');
      toast('💳 DEMO - ضع NOWPAY_API_KEY في Render');
    }
  } catch(e){ toast('خطأ بطاقة - جرب OKX'); }
}
function payWithPayPal(){
  const values = { heart:0.1, rose:0.5, crown:1, rocket:5 };
  const currentGift = values[state.giftType]? state.giftType : 'heart';
  const amount = values[currentGift];
  toast(`🅿️ PayPal ${amount}$ - قريباً`);
  window.open(`https://paypal.me/tarimos/${amount}`, '_blank');
}
function sendGift(){ openGiftModal(); }

function initPromoPage(){
  const container = document.querySelector('#sub-promo-page');
  if(!container) return;
  let box = container.querySelector('.p-4');
  if(!box){ box = document.createElement('div'); box.className='p-4 space-y-4'; container.appendChild(box); }
  if($('tarimAdsBox')) return;
  box.innerHTML = `
    <div id="tarimAdsBox" class="space-y-4">
      <h3 class="text-cyan-400 font-bold text-center">🚀 ترويج سيادي - محصن بالكامل</h3>
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
      <div id="adPreview" class="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-center text-xs text-cyan-400 font-bold">🚀 5$ = 500 مشاهدة في حضرموت | ضريبة الملك 20%</div>
      <button id="payAdOKX" class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold p-4 rounded-xl">💎 روّج الآن عبر OKX - فوري</button>
      <button id="payAdCard" class="w-full bg-slate-800 border border-yellow-500/50 text-white font-bold p-3 rounded-xl text-xs">💳 ادفع ببطاقة Mastercard - يصل USDT</button>
      <div id="kingPanelAds"></div>
    </div>`;
    let selectedBudget = 5;
    box.querySelectorAll('.ad-budget').forEach(b=>{
      b.addEventListener('click', ()=>{
        box.querySelectorAll('.ad-budget').forEach(x=>{ x.className='ad-budget bg-slate-800 border border-slate-600 text-white p-2 rounded-lg text-xs'; });
        b.className='ad-budget bg-cyan-500 text-black p-2 rounded-lg text-xs font-bold border-cyan-500';
        selectedBudget = Number(b.dataset.budget) || 5;
        const t = sanitizeText($('adTarget').value);
        $('adPreview').textContent = `🚀 ${selectedBudget}$ = ${Math.floor(selectedBudget*0.8*100)} مشاهدة في ${t} | الملك ${ (selectedBudget*0.2).toFixed(1)}$`;
      });
    });
    $('adTarget').addEventListener('change', ()=>{
      const t = sanitizeText($('adTarget').value);
      $('adPreview').textContent = `🚀 ${selectedBudget}$ = ${Math.floor(selectedBudget*0.8*100)} مشاهدة في ${t} | الملك ${ (selectedBudget*0.2).toFixed(1)}$`;
    });
    $('payAdOKX').addEventListener('click', async ()=>{
      const target = sanitizeText($('adTarget').value);
      toast(`💎 جاري ترويج ${selectedBudget}$ لـ ${target}...`);
      try{
        const res = await fetch('/api/promote', {
          method:'POST', headers:{'Content-Type':'application/json','x-king-key': isKing()?KING_KEY:''},
          body: JSON.stringify({ from: sanitizeText(localStorage.getItem('tarim_session_v73')||'Gooaz'), budget: selectedBudget, target, method:'okx' })
        });
        const data = await res.json();
        if(data.ok){ toast(sanitizeText(data.msg)); $('adPreview').textContent = data.pending? '⏳ قيد مراجعة الملك' : '✅ تم الترويج! ID: '+ sanitizeText(data.adId); if(isKing()) loadKingPanel(); }
      } catch(e){ toast('تم الترويج Offline - سيظهر قريباً'); }
    });
    $('payAdCard').addEventListener('click', async ()=>{
      const target = sanitizeText($('adTarget').value);
      toast(`💳 جاري إنشاء فاتورة إعلان ${selectedBudget}$...`);
      try{
        const res = await fetch('/api/create-ad-invoice', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ budget: selectedBudget, target, from: sanitizeText(localStorage.getItem('tarim_session_v73')||'Gooaz') })
        });
        const data = await res.json();
        if(data.ok && data.invoice_url){ window.open(sanitizeText(data.invoice_url), '_blank'); toast(`🚀 ادفع ${selectedBudget}$ - الملك 20%`); }
      } catch(e){ toast('خطأ - جرب OKX'); }
    });

    function loadKingPanel(){
      const kingDiv = $('kingPanelAds');
      if(!isKing()){ kingDiv.innerHTML=''; return; }
      kingDiv.innerHTML = `
        <div class="bg-yellow-500/10 border-2 border-yellow-500/50 p-4 rounded-xl mt-4">
          <p class="text-yellow-400 font-bold text-xs mb-2">👑 لوحة الملك - صلاحية نشر الإعلانات والهدايا</p>
          <div class="grid grid-cols-3 gap-2 mb-3">
            <div class="bg-slate-900 p-2 rounded text-center"><p class="text-[10px] text-slate-400">إجمالي الملك</p><p id="kingTotal" class="text-yellow-400 font-bold text-xs">0$</p></div>
            <div class="bg-slate-900 p-2 rounded text-center"><p class="text-[10px] text-slate-400">من الهدايا 10%</p><p id="kingGift" class="text-cyan-400 font-bold text-xs">0$</p></div>
            <div class="bg-slate-900 p-2 rounded text-center"><p class="text-[10px] text-slate-400">من الإعلانات 20%</p><p id="kingAd" class="text-green-400 font-bold text-xs">0$</p></div>
          </div>
          <p class="text-yellow-400 font-bold text-xs">📩 إعلانات تنتظر موافقتك: <span id="pendingCount">0</span></p>
          <div id="pendingAdsList" class="mt-2 space-y-2 max-h-60 overflow-y-auto"></div>
          <button id="loadPending" class="w-full bg-yellow-500 text-black p-2 rounded-lg text-xs mt-2 font-bold">🔄 تحديث</button>
        </div>`;
      $('loadPending').addEventListener('click', fetchKingStats);
      fetchKingStats();
    }
    async function fetchKingStats(){
      try{
        const r = await fetch('/api/king/stats?key='+KING_KEY);
        const d = await r.json();
        if(d.ok){
          $('pendingCount').textContent = d.pendingAds.length;
          $('kingTotal').textContent = (d.earnings.total||0).toFixed(2)+'$';
          $('kingGift').textContent = (d.earnings.gifts||0).toFixed(2)+'$';
          $('kingAd').textContent = (d.earnings.ads||0).toFixed(2)+'$';
          $('pendingAdsList').innerHTML = d.pendingAds.length? d.pendingAds.map(ad=>`
            <div class="bg-slate-800 p-2 rounded flex justify-between items-center">
              <div><p class="text-xs text-white">${sanitizeText(ad.owner)} - ${sanitizeText(ad.budget)}$</p><p class="text-[10px] text-slate-400">${sanitizeText(ad.target)} - ${sanitizeText(ad.maxViews)} مشاهدة</p></div>
              <button onclick="approveAd('${sanitizeText(ad.id)}')" class="bg-green-500 text-black px-3 py-1 rounded text-[10px] font-bold">موافقة 👑</button>
            </div>
          `).join('') : '<p class="text-[10px] text-slate-500 text-center">لا يوجد إعلانات معلقة</p>';
        }
      }catch(e){ console.log('king stats error'); }
    }
    window.approveAd = async (id)=>{
      try{
        const r = await fetch('/api/king/approve-ad', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ adId:id, key:KING_KEY }) });
        const d = await r.json();
        if(d.ok){ toast('✅ تمت موافقة الملك - الإعلان الآن نشط'); fetchKingStats(); }
      }catch(e){ toast('خطأ موافقة'); }
    };
    loadKingPanel();
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
toast('✅ تم رفع الملف بنجاح');
});
}

document.addEventListener('DOMContentLoaded', () => {
const map={
startLive, stopLive, switchCam, capturePhoto,
filterNone:()=>setFilter('none'), filterBeauty:()=>setFilter('beauty'),
tabHome:(b)=>switchTab('home',b), tabOperations:(b)=>switchTab('operations',b),
tabCreate:(b)=>switchTab('create',b), tabInbox:(b)=>switchTab('inbox',b), tabProfile:(b)=>switchTab('profile',b),
backToProfile, 
openAccountSettings:()=>showSubPage('account-settings'), 
openSecurity:()=>showSubPage('security-settings'),
openQrPage:()=>showSubPage('qr-page'), 
openOkx:()=>showSubPage('okx-page'), 
openActivity:()=>showSubPage('activity-page'),
openOffline:()=>showSubPage('offline-page'), 
openCommerce:()=>showSubPage('commerce-page'), 
openPromo:()=>showSubPage('promo-page'),
openMap:()=>{ const c=$('mapContainer'); if(c){ c.classList.toggle('hidden'); if(!c.classList.contains('hidden')&&!state.map&&window.L){ state.map=L.map(c).setView([16.0545,49.0],14); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.map); } } },
showQR:()=>{ const d=$('qrDisplay'); if(d){ d.classList.toggle('hidden'); const b=$('operationsQrBox'); if(b&&!d.classList.contains('hidden')){ b.textContent=''; if(window.QRCode) new QRCode(b,{text:'https://tarimos.org',width:100,height:100}); } } },
goInbox:()=>switchTab('inbox')
};
document.addEventListener('click',(e)=>{ const btn=e.target.closest('[data-action]'); if(!btn) return; const act=btn.getAttribute('data-action'); if(map[act]) map[act](btn); });

const sBtn = $('supportBtn');
if(sBtn) sBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if(isKing()){
    showSubPage('promo-page');
    toast('👑 أهلاً ملك تريم - لوحة التحكم في الترويج');
  } else {
    if (window.TarimSupport && typeof window.TarimSupport.openModal === 'function') window.TarimSupport.openModal();
  }
});

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

// === تفعيل زر حفظ إعدادات الحساب السيادي ===
const saveAccBtn = $('saveAccountSettingsBtn');
if (saveAccBtn) {
    saveAccBtn.addEventListener('click', () => {
        const newNameInput = $('settingsDisplayName');
        if (newNameInput && newNameInput.value.trim()) {
            const updatedName = sanitizeText(newNameInput.value.trim());
            localStorage.setItem('tarim_session_v73', updatedName);
            
            const h1 = $('homeUsernameDisplay'); if(h1) h1.textContent = '@' + updatedName + ' 👑';
            const h2 = $('profileNameDisplay'); if(h2) h2.textContent = 'الإمبراطور ' + updatedName;
            
            toast('✅ تم تحديث إعدادات الحساب السيادي بنجاح');
            backToProfile();
        } else {
            toast('⚠️ يرجى إدخال اسم صحيح');
        }
    });
}

// === تفعيل الأزرار الأربعة الجانبية في الرئيسية ===
const hLikeBtn = $('homeLikeBtn');
if (hLikeBtn) {
  hLikeBtn.addEventListener('click', () => {
    state.homeLikesCount++;
    const countEl = $('homeLikeCount');
    if (countEl) countEl.textContent = state.homeLikesCount;
    toast('❤️ تم تسجيل الإعجاب');
  });
}

const hCommentBtn = $('homeCommentBtn');
if (hCommentBtn) {
  hCommentBtn.addEventListener('click', () => {
    switchTab('inbox');
    toast('💬 الانتقال إلى صندوق الوارد');
  });
}

const hShareBtn = $('homeShareBtn');
if (hShareBtn) {
  hShareBtn.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TARIM OS', text: 'شاهد محتوى سيادي من تريم', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast('🚀 تم نسخ رابط المشاركة');
      }
    } catch (e) {
      toast('تمت المشاركة بنجاح');
    }
  });
}

const hSaveBtn = $('homeSaveBtn');
if (hSaveBtn) {
  hSaveBtn.addEventListener('click', () => {
    try {
      let saved = JSON.parse(localStorage.getItem('tarim_saved_v73') || '[]');
      saved.push({ id: Date.now(), title: 'فيديو سيادي' });
      localStorage.setItem('tarim_saved_v73', JSON.stringify(saved));
      toast('🔖 تم حفظ العنصر بنجاح');
    } catch (e) {
      toast('تم الحفظ');
    }
  });
}

setupUploadFix();
const logoutBtn = $('logoutBtn'); if(logoutBtn) logoutBtn.addEventListener('click',()=>{localStorage.clear(); location.reload();});
if(localStorage.getItem('tarim_session_v73')){
  const gate=$('authGate'); if(gate) gate.style.display='none';
  const u = localStorage.getItem('tarim_session_v73');
  const h1=$('homeUsernameDisplay'); if(h1) h1.textContent='@'+sanitizeText(u)+' 👑'+(isKing()?' [الملك]':'');
  const h2=$('profileNameDisplay'); if(h2) h2.textContent='الإمبراطور '+sanitizeText(u)+(isKing()?' 👑':'');
  renderAllFeeds(); updateCounters(); startUesWatchSimulation();
}
});
})();
