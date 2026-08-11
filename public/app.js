// public/app.js - TARIM OS V8.6.1 KING EDITION - HARDENED - لا تشيل الخيارات
"use strict";
(function () {
const $ = id => document.getElementById(id);

function sanitizeText(t) {
    if (!t) return "";
    // textContent آمن بذاته - لا نحتاج تحويل &lt; يدوياً
    return String(t).slice(0, 1000).trim();
}
function toast(m) {
    const b = $('toastBox'); if (!b) return;
    const e = document.createElement('div');
    e.textContent = sanitizeText(m).slice(0, 220); // textContent فقط
    e.style.cssText = 'background:#00B4D8;color:#000;padding:12px 16px;border-radius:14px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center;z-index:99999;position:relative';
    b.appendChild(e);
    setTimeout(() => e.remove(), 4000);
}

let state = {
    curStream: null, facing: 'user', map: null, liveInt: null,
    lSec: 0, liveMode: false, likes: 0, capImg: null, upURL: null, upIsVideo: false,
    watchTimer: null, currentWatchTime: 0, abortCtrl: null,
    giftType: 'heart', adBudget: 5, homeLikesCount: 120,
    isKing: false // لا نقرأ من localStorage أبداً
};

// === نظام الملك المحصن - يفحص من السيرفر فقط ===
async function checkKingFromServer() {
    try {
        const token = localStorage.getItem('tarim_token_v73');
        if (!token || token.startsWith('offline_')) { state.isKing = false; return false; }
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        state.isKing = data.user?.role === 'Emperor';
        return state.isKing;
    } catch { state.isKing = false; return false; }
}
function isKing(){ return state.isKing; }

// === خلفية سيادية محصنة ===
window.changeBg = function(color) {
    const body = document.getElementById('appBody');
    if (!body || typeof color!== 'string') return;
    // Whitelist صارم: فقط HEX أو rgb()
    const isHex = /^#[0-9A-Fa-f]{3,8}$/.test(color.trim());
    const isRgb = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(color.trim());
    if (!isHex &&!isRgb) { toast('⚠️ لون غير صالح'); return; }
    body.style.backgroundImage = 'none';
    body.style.backgroundColor = color.trim();
    localStorage.setItem('tarim_bg_color', color.trim());
    localStorage.removeItem('tarim_bg_image');
    toast('🎨 تم تحديث الخلفية');
};

window.changeBgImage = function(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    // منع SVG وملفات ضخمة
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type) || file.size > 2 * 1024 * 1024) {
        toast('⚠️ فقط JPG/PNG/WEBP أقل من 2MB');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        if (typeof dataUrl!== 'string' ||!dataUrl.startsWith('data:image/')) return;
        // منع SVG داخل base64
        if (dataUrl.includes('svg')) { toast('⚠️ SVG ممنوع'); return; }
        if (dataUrl.length > 500 * 1024) { toast('⚠️ الصورة كبيرة جداً للتخزين'); return; }
        const body = document.getElementById('appBody');
        if (body) {
            // استخدام setProperty آمن بدلاً من قالب نصي
            body.style.setProperty('background-image', `url("${dataUrl.replace(/"/g,'') }")`);
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            body.style.backgroundAttachment = 'fixed';
            try { localStorage.setItem('tarim_bg_image', dataUrl); } catch { toast('التخزين ممتلئ'); }
            localStorage.removeItem('tarim_bg_color');
            toast('🖼️ تم تعيين الخلفية');
        }
    };
    reader.readAsDataURL(file);
};

//... باقي دوالك startUesWatchSimulation, stopStream, switchTab تبقى كما هي مع إضافة تحقق التوكن...

async function startUesWatchSimulation() {
    if (state.watchTimer) clearInterval(state.watchTimer);
    if (state.abortCtrl) state.abortCtrl.abort();
    state.currentWatchTime = 0;
    state.abortCtrl = new AbortController();
    const token = localStorage.getItem('tarim_token_v73');
    if (!token || token.startsWith('offline_')) return; // لا تعمل بدون تسجيل حقيقي

    state.watchTimer = setInterval(async () => {
        state.currentWatchTime += 5;
        if (state.currentWatchTime >= 20) {
            clearInterval(state.watchTimer);
            try {
                const res = await fetch('/get_next_video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    signal: state.abortCtrl.signal,
                    body: JSON.stringify({
                        user_profile: { country: 'YE', interest: 'cooking', repeat_count: 0 },
                        current_video: { duration: 45, watch_time: state.currentWatchTime }
                    })
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data.action === 'split_screen' && data.video_id) {
                    const vid = String(data.video_id).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50);
                    if (['short_funny_01','short_tip_02','ye_cooking_restaurant_001','ye_football_highlights_002'].includes(vid) || vid.startsWith('trending_')) {
                        toast('⚡ ' + sanitizeText(vid));
                    }
                }
            } catch (err) {
                if (err.name!== 'AbortError') console.log('Offline Mode');
            }
        }
    }, 5000);
}

// === دخول محصن - يتصل بالسيرفر ===
async function forceUnlockCastle() {
    const el = $('userPhoneOrEmail');
    const passEl = $('userPass');
    let username = (el?.value?.trim() || '').slice(0,50);
    let password = (passEl?.value || '').slice(0,128);
    if (!username ||!password) { toast('⚠️ أدخل اسم وكلمة سر'); return; }

    // منع كلمة KING السحرية
    if (username.toUpperCase() === 'KING') { toast('⛔ محاولة غير مصرحة'); return; }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok ||!data.token) { toast(data.message || 'فشل الدخول'); return; }

        localStorage.setItem('tarim_session_v73', sanitizeText(data.user.username));
        localStorage.setItem('tarim_token_v73', data.token);
        await checkKingFromServer();

        const gate = $('authGate'); if(gate) gate.style.display = 'none';
        const h1 = $('homeUsernameDisplay'); if(h1) h1.textContent = '@' + sanitizeText(data.user.username) + ' 👑' + (isKing()? ' [الملك]' : '');
        toast('أهلاً ' + sanitizeText(data.user.username) + ' 👑');
        renderAllFeeds(); updateCounters(); startUesWatchSimulation();
    } catch { toast('❌ خطأ اتصال بالسيرفر'); }
}

// === دفع محصن - لا يرسل from من العميل ===
async function payWithOKX(){
    const token = localStorage.getItem('tarim_token_v73');
    if (!token) { toast('سجل دخول أولاً'); return; }
    const values = { heart:0.1, rose:0.5, crown:1, rocket:5 };
    const currentGift = values[state.giftType]? state.giftType : 'heart';
    try{
        const res = await fetch('/api/gift', {
            method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
            body: JSON.stringify({ to:'streamer', type: currentGift, method:'okx' })
        });
        const data = await res.json();
        if(data.ok){ toast(`💎 ${data.value}$ تم الإرسال`); }
    }catch(e){ toast('خطأ إرسال'); }
}

async function payWithCard(){
    const token = localStorage.getItem('tarim_token_v73');
    if (!token) { toast('سجل دخول أولاً'); return; }
    const values = { heart:0.1, rose:0.5, crown:1, rocket:5 };
    const currentGift = values[state.giftType]? state.giftType : 'heart';
    const amount = values[currentGift];
    toast(`💳 إنشاء فاتورة ${amount}$...`);
    try{
        const res = await fetch('/api/create-invoice', {
            method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
            body: JSON.stringify({ amount, type: currentGift })
        });
        const data = await res.json();
        if(data.ok && data.invoice_url){
            window.open(data.invoice_url, '_blank', 'noopener,noreferrer');
        }
    } catch(e){ toast('خطأ بطاقة'); }
}

// === رفع ملف محصن ===
function setupUploadFix() {
    const btn = $('uploadTriggerBtn'); const input = $('videoInput'); const video = $('cameraPreview');
    if (!btn ||!input ||!video) return;
    btn.addEventListener('click', (e) => { e.preventDefault(); input.click(); });
    input.addEventListener('change', (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 50 * 1024 * 1024) { toast('⚠️ الملف أكبر من 50MB'); return; }
        const allowed = ['video/mp4','video/webm','image/jpeg','image/png','image/webp'];
        if (!allowed.includes(file.type)) { toast('⚠️ نوع ملف غير مدعوم'); return; }
        if (state.curStream) { state.curStream.getTracks().forEach(t=>t.stop()); state.curStream=null; }
        if (state.upURL) URL.revokeObjectURL(state.upURL);
        state.upURL = URL.createObjectURL(file); state.upIsVideo = file.type.startsWith('video/');
        video.srcObject = null; video.src = state.upURL; video.loop = true; video.muted = true; video.play().catch(()=>{});
        toast('✅ تم الرفع');
    });
}

// في DOMContentLoaded أضف:
document.addEventListener('DOMContentLoaded', async () => {
    //... كودك الحالي...
    if(localStorage.getItem('tarim_token_v73') &&!localStorage.getItem('tarim_token_v73').startsWith('offline_')){
        await checkKingFromServer();
    }
    // لا تقبل offline_ token
    const t = localStorage.getItem('tarim_token_v73');
    if (t && t.startsWith('offline_')) { localStorage.clear(); location.reload(); }
});

// باقي دوالك renderAllFeeds, publishPost, initPromoPage تبقى نفسها لكن احذف أي x-king-key
// واستخدم Authorization: Bearer + isKing() من السيرفر

})();
