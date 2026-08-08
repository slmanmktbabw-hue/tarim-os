// public/ai-eye.js - TARIM OS V7.3 Sovereign AI Eye - ESM SHIELD FINAL
"use strict";

// ✅ تحويل لـ ESM - يعمل مع importmap الجديد
const BANNED_PATTERNS = Object.freeze([
    { pattern: /\bسب\b|\bكراهية\b|\bاختراق\b/gi, word: "كراهية/سب", weight: 30 },
    { pattern: /\bهاك\b|\bhack\b|\bاختراق\b/gi, word: "اختراق", weight: 40 },
    { pattern: /<\s*script|javascript\s*:|onerror\s*=|onload\s*=/gi, word: "حقن XSS", weight: 60 },
    { pattern: /\bspam\b|\bفاحش\b/gi, word: "spam", weight: 30 }
]);

export const TarimAI = Object.freeze({
    version: "Sovereign v7.3 ESM Shield",
    build: "2026.05.13-V7.3",
    offline: true,
    shield: "esm.unpkg.com?bundle&target=es2022&min",

    analyze: function(text) {
        if (!text || typeof text !== 'string') {
            return { level: "آمن", score: 100, msg: "نص فارغ - آمن", color: "text-emerald-400", safe: true, found: [] };
        }
        const cleanText = text.trim().substring(0, 2000);
        if (!cleanText) {
            return { level: "آمن", score: 100, msg: "نص فارغ - آمن", color: "text-emerald-400", safe: true, found: [] };
        }

        let score = 100;
        let found = [];
        const lower = cleanText.toLowerCase();

        // فحص بالـ Regex المحصن بحدود كلمات
        BANNED_PATTERNS.forEach(item => {
            // إعادة تعيين lastIndex للـ regex العالمي
            item.pattern.lastIndex = 0;
            if (item.pattern.test(lower)) {
                score -= item.weight;
                if (!found.includes(item.word)) found.push(item.word);
            }
        });

        score = Math.max(0, score);

        if (score >= 80) {
            return { level: "سيادي آمن V7.3", score, msg: "المحتوى آمن ومطابق للقيم الحضرمية", color: "text-emerald-400", safe: true, found };
        }
        if (score >= 50) {
            return { level: "مراجعة", score, msg: `يحتاج مراجعة - وجد: ${found.join(', ')}`, color: "text-amber-400", safe: false, found };
        }
        return { level: "محظور سيادياً", score, msg: `محظور - ${found.join(', ')}`, color: "text-red-400", safe: false, found };
    },

    // دالة جديدة V7.3 - للاستخدام المباشر في app.js
    quickCheck: function(text) {
        const result = this.analyze(text);
        return result.safe;
    }
});

// ✅ توافق مع النظام القديم - لا تكسر القلعة القديمة
if (typeof window !== 'undefined') {
    window.TarimAI = TarimAI;
}

// ✅ واجهة UI محصنة V7.3 - تعمل فقط لو وجدت العناصر
function initSovereignEye() {
    const aiEyeBtn = document.getElementById('openAiEyeBtn');
    const aiEyeModal = document.getElementById('aiEyeModal');
    const closeBtn = document.getElementById('closeAiEyeBtn');
    const analyzeBtn = document.getElementById('analyzeContentBtn');
    const input = document.getElementById('aiEyeInput');
    const resultBox = document.getElementById('aiEyeResult');

    if (!aiEyeModal) return;

    function openModal() {
        aiEyeModal.classList.remove('hidden');
        aiEyeModal.classList.add('flex');
        if (input) input.focus();
    }
    function closeModal() {
        aiEyeModal.classList.add('hidden');
        aiEyeModal.classList.remove('flex');
        if (resultBox) resultBox.textContent = "";
    }
    function renderResult(analysis) {
        if (!resultBox) return;
        resultBox.textContent = "";
        const wrapper = document.createElement('div');
        wrapper.className = "p-4 rounded-lg bg-zinc-900 border border-zinc-700 shadow-inner";

        const levelP = document.createElement('p');
        levelP.className = `${analysis.color} font-bold text-sm`;
        levelP.textContent = `المستوى: ${analysis.level} - ${analysis.score}/100`;

        const msgP = document.createElement('p');
        msgP.className = "text-sm mt-2 text-zinc-200";
        msgP.textContent = analysis.msg;

        const metaP = document.createElement('p');
        metaP.className = "text-[10px] text-zinc-500 mt-3 tracking-widest";
        metaP.textContent = `TarimAI ${TarimAI.version} - ${TarimAI.shield} - Offline`;

        wrapper.append(levelP, msgP, metaP);
        resultBox.appendChild(wrapper);
    }

    aiEyeBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    aiEyeModal.addEventListener('click', (e) => { if (e.target === aiEyeModal) closeModal(); });

    let analyzing = false;
    analyzeBtn?.addEventListener('click', () => {
        if (analyzing) return;
        analyzing = true;
        analyzeBtn.disabled = true;
        const originalText = analyzeBtn.textContent;
        analyzeBtn.textContent = "جاري التحليل V7.3...";
        setTimeout(() => {
            const analysis = TarimAI.analyze(input?.value || "");
            renderResult(analysis);
            analyzing = false;
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = originalText;
        }, 250);
    });

    let timeout;
    input?.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (input.value.trim().length > 2) {
                renderResult(TarimAI.analyze(input.value));
            }
        }, 700);
    });
}

// ✅ تشغيل تلقائي يدعم ESM و القديم
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSovereignEye);
} else {
    initSovereignEye();
}

console.log(`[TARIM AI V7.3] 👁️ Sovereign Eye ESM Loaded - ${TarimAI.shield} - XSS Protected`);
