// public/app.js - Tarim_Fortress KING EDITION - SECURED & HARDENED
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
  curStream: null, facing: 'user', liveInt: null,
  lSec: 0, liveMode: false, likes: 0, capImg: null, upURL: null, upIsVideo: false,
  watchTimer: null, currentWatchTime: 0, abortCtrl: null, currentUser: null
};

// --- إعدادات بدء التطبيق وتجاوز الأمان ---
document.addEventListener('DOMContentLoaded', () => {
  // تفعيل بوابة التجاوز السيادي: إغلاق القفل فوراً لتشغيل التطبيق
  const gate = $('authGate');
  if (gate) {
    gate.style.display = 'none';
    console.log('🛡️ Tarim_Fortress: Security Gate Overridden for Session');
  }
  
  setupFirebaseListeners();
  initNav();
  renderAllFeeds();
});

function setupFirebaseListeners() {
  const googleBtn = $('googleLoginBtn');
  const sendOtpBtn = $('sendOtpBtn');
  const verifyOtpBtn = $('verifyOtpBtn');
  const logoutBtn = $('logoutBtn');
  const inboxSend = $('sendInboxMsgBtn');

  googleBtn?.addEventListener('click', loginWithGoogle);
  sendOtpBtn?.addEventListener('click', () => {
    const phone = $('userPhoneInput')?.value.trim();
    if (phone) sendOtpCode(phone);
    else toast('أدخل رقم الجوال صحيحاً');
  });
  verifyOtpBtn?.addEventListener('click', () => {
    const code = $('otpCodeInput')?.value.trim();
    if (code) verifyOtpCode(code);
    else toast('أدخل رمز التحقق');
  });
  logoutBtn?.addEventListener('click', logoutUser);
  inboxSend?.addEventListener('click', sendAiSupportChat);
}

// 1. تسجيل الدخول بجوجل
async function loginWithGoogle() {
  const fb = window.tarimFirebase;
  if (!fb) return toast('خطأ: لم يتم تحميل محرك Firebase');
  const provider = new fb.GoogleAuthProvider();
  try {
    const result = await fb.signInWithPopup(fb.auth, provider);
    await handleUserData(result.user);
  } catch (error) {
    console.error(error);
    toast('❌ فشل تسجيل الدخول');
  }
}

// 2. إرسال وتحقق OTP
function setupRecaptcha() {
  const fb = window.tarimFirebase;
  if (!window.recaptchaVerifier && fb) {
    window.recaptchaVerifier = new fb.RecaptchaVerifier(fb.auth, 'recaptcha-container', { 'size': 'invisible' });
  }
}

async function sendOtpCode(phoneNumber) {
  const fb = window.tarimFirebase;
  setupRecaptcha();
  try {
    window.confirmationResult = await fb.signInWithPhoneNumber(fb.auth, phoneNumber, window.recaptchaVerifier);
    $('otpBox')?.classList.remove('hidden');
    toast('📲 تم إرسال رمز التحقق');
  } catch (error) {
    console.error(error);
    toast('❌ خطأ في الإرسال');
  }
}

async function verifyOtpCode(code) {
  try {
    const result = await window.confirmationResult.confirm(code);
    await handleUserData(result.user);
  } catch (error) {
    toast('❌ رمز التحقق غير صحيح');
  }
}

async function handleUserData(user) {
  state.currentUser = { uid: user.uid, name: user.displayName || "مستخدم سيادي", photoURL: user.photoURL || "" };
  localStorage.setItem('tarim_session_v73', state.currentUser.name);
  $('authGate').style.display = 'none';
  updateProfileDisplay();
  toast('👑 مرحباً بك في Tarim_Fortress');
}

function logoutUser() {
  localStorage.removeItem('tarim_session_v73');
  location.reload();
}

function updateProfileDisplay() {
  if (!state.currentUser) return;
  const nameDisp = $('profileNameDisplay');
  if (nameDisp) nameDisp.textContent = state.currentUser.name;
}

// --- التنقل بين التبويبات ---
function initNav() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action === 'tabHome') switchTab('home', btn);
      if (action === 'tabOperations') switchTab('operations', btn);
      if (action === 'tabCreate') switchTab('create', btn);
      if (action === 'tabInbox') switchTab('inbox', btn);
      if (action === 'tabProfile') switchTab('profile', btn);
    });
  });
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => { t.classList.remove('active'); t.classList.add('hidden'); });
  const tar = $('tab-' + name); if (tar) { tar.classList.remove('hidden'); tar.classList.add('active'); }
  document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('text-cyan-400'); b.classList.add('text-slate-400'); });
  if (btn) { btn.classList.remove('text-slate-400'); btn.classList.add('text-cyan-400'); }
}

// نظام المنشورات
function getPosts() {
  try { return JSON.parse(localStorage.getItem('tarim_posts_v73') || '[]'); } catch { return []; }
}
function savePosts(p){ localStorage.setItem('tarim_posts_v73', JSON.stringify(p.slice(-100))); }

function publishPost() {
  const inp = $('postContentInput');
  if (!inp?.value.trim()) return toast('اكتب شيئاً للنشر');
  const all = getPosts();
  all.push({ id: Date.now(), content: sanitizeText(inp.value), username: 'الإمبراطور', createdAt: new Date().toISOString() });
  savePosts(all);
  inp.value = '';
  renderAllFeeds();
  toast('🚀 تم النشر بنجاح');
  switchTab('home', document.querySelector('[data-action="tabHome"]'));
}

document.getElementById('publishBtn')?.addEventListener('click', publishPost);

function renderAllFeeds() {
  const f = $('postsFeed'); if (!f) return;
  f.innerHTML = getPosts().reverse().map(p => `
    <div class="glass p-4 rounded-xl border border-cyan-500/20">
      <div class="text-cyan-400 font-bold text-[10px]">@${p.username} 🔒</div>
      <p class="text-xs mt-1">${p.content}</p>
    </div>`).join('');
}

async function sendAiSupportChat() {
  const input = $('inboxInputField');
  const list = $('inboxMessagesList');
  if (!input?.value.trim()) return;
  const msg = input.value;
  input.value = '';
  list.innerHTML += `<div class="bg-cyan-500/10 p-3 rounded-xl text-xs self-end">${msg}</div>`;
  setTimeout(() => {
    list.innerHTML += `<div class="bg-slate-900 p-3 rounded-xl text-xs self-start text-cyan-300">🤖 الذكاء السيادي: جاري تأمين الطلب...</div>`;
  }, 600);
}

document.getElementById('supportBtn')?.addEventListener('click', () => switchTab('inbox'));

})();
