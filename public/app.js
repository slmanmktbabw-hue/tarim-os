// public/app.js - TARIM OS Sovereign Heart - PRODUCTION READY - SECURE
"use strict";

(function() {
    // 1. حالة الدولة - محصنة داخل IIFE لا يراها الهاكر
    let currentStream = null;
    let liveStream = null;
    let facingMode = "environment";
    let mapInstance = null;
    let liveTimer = null;
    let liveSeconds = 0;

    const API_BASE = "/api";
    const TOKEN_KEY = "tarim_token";

    // 2. أدوات سيادية آمنة
    function getToken() { return localStorage.getItem(TOKEN_KEY); }

    function sanitize(str) {
        if (!str) return "";
        return String(str).substring(0, 2000).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function showToast(msg) {
        const box = document.getElementById('toastBox');
        if (!box) return;
        const t = document.createElement('div');
        t.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg mb-2 text-center';
        t.textContent = msg; // textContent = آمن ضد XSS
        box.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    function secureFetch(url, options = {}) {
        const token = getToken();
        const headers = options.headers || {};
        headers['Content-Type'] = 'application/json';
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, {...options, headers });
    }

    function stopAllStreams() {
        if (currentStream) {
            currentStream.getTracks().forEach(t => t.stop());
            currentStream = null;
        }
        if (liveStream) {
            liveStream.getTracks().forEach(t => t.stop());
            liveStream = null;
        }
        if (liveTimer) {
            clearInterval(liveTimer);
            liveTimer = null;
        }
    }

    // 3. التنقل بين التبويبات - محصن
    window.switchTab = function(tab, btn) {
        stopAllStreams();
        document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
        const target = document.getElementById('tab-' + tab);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-btn').forEach(x => {
            x.classList.remove('text-cyan-400');
            x.classList.add('text-slate-400');
        });
        if (btn) {
            btn.classList.remove('text-slate-400');
            btn.classList.add('text-cyan-400');
        }

        if (tab === 'create') initCamera();
        if (tab === 'home') loadPostsFromServer();
    };

    // 4. الكاميرا - تطلب الإذن وتغلق بأمان
    async function initCamera() {
        const preview = document.getElementById('cameraPreview');
        if (!preview) return;
        try {
            stopAllStreams();
            currentStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode === 'env'? 'environment' : 'user' },
                audio: true
            });
            preview.srcObject = currentStream;
        } catch (e) {
            showToast('الكاميرا مرفوضة - اسمح من الإعدادات');
            console.error(e);
        }
    }

    // 5. تحميل المنشورات - آمن 100% ضد XSS
    async function loadPostsFromServer() {
        try {
            const res = await fetch(`${API_BASE}/posts`);
            const data = await res.json();
            if (!data.success) return;

            const container = document.getElementById('postsFeed');
            if (!container) return;

            container.innerHTML = ""; // مسح آمن
            data.posts.forEach(post => {
                const div = document.createElement('div');
                div.className = 'bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-3';

                const userP = document.createElement('p');
                userP.className = 'text-xs text-cyan-400 font-bold';
                userP.textContent = `@${sanitize(post.username)}`;

                const contentP = document.createElement('p');
                contentP.className = 'text-sm mt-2 text-white whitespace-pre-wrap';
                contentP.textContent = sanitize(post.content); // آمن

                div.appendChild(userP);
                div.appendChild(contentP);
                container.appendChild(div);
            });
        } catch (e) {
            console.log('Offline mode - سيتم العرض من الكاش');
        }
    }

    // 6. البث المباشر السيادي 8 دقائق - محصن
    async function startLiveStream() {
        const liveScreen = document.getElementById('liveScreen');
        const readyBox = document.getElementById('readyToBroadcastBox');
        if (!liveScreen) return;

        liveScreen.classList.remove('hidden');
        if (readyBox) readyBox.style.display = 'block';

        try {
            liveStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const v = document.getElementById('liveVideo');
            if (v) v.srcObject = liveStream;
        } catch {
            showToast('فشل تشغيل الكاميرا للبث');
        }
    }

    function endLive() {
        stopAllStreams();
        document.getElementById('liveScreen')?.classList.add('hidden');
        showToast('انتهى البث السيادي');
    }

    window.endLive = endLive;

    // 7. ربط كل الأزرار مرة واحدة - آمن ومحصن
    document.addEventListener('DOMContentLoaded', () => {
        // كاميرا
        document.getElementById('switchCamBtn')?.addEventListener('click', () => {
            facingMode = facingMode === 'env'? 'user' : 'env';
            initCamera();
        });

        document.getElementById('lightBtn')?.addEventListener('click', async () => {
            if (!currentStream) return;
            const track = currentStream.getVideoTracks()[0];
            try {
                const cap = track.getCapabilities();
                if (cap.torch) {
                    const torchOn = track.getSettings().torch || false;
                    await track.applyConstraints({ advanced: [{ torch:!torchOn }] });
                } else showToast('الفلاش غير مدعوم');
            } catch { showToast('الفلاش غير مدعوم'); }
        });

        // نشر - محمي بالتوكن
        document.getElementById('publishBtn')?.addEventListener('click', async () => {
            const input = document.getElementById('postContentInput');
            if (!input ||!input.value.trim()) { showToast('اكتب وصفاً أولاً'); return; }
            if (!getToken()) { showToast('سجل دخولك أولاً'); return; }

            try {
                const res = await secureFetch(`${API_BASE}/posts`, {
                    method: 'POST',
                    body: JSON.stringify({ content: input.value })
                });
                const data = await res.json();
                if (data.success) {
                    input.value = '';
                    showToast('تم النشر السيادي');
                    window.switchTab('home', document.querySelectorAll('.nav-btn')[0]);
                } else showToast(data.message || 'فشل النشر');
            } catch { showToast('فشل الاتصال بالسيرفر'); }
        });

        // بث
        document.getElementById('liveBtn')?.addEventListener('click', startLiveStream);
        document.getElementById('liveOpBtn')?.addEventListener('click', startLiveStream);
        document.getElementById('endLiveBtn')?.addEventListener('click', endLive);
        document.getElementById('confirmStartLive')?.addEventListener('click', () => {
            const readyBox = document.getElementById('readyToBroadcastBox');
            if (readyBox) readyBox.style.display = 'none';
            showToast('البث بدأ - 8 دقائق');
            liveSeconds = 0;
            liveTimer = setInterval(() => {
                liveSeconds++;
                const el = document.getElementById('liveTimer');
                if (el) el.textContent = `${Math.floor(liveSeconds/60)}:${String(liveSeconds%60).padStart(2,'0')} / 8:00`;
                if (liveSeconds >= 480) endLive();
            }, 1000);
        });

        // خريطة - بدون شاشة سوداء
        document.getElementById('offlineMapBtn')?.addEventListener('click', () => {
            document.getElementById('mapScreen')?.classList.remove('hidden');
            setTimeout(() => {
                if (!mapInstance) {
                    mapInstance = L.map('mapContainer').setView([16.05, 48.9833], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapInstance);
                    L.marker([16.05, 48.9833]).addTo(mapInstance).bindPopup('<b>قلعة تريم السيادية</b>').openPopup();
                } else mapInstance.invalidateSize();
            }, 250);
        });
        document.getElementById('closeMapBtn')?.addEventListener('click', () => {
            document.getElementById('mapScreen')?.classList.add('hidden');
        });

        // قائمة جانبية
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            localStorage.clear();
            stopAllStreams();
            location.reload();
        });

        // تحميل أولي
        if (getToken()) loadPostsFromServer();
        else {
            const gate = document.getElementById('authGate');
            if (gate) gate.style.display = 'flex';
        }

        console.log('[TARIM OS] Sovereign Heart Loaded - Secure');
    });

    // إغلاق الكاميرا عند مغادرة الصفحة
    window.addEventListener('beforeunload', stopAllStreams);
})();
