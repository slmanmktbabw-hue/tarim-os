// public/app.js - Tarim_Fortress OPEN EDITION - NO AUTH GATE
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
watchTimer: null, currentWatchTime: 0, abortCtrl: null, currentUser: { name: 'الإمبراطور (مفتوح)' }
};

// --- تشغيل مباشر بدون قيود أو شاشة قفل ---
document.addEventListener('DOMContentLoaded', () => {
  // إخفاء بوابات الحماية وتسجيل الدخول بشكل نهائي
  const gate = $('authGate');
  if (gate) gate.remove();

  initNav();
  renderAllFeeds();
  updateProfileDisplay();
  toast('👑 تم فتح النظام بالكامل - وضع التشغيل المباشر');
});

// تحديث الواجهة الشخصية افتراضياً
function updateProfileDisplay() {
  const nameDisp = $('profileNameDisplay');
  if (nameDisp) nameDisp.textContent = "الإمبراطور (مفتوح)";
}

// دالة تغيير وتخزين الخلفية السيادية
window.changeBg = function(color) {
  const body = document.getElementById('appBody');
  if(body) {
    body.style.backgroundImage = 'none';
    body.style.backgroundColor = color;
    localStorage.setItem('tarim_bg_color', color);
    localStorage.removeItem('tarim_bg_image');
    toast('🎨 تم تحديث الخلفية بنجاح');
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
    username: 'الإمبراطور',
    createdAt: new Date().toISOString(),
    likes: 0
  };
  const all = getPosts(); 
  all.push(post); 
  savePosts(all); 
  inp.value = '';
  
  renderAllFeeds();
  toast('🚀 تم النشر في الرئيسية مباشرة');
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
        <span class="text-cyan-400 font-bold">@${sanitizeText(p.username)} 🔓</span>
        <span>${new Date(p.createdAt).toLocaleTimeString('ar')}</span>
      </div>
      <p class="text-xs">${sanitizeText(p.content)}</p>
    `;
    f.appendChild(c);
  });
}

// --- شات الدعم المباشر ---
async function sendAiSupportChat() {
  const input = $('inboxInputField');
  const list = $('inboxMessagesList');
  if (!input || !input.value.trim() || !list) return;
  
  const text = sanitizeText(input.value);
  input.value = '';
  
  const userMsg = document.createElement('div');
  userMsg.className = 'bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-xs text-right self-end max-w-[85%]';
  userMsg.textContent = text;
  list.appendChild(userMsg);
  
  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs text-right self-start max-w-[85%] text-cyan-300';
    aiMsg.textContent = `🤖 النظام المفتوح: تم استلام استفسارك بنجاح. النظام يعمل بكامل صلاحياته.`;
    list.appendChild(aiMsg);
    list.scrollTop = list.scrollHeight;
  }, 600);
}

document.getElementById('sendInboxMsgBtn')?.addEventListener('click', sendAiSupportChat);
document.getElementById('supportBtn')?.addEventListener('click', () => {
  switchTab('inbox', document.querySelector('[data-action="tabInbox"]'));
  toast('🛡️ تم فتح شات الدعم المباشر');
});

})();
