// public/ai-eye.js - TARIM OS Sovereign AI Eye - PRODUCTION READY - XSS PROTECTED
"use strict";

(function() {
    // 1. قاموس سيادي محصن - لا يمكن التعديل عليه من الخارج
    const BANNED_PATTERNS = Object.freeze([
        { word: "سب", weight: 30 },
        { word: "كراهية", weight: 30 },
        { word: "اختراق", weight: 40 },
        { word: "هاك", weight: 40 },
        { word: "spam", weight: 30 },
        { word: "hack", weight: 40 },
        { word: "script", weight: 50 } // لمنع حقن XSS
    ]);

    const TarimAIEye = Object.freeze({
        version: "Sovereign v1.0 Imperial",
        offline: true,

        // تحليل آمن 100% بدون حقن
        analyze: function(text) {
            if (!text || typeof text!== 'string') {
                return { level: "آمن", score: 100, msg: "نص فارغ - آمن", color: "text-emerald-400", safe: true };
            }

            // حماية من إغراق الذاكرة - حد أقصى 2000 حرف
            const cleanText = text.trim().substring(0, 2000);
            if (!cleanText) {
                return { level: "آمن", score: 100, msg: "نص فارغ - آمن", color: "text-emerald-400", safe: true };
            }

            const lower = cleanText.toLowerCase();
            let score = 100;
            let found = [];

            BANNED_PATTERNS.forEach(item => {
                if (lower.includes(item.word)) {
                    score -= item.weight;
                    found.push(item.word);
                }
            });

            score = Math.max(0, score);

            if (score >= 80) {
                return { level: "سيادي آمن", score, msg: "المحتوى آمن ومطابق للقيم الحضرمية", color: "text-emerald-400", safe: true, found };
            }
            if (score >= 50) {
                return { level: "مراجعة", score, msg: `يحتاج مراجعة - وجد: ${found.join(', ')}`, color: "text-amber-400", safe: false, found };
            }
            return { level: "محظور", score, msg: `محظور سيادياً - ${found.join(', ')}`, color: "text-red-400", safe: false, found };
        }
    });

    // تصدير آمن
    window.TarimAI = TarimAIEye;

    // 2. واجهة محصنة ضد XSS - تستخدم textContent وليس innerHTML أبداً
    document.addEventListener('DOMContentLoaded', () => {
        const aiEyeBtn = document.getElementById('openAiEyeBtn');
        const aiEyeModal = document.getElementById('aiEyeModal');
        const closeBtn = document.getElementById('closeAiEyeBtn');
        const analyzeBtn = document.getElementById('analyzeContentBtn');
        const input = document.getElementById('aiEyeInput');
        const resultBox = document.getElementById('aiEyeResult');

        if (!aiEyeModal) {
            console.log('[TARIM AI] عين الذكاء السيادي جاهزة - وضع Offline');
            return;
        }

        function openModal() {
            aiEyeModal.classList.remove('hidden');
            aiEyeModal.classList.add('flex');
            if (input) input.focus();
        }

        function closeModal() {
            aiEyeModal.classList.add('hidden');
            aiEyeModal.classList.remove('flex');
            if (resultBox) resultBox.innerHTML = ""; // تنظيف آمن عند الإغلاق
        }

        function renderResult(analysis) {
            if (!resultBox) return;

            // بناء آمن 100% - لا innerHTML لنص المستخدم أبداً
            resultBox.innerHTML = ""; // مسح
            const wrapper = document.createElement('div');
            wrapper.className = "p-4 rounded-lg bg-zinc-900 border border-zinc-700 shadow-inner";

            const levelP = document.createElement('p');
            levelP.className = `${analysis.color} font-bold text-sm`;
            levelP.textContent = `المستوى: ${analysis.level} - ${analysis.score}/100`; // textContent = آمن

            const msgP = document.createElement('p');
            msgP.className = "text-sm mt-2 text-zinc-200";
            msgP.textContent = analysis.msg; // آمن

            const metaP = document.createElement('p');
            metaP.className = "text-[10px] text-zinc-500 mt-3 tracking-widest";
            metaP.textContent = `TarimAI ${TarimAIEye.version} - Offline Sovereign - No Internet`;

            wrapper.appendChild(levelP);
            wrapper.appendChild(msgP);
            wrapper.appendChild(metaP);
            resultBox.appendChild(wrapper);
        }

        // أحداث آمنة
        if (aiEyeBtn) aiEyeBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        // إغلاق عند الضغط خارج المودال
        aiEyeModal.addEventListener('click', (e) => {
            if (e.target === aiEyeModal) closeModal();
        });

        // تحليل مع حماية من الإغراق (Debounce)
        let analyzing = false;
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                if (analyzing) return;
                analyzing = true;
                analyzeBtn.disabled = true;
                analyzeBtn.textContent = "جاري التحليل...";

                setTimeout(() => {
                    const text = input? input.value : "";
                    const analysis = TarimAIEye.analyze(text);
                    renderResult(analysis);
                    analyzing = false;
                    analyzeBtn.disabled = false;
                    analyzeBtn.textContent = "تحليل سيادي";
                }, 300); // محاكاة ذكاء + منع إغراق
            });
        }

        // تحليل مباشر عند الكتابة مع تأخير
        if (input) {
            let timeout;
            input.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (input.value.trim().length > 2) {
                        const analysis = TarimAIEye.analyze(input.value);
                        renderResult(analysis);
                    }
                }, 800);
            });
        }

        console.log('[TARIM AI] 👁️ Sovereign Eye Loaded - XSS Protected - Offline Mode');
    });
})();
