// public/ai-eye.js - TARIM OS V7.3 Sovereign AI Eye - ESM SHIELD FINAL
"use strict";

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

        BANNED_PATTERNS.forEach(item => {
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

    quickCheck: function(text) {
        const result = this.analyze(text);
        return result.safe;
    }
});

if (typeof window !== 'undefined') {
    window.TarimAI = TarimAI;
}

function initSovereignEye() {
    const aiEyeBtn = document.getElementById('aiEyeBtn') || document.getElementById('openAiEyeBtn');
    const aiEyeModal = document.getElementById('aiModal') || document.getElementById('aiEyeModal');
    const closeBtn = document.getElementById('aiCloseBtn') || document.getElementById('closeAiEyeBtn');
    const analyzeBtn = document.getElementById('aiSendBtn') || document.getElementById('analyzeContentBtn');
    const input = document.getElementById('aiInput') || document.getElementById('aiEyeInput');
    const resultBox = document.getElementById('aiMessages') || document.getElementById('aiEyeResult');

    if (!aiEyeModal) return;

    function openModal() {
        aiEyeModal.classList.remove('hidden');
        aiEyeModal.classList.add('flex');
        if (input) input.focus();
    }
    
    function closeModal() {
        aiEyeModal.classList.add('hidden');
        aiEyeModal.classList.remove('flex');
    }

    function renderResult(analysis) {
        if (!resultBox) return;
        
        if (resultBox.id === 'aiMessages') {
            const wrapper = document.createElement('div');
            wrapper.className = "p-2 rounded-lg bg-slate-800 border border-cyan-500/20 text-right space-y-1 mt-1";
            
            const levelP = document.createElement('p');
            levelP.className = `${analysis.color} font-bold text-xs`;
            levelP.textContent = `المستوى: ${analysis.level} (${analysis.score}/100)`;

            const msgP = document.createElement('p');
            msgP.className = "text-[11px] text-slate-200";
            msgP.textContent = analysis.msg;

            wrapper.append(levelP, msgP);
            resultBox.appendChild(wrapper);
            resultBox.scrollTop = resultBox.scrollHeight;
            return;
        }

        resultBox.textContent = "";
        const wrapper = document.createElement('div');
        wrapper.className = "p-4 rounded-lg bg-zinc-900 border border-zinc-700 shadow-inner text-right";
        const levelP = document.createElement('p');
        levelP.className = `${analysis.color} font-bold text-sm`;
        levelP.textContent = `المستوى: ${analysis.level} - ${analysis.score}/100`;
        const msgP = document.createElement('p');
        msgP.className = "text-sm mt-2 text-zinc-200";
        msgP.textContent = analysis.msg;
        wrapper.append(levelP, msgP);
        resultBox.appendChild(wrapper);
    }

    aiEyeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    
    closeBtn?.addEventListener('click', closeModal);
    aiEyeModal.addEventListener('click', (e) => { if (e.target === aiEyeModal) closeModal(); });

    analyzeBtn?.addEventListener('click', () => {
        const textVal = input?.value || "";
        if (!textVal.trim()) return;
        
        if (resultBox && resultBox.id === 'aiMessages') {
            const userMsg = document.createElement('div');
            userMsg.className = "p-2 rounded-lg bg-cyan-500/10 text-cyan-300 text-right text-xs";
            userMsg.textContent = textVal;
            resultBox.appendChild(userMsg);
        }

        setTimeout(() => {
            const analysis = TarimAI.analyze(textVal);
            renderResult(analysis);
            if (input) input.value = "";
        }, 200);
    });

    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            analyzeBtn?.click();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSovereignEye);
} else {
    initSovereignEye();
}
