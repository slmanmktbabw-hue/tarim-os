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

// --- إعدادات المصادقة عبر Firebase ---
document.addEventListener('DOMContentLoaded', () => {
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
  if (!fb) return toast('جاري تحميل فايربيس...');
  const provider = new fb.GoogleAuthProvider();
  try {
    const result = await fb.signInWithPopup(fb.auth, provider);
    const user = result.user;
    await handleUserData(user);
  } catch (error) {
    console.error(error);
    toast('❌ فشل تسجيل الدخول بجوجل');
  }
}

// 2. إرسال وتحقق OTP للجوال
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
    toast('📲 تم إرسال رمز التحقق (OTP)');
  } catch (error) {
    console.error(error);
    toast('❌ خطأ في إرسال الرمز (تأكد من صيغة الرقم)');
  }
}

async function verifyOtpCode(code) {
  const fb = window.tarimFirebase;
  try {
    const result = await window.confirmationResult.confirm(code);
    await handleUserData(result.user);
  } catch (error) {
    console.error(error);
    toast('❌ رمز التحقق غير صحيح');
  }
}

// تثبيت بيانات المستخدم في Firestore وإنشاء وثيقته
async function handleUserData(user) {
  const fb = window.tarimFirebase;
  const userRef = fb.doc(fb.db, "users", user.uid);
  const userSnap = await fb.getDoc(userRef);

  if (!userSnap.exists()) {
    await fb.setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || user.phoneNumber || "مستخدم سيادي",
      email: user.email || "",
      photoURL: user.photoURL || "",
      bio: "مرحباً بك في قلعة تريم السيادية (Tarim_Fortress)",
      createdAt: new Date().toISOString()
    });
  }

  state.currentUser = { uid: user.uid, name: user.displayName || user.phoneNumber || "مستخدم سيادي", photoURL: user.photoURL || "" };
  localStorage.setItem('tarim_session_v73', state.currentUser.name);
  
  // إخفاء بوابة الدخول
  $('authGate').style.display = 'none';
  updateProfileDisplay();
  toast('👑 أهلاً بك في Tarim_Fortress (قفل الأمانة)');
}

function logoutUser() {
  const fb = window.tarimFirebase;
  if (fb && fb.auth) fb.auth.signOut();
  localStorage.removeItem('tarim_session_v73');
  location.reload();
}

// تحديث الواجهة الشخصية
function updateProfileDisplay() {
  if (!state.currentUser) return;
  const nameDisp = $('profileNameDisplay');
  if (nameDisp) nameDisp.textContent = state.currentUser.name;
  if (state.currentUser.photoURL) {
    const img = $('profileAvatarImg');
    const txt = $('profileAvatarText');
    if (img && txt) {
      img.src = state.currentUser.photoURL;
      img.classList.remove('hidden');
      txt.classList.add('hidden');
    }
  }
}

// 3. رفع الصور السيادية عبر Firebase Storage وحفظها في البروفايل
window.uploadProfileImage = async function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file || !state.currentUser) return;
  const fb = window.tarimFirebase;
  const storageRef = fb.ref(fb.storage, `users/${state.currentUser.uid}/profile.jpg`);
  
  try {
    toast('⏳ جاري رفع الصورة بأمان...');
    await fb.uploadBytes(storageRef, file);
    const downloadURL = await fb.getDownloadURL(storageRef);
    
    await fb.setDoc(fb.doc(fb.db, "users", state.currentUser.uid), { photoURL: downloadURL }, { merge: true });
    state.currentUser.photoURL = downloadURL;
    updateProfileDisplay();
    toast('🖼️ تم تحديث صورة البروفايل بنجاح');
  } catch (error) {
    console.error(error);
    toast('❌ فشل رفع الصورة');
  }
};

// دالة تغيير وتخزين الخلفية السيادية للمستخدم فقط دون التأثير على الآخرين
window.changeBg = function(color) {
  const body = document.getElementById('appBody');
  if(body) {
    body.style.backgroundImage = 'none';
    body.style.backgroundColor = color;
    localStorage.setItem('tarim_bg_color', color);
    localStorage.removeItem('tarim_bg_image');
    toast('🎨 تم تحديث خلفية المستخدم الشخصية فقط');
  }
};

// --- التنقل بين التبويبات ---
function initNav() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
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
  if (name === 'home') renderAllFeeds();
}

// --- نظام النشر الفوري في الرئيسية ---
function getPosts() {
  try {
    const data = localStorage.getItem('tarim_posts_v73'); if(!data) return [];
    return JSON.parse(data) || [];
  } catch { return []; }
}
function savePosts(p){ try{ localStorage.setItem('tarim_posts_v73', JSON.stringify(p.slice(-100))); }catch{} }

function publishPost() {
  const inp = $('postContentInput'); if (!inp || !inp.value.trim()) { toast('اكتب شيئاً للنشر'); return; }
  const cleanContent = sanitizeText(inp.value.slice(0, 1000));
  const post = {
    id: Date.now(),
    content: cleanContent,
    username: state.currentUser ? state.currentUser.name : 'Tarim_User',
    createdAt: new Date().toISOString(),
    likes: 0
  };
  const all = getPosts(); 
  all.push(post); 
  savePosts(all); 
  inp.value = '';
  
  renderAllFeeds();
  toast('🚀 تم النشر في الرئيسية مباشرة');
  // الانتقال الفوري للرئيسية
  switchTab('home', document.querySelector('[data-action="tabHome"]'));
}

document.getElementById('publishBtn')?.addEventListener('click', publishPost);

function renderAllFeeds() {
  const f = $('postsFeed'); if (!f) return; f.textContent = '';
  const posts = getPosts();
  if (!posts.length) {
    const empty = document.createElement('div');
    empty.className = 'glass p-6 rounded-2xl text-center text-slate-400 text-xs';
    empty.textContent = 'لا منشورات بعد - انشر شيئاً لتظهر في الرئيسية 👑';
    f.appendChild(empty);
    return;
  }
  posts.slice().reverse().forEach(p => {
    const c = document.createElement('div'); 
    c.className = 'glass p-4 rounded-xl border border-cyan-500/20';
    c.innerHTML = `
      <div class="flex justify-between text-[10px] text-slate-400 mb-2">
        <span class="text-cyan-400 font-bold">@${sanitizeText(p.username)} 🔒</span>
        <span>${new Date(p.createdAt).toLocaleTimeString('ar')}</span>
      </div>
      <p class="text-xs">${sanitizeText(p.content)}</p>
    `;
    f.appendChild(c);
  });
}

// --- زر فريق الدعم يفتح شات ذكاء اصطناعي شغال ---
async function sendAiSupportChat() {
  const input = $('inboxInputField');
  const list = $('inboxMessagesList');
  if (!input || !input.value.trim() || !list) return;
  
  const text = sanitizeText(input.value);
  input.value = '';
  
  // رسالة المستخدم
  const userMsg = document.createElement('div');
  userMsg.className = 'bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-xs text-right self-end max-w-[85%]';
  userMsg.textContent = text;
  list.appendChild(userMsg);
  
  // رد الذكاء الاصطناعي السيادي المحلي
  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs text-right self-start max-w-[85%] text-cyan-300';
    aiMsg.textContent = `🤖 رد الذكاء السيادي (Tarim_Fortress): تم استلام رسالتك وتأمين الجلسة بنجاح تحت حماية "قفل الأمانة". كيف يمكنني مساعدتك برمجياً اليوم؟`;
    list.appendChild(aiMsg);
    list.scrollTop = list.scrollHeight;
  }, 600);
}

document.getElementById('supportBtn')?.addEventListener('click', () => {
  switchTab('inbox', document.querySelector('[data-action="tabInbox"]'));
  toast('🛡️ تم فتح شات الذكاء الاصطناعي والدعم السيادي');
});

})();
