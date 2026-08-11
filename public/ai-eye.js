// ==============================================================================
// public/ai-eye.js - TARIM OS V8.7 SECURE - عين القلعة المحصنة
// ==============================================================================
"use strict";

// --- 1. محرك الفحص - بدون /g القاتل ---
const BANNED_PATTERNS = Object.freeze([
    { pattern: /<\s*script|javascript\s*:|onerror\s*=|onload\s*=/i, word: "حقن XSS", weight: 60 },
    { pattern: /\b(hack|اختراق|هاك)\b/i, word: "اختراق", weight: 40 },
    { pattern: /\b(سب|كراهية)\b/i, word: "كراهية/سب", weight: 30 },
    { pattern: /\b(spam|فاحش)\b/i, word: "spam", weight: 30 }
]);

export const TarimAI = Object.freeze({
    version: "Sovereign v8.7 SECURE",
    analyze(text) {
        if (!text || typeof text!== 'string') return { level: "آمن", score: 100, msg: "نص فارغ", safe: true, found: [] };
        const cleanText = text.trim().slice(0, 2000);
        if (!cleanText) return { level: "آمن", score: 100, msg: "نص فارغ", safe: true, found: [] };

        let score = 100;
        const found = [];
        // بدون lastIndex - كل pattern جديد بدون حالة
        for (const item of BANNED_PATTERNS) {
            if (item.pattern.test(cleanText)) {
                score -= item.weight;
                if (!found.includes(item.word)) found.push(item.word);
            }
        }
        score = Math.max(0, score);
        if (score >= 80) return { level: "آمن", score, msg: "المحتوى آمن", safe: true, found };
        if (score >= 50) return { level: "مراجعة", score, msg: `يحتاج مراجعة: ${found.join(', ')}`, safe: false, found };
        return { level: "محظور", score, msg: `مرفوض: ${found.join(', ')}`, safe: false, found };
    },
    quickCheck(text) { return this.analyze(text).safe; }
});

// --- 2. العين الذكية - محصنة وخاصة ---
class AIEye {
  constructor() {
    this.events = [];
    this.startTime = Date.now();
    this.maxEvents = 50;
    this.maxVisitors = 30;
    try { this.visitors = JSON.parse(localStorage.getItem('souq_visitors')||'[]').slice(-this.maxVisitors); }
    catch { this.visitors = []; }
    this.init();
  }
  init() {
    this.trackVisit();
    this.trackClicks();
    this.protectImages();
  }
  trackVisit() {
    try {
      const visit = { id: Date.now(), path: location.pathname.slice(0,100), time: Date.now() };
      this.visitors.push(visit);
      if (this.visitors.length > this.maxVisitors) this.visitors.shift();
      localStorage.setItem('souq_visitors', JSON.stringify(this.visitors));
    } catch {}
  }
  trackClicks() {
    document.addEventListener('click', (e) => {
      // لا تسجل أبداً حقول حساسة
      if (e.target.closest('input[type=password], input[type=email]')) return;
      const target = e.target.closest('[data-product], button:not([type=password])');
      if (!target) return;
      // لا تحفظ innerText كامل - فقط نوع المنتج
      const product = target.dataset?.product || target.closest('[data-product]')?.dataset?.product;
      if (!product) return; // لا نتتبع إلا المنتجات فقط
      if (this.events.length >= this.maxEvents) this.events.shift();
      this.events.push({ product: String(product).slice(0,30), time: Date.now()-this.startTime });
    }, { passive: true });
  }
  protectImages() {
    document.addEventListener('contextmenu', (e) => { if (e.target.tagName==='IMG') e.preventDefault(); });
    document.addEventListener('dragstart', (e) => { if (e.target.tagName==='IMG') e.preventDefault(); });
  }
  getInterestedCategory() {
    const counts = {};
    this.events.forEach(ev => { if(ev.product) counts[ev.product]=(counts[ev.product]||0)+1; });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'عطور ملكية';
  }
  getStats() {
    return { totalVisits: this.visitors.length, interested: this.getInterestedCategory(), timeSpent: Math.round((Date.now()-this.startTime)/1000) };
  }
  showToast(msg) {
    let t = document.getElementById('ai-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ai-toast';
      t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#ffd700;padding:10px 20px;border-radius:20px;z-index:9999;border:1px solid rgba(255,215,0,0.3);';
      document.body.appendChild(t);
    }
    t.textContent = String(msg).slice(0,100);
    t.style.display = 'block';
    setTimeout(()=> t.style.display='none', 2500);
  }
}

const aiEye = new AIEye();

// لا تفضح العين للعالم - كانت window.aiEye = aiEye تسمح للهكر يتلاعب بها
if (typeof window!== 'undefined') {
    // فقط للملك في وضع التطوير
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        window.TarimAI = TarimAI;
    }
}

// --- 3. واجهة المستخدم - آمنة ضد XSS ---
function initSovereignEye() {
    const btn = document.getElementById('aiEyeBtn');
    const modal = document.getElementById('aiModal');
    const closeBtn = document.getElementById('aiCloseBtn');
    const sendBtn = document.getElementById('aiSendBtn');
    const input = document.getElementById('aiInput');
    const resultBox = document.getElementById('aiMessages');
    if (!modal) return;

    const openModal = () => { modal.classList.remove('hidden'); modal.classList.add('flex'); input?.focus(); };
    const closeModal = () => { modal.classList.add('hidden'); modal.classList.remove('flex'); };

    function renderResult(analysis) {
        if (!resultBox) return;
        const wrapper = document.createElement('div');
        wrapper.className = "p-2 rounded-lg bg-slate-800 border border-cyan-500/20 text-right space-y-1 mt-1";
        const levelP = document.createElement('p');
        levelP.textContent = `المستوى: ${analysis.level} (${analysis.score}/100)`;
        levelP.style.color = analysis.score>=80?'#10b981':analysis.score>=50?'#f59e0b':'#ef4444';
        levelP.className = "font-bold text-xs";
        const msgP = document.createElement('p');
        msgP.className = "text-[11px] text-slate-200";
        msgP.textContent = analysis.msg; // textContent آمن
        wrapper.append(levelP, msgP);
        resultBox.appendChild(wrapper);
        resultBox.scrollTop = resultBox.scrollHeight;
    }

    btn?.addEventListener('click', (e)=>{ e.preventDefault(); openModal(); });
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });

    const doAnalyze = () => {
        const textVal = input?.value?.trim().slice(0,500) || "";
        if (!textVal) return;
        if (!TarimAI.quickCheck(textVal)) {
            // اعرض رسالة المستخدم بأمان
            const userMsg = document.createElement('div');
            userMsg.className = "p-2 rounded-lg bg-cyan-500/10 text-cyan-300 text-right text-xs";
            userMsg.textContent = textVal;
            resultBox?.appendChild(userMsg);
            const analysis = TarimAI.analyze(textVal);
            renderResult(analysis);
            input.value = "";
            return;
        }
        const userMsg = document.createElement('div');
        userMsg.className = "p-2 rounded-lg bg-cyan-500/10 text-cyan-300 text-right text-xs";
        userMsg.textContent = textVal;
        resultBox?.appendChild(userMsg);
        const analysis = TarimAI.analyze(textVal);
        setTimeout(()=>{ renderResult(analysis); }, 150);
        input.value = "";
    };

    sendBtn?.addEventListener('click', doAnalyze);
    input?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doAnalyze(); });
}

if (typeof document!== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSovereignEye);
    else initSovereignEye();
}
