// public/ai-eye.js - TARIM OS V8.8 - Sovereign AI Shield HARDENED
"use strict";

// 1. محرك الفحص - محصن ضد Unicode Bypass و ReDoS
const BANNED_PATTERNS = Object.freeze([
    { pattern: /<\s*script/i, word: "حقن XSS", weight: 60 },
    { pattern: /javascript\s*:|data\s*:\s*text\/html|vbscript\s*:/i, word: "بروتوكول خطير", weight: 60 },
    { pattern: /on\w+\s*=/i, word: "حدث XSS", weight: 60 }, // يمسك onerror= onload= on*=
    { pattern: /\b(hack|اختراق|هاك)\b/i, word: "اختراق", weight: 40 },
    { pattern: /\b(spam|فاحش|سب|كراهية)\b/i, word: "محتوى مرفوض", weight: 30 }
]);

function normalizeForCheck(str) {
    try {
        // فك تشفير Unicode Escape مثل \u0069 لمنع التجاوز
        return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
                 .normalize('NFKC')
                 .toLowerCase();
    } catch { return str.toLowerCase(); }
}

export const TarimAI = Object.freeze({
    version: "Sovereign v8.8 HARDENED",
    offline: true,
    analyze(text) {
        if (typeof text!== 'string' ||!text.trim()) {
            return { level: "آمن", score: 100, msg: "نص فارغ", safe: true, found: [] };
        }
        const cleanText = text.trim().slice(0, 2000);
        const normalized = normalizeForCheck(cleanText);

        let score = 100;
        const found = new Set();

        for (const item of BANNED_PATTERNS) {
            // استخدم نسخة جديدة بدون /g لتجنب lastIndex
            const re = new RegExp(item.pattern.source, item.pattern.flags.replace('g',''));
            if (re.test(cleanText) || re.test(normalized)) {
                score -= item.weight;
                found.add(item.word);
            }
        }

        score = Math.max(0, score);
        const foundArr = [...found];

        if (score >= 80) return { level: "آمن سيادياً", score, msg: "المحتوى آمن", safe: true, found: foundArr };
        if (score >= 50) return { level: "مراجعة", score, msg: `يحتاج مراجعة - ${foundArr.join(', ')}`, safe: false, found: foundArr };
        return { level: "محظور", score, msg: `محظور - ${foundArr.join(', ')}`, safe: false, found: foundArr };
    },
    quickCheck(text) { return this.analyze(text).safe; }
});

// 2. العين الذكية - خصوصية أولاً + حد أقصى صارم
class AIEye {
    constructor() {
        this.events = [];
        this.startTime = Date.now();
        this.maxEvents = 30; // كان 50
        this.maxVisitors = 20;
        this.lastAnalyzeAt = 0;
        try {
            // استخدم sessionStorage بدل localStorage - لا يبقى بعد إغلاق التبويب
            // ومفتاح جديد لا يكشف اسم مشروع قديم
            const raw = sessionStorage.getItem('tarim_eye_v88');
            this.visitors = raw? JSON.parse(raw).slice(-this.maxVisitors) : [];
        } catch { this.visitors = []; }
        this.init();
    }
    init() {
        this.trackVisit();
        this.trackClicks();
        // تم حذف protectImages - لا فائدة أمنية ويكسر الوصول
    }
    trackVisit() {
        try {
            // لا تخزن Query Params أبداً - فقط الـ pathname المجرد بدون?token=
            const safePath = location.pathname.split('?')[0].slice(0, 80);
            if (this.visitors.length >= this.maxVisitors) this.visitors.shift();
            this.visitors.push({ p: safePath, t: Date.now() });
            sessionStorage.setItem('tarim_eye_v88', JSON.stringify(this.visitors));
        } catch {}
    }
    trackClicks() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('input[type=password], input[type=email]')) return;
            const target = e.target.closest('[data-product]');
            if (!target) return;
            let product = target.getAttribute('data-product') || '';
            // تطهير صارم لـ data-product - يسمح فقط بحروف وأرقام ومسافة و -
            product = String(product).replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-_]/g, '').slice(0, 30).trim();
            if (!product) return;
            if (this.events.length >= this.maxEvents) this.events.shift();
            this.events.push({ product, time: Date.now() - this.startTime });
        }, { passive: true });
    }
    getInterestedCategory() {
        const counts = {};
        this.events.forEach(ev => { if (ev.product) counts[ev.product] = (counts[ev.product]||0)+1; });
        return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
    }
    getStats() {
        return {
            totalVisits: this.visitors.length,
            interested: this.getInterestedCategory(),
            timeSpent: Math.round((Date.now() - this.startTime)/1000)
        };
    }
    canAnalyze() {
        const now = Date.now();
        if (now - this.lastAnalyzeAt < 1000) return false; // منع الإغراق - تحليل كل ثانية فقط
        this.lastAnalyzeAt = now;
        return true;
    }
    showToast(msg) {
        let t = document.getElementById('ai-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'ai-toast';
            t.setAttribute('role', 'status');
            t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#ffd700;padding:10px 20px;border-radius:20px;z-index:9999;border:1px solid rgba(255,215,0,0.3)';
            document.body.appendChild(t);
        }
        t.textContent = String(msg).slice(0, 100);
        t.style.display = 'block';
        setTimeout(()=> t.style.display='none', 2500);
    }
    clear() {
        this.events = []; this.visitors = [];
        try { sessionStorage.removeItem('tarim_eye_v88'); } catch {}
    }
}

const aiEye = new AIEye();
Object.freeze(aiEye);

if (typeof window!== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.TarimAI = TarimAI;
    window._tarimEye = aiEye;
}

// 3. الواجهة - محصنة + Rate Limit
function initSovereignEye() {
    const aiEyeBtn = document.getElementById('aiEyeBtn') || document.getElementById('openAiEyeBtn');
    const aiEyeModal = document.getElementById('aiModal') || document.getElementById('aiEyeModal');
    const closeBtn = document.getElementById('aiCloseBtn') || document.getElementById('closeAiEyeBtn');
    const analyzeBtn = document.getElementById('aiSendBtn') || document.getElementById('analyzeContentBtn');
    const input = document.getElementById('aiInput') || document.getElementById('aiEyeInput');
    const resultBox = document.getElementById('aiMessages') || document.getElementById('aiEyeResult');
    if (!aiEyeModal) return;

    function openModal() { aiEyeModal.classList.remove('hidden'); aiEyeModal.classList.add('flex'); input?.focus(); }
    function closeModal() { aiEyeModal.classList.add('hidden'); aiEyeModal.classList.remove('flex'); }

    function renderResult(analysis) {
        if (!resultBox) return;
        const wrapper = document.createElement('div');
        wrapper.className = "p-2 rounded-lg bg-slate-800 border border-cyan-500/20 text-right space-y-1 mt-1";
        const levelP = document.createElement('p');
        levelP.className = "font-bold text-xs";
        levelP.textContent = `المستوى: ${analysis.level} (${analysis.score}/100)`;
        levelP.style.color = analysis.score >=80? '#10b981' : analysis.score>=50? '#f59e0b' : '#ef4444';
        const msgP = document.createElement('p');
        msgP.className = "text-[11px] text-slate-200";
        msgP.textContent = analysis.msg;
        wrapper.append(levelP, msgP);
        resultBox.appendChild(wrapper);
        resultBox.scrollTop = resultBox.scrollHeight;
    }

    aiEyeBtn?.addEventListener('click', (e)=>{ e.preventDefault(); openModal(); });
    closeBtn?.addEventListener('click', closeModal);
    aiEyeModal.addEventListener('click', (e)=>{ if(e.target===aiEyeModal) closeModal(); });

    const doAnalyze = () => {
        if (!aiEye.canAnalyze()) { aiEye.showToast('اهدأ قليلاً - ثانية واحدة'); return; }
        const textVal = input?.value?.trim().slice(0, 500) || "";
        if (!textVal) return;
        const userMsg = document.createElement('div');
        userMsg.className = "p-2 rounded-lg bg-cyan-500/10 text-cyan-300 text-right text-xs";
        userMsg.textContent = textVal;
        resultBox?.appendChild(userMsg);
        const analysis = TarimAI.analyze(textVal);
        renderResult(analysis);
        if (input) input.value = "";
    };

    analyzeBtn?.addEventListener('click', doAnalyze);
    input?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doAnalyze(); });
}

if (typeof document!== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSovereignEye);
    else initSovereignEye();
}
