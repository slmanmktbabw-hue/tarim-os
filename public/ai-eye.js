// public/ai-eye.js - عين الذكاء السيادي Offline - TARIM OS V1.0 Official
// يعمل 100% بدون إنترنت - تحليل النصوص الحضرمية السيادية

(function() {
    const TarimAIEye = {
        version: "Sovereign v1.0",
        offline: true,
        analyze: function(text) {
            if (!text) return { level: "آمن", score: 100, msg: "نص فارغ - آمن" };
            const lower = text.toLowerCase();
            // كلمات محظورة سيادية
            const banned = ["سب", "كراهية", "اختراق", "هاك", "spam"];
            let score = 100;
            let found = [];
            banned.forEach(w => {
                if (lower.includes(w)) { score -= 30; found.push(w); }
            });
            if (score >= 80) return { level: "سيادي آمن", score, msg: "✅ المحتوى آمن ومطابق للقيم الحضرمية", color: "text-green-400" };
            if (score >= 50) return { level: "مراجعة", score, msg: "⚠️ يحتاج مراجعة - وجد: " + found.join(','), color: "text-yellow-400" };
            return { level: "محظور", score, msg: "❌ محظور سيادياً - " + found.join(','), color: "text-red-400" };
        }
    };

    window.TarimAI = TarimAIEye;

    document.addEventListener('DOMContentLoaded', () => {
        const aiEyeBtn = document.getElementById('openAiEyeBtn');
        const aiEyeModal = document.getElementById('aiEyeModal');
        const closeBtn = document.getElementById('closeAiEyeBtn');
        const analyzeBtn = document.getElementById('analyzeContentBtn');
        const input = document.getElementById('aiEyeInput');
        const result = document.getElementById('aiEyeResult');

        function openModal() {
            if (aiEyeModal) {
                aiEyeModal.classList.remove('hidden');
                aiEyeModal.classList.add('flex');
            } else {
                alert('👁️ عين الذكاء السيادي v1.0 تعمل Offline بكفاءة تامة في حماية قلعة تريم.');
            }
        }

        function closeModal() {
            if (aiEyeModal) {
                aiEyeModal.classList.add('hidden');
                aiEyeModal.classList.remove('flex');
            }
        }

        if (aiEyeBtn) aiEyeBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                const text = input ? input.value : "";
                const analysis = TarimAIEye.analyze(text);
                if (result) {
                    result.innerHTML = `
                        <div class="p-3 rounded bg-gray-900 border border-gray-700">
                            <p class="${analysis.color} font-bold">المستوى: ${analysis.level} - ${analysis.score}/100</p>
                            <p class="text-sm mt-1">${analysis.msg}</p>
                            <p class="text-xs text-gray-400 mt-2">TarimAI Sovereign Offline - لا يحتاج إنترنت</p>
                        </div>
                    `;
                }
            });
        }

        console.log('👁️ Tarim AI Eye Sovereign v1.0 Loaded - Offline Mode');
    });
})();
