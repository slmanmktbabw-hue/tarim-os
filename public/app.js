/**
 * TARIM OS - النظام السيادي الإمبراطوري
 * ملف الجافاسكريبت الرئيسي: public/app.js
 */

let currentStream = null;
let useFrontCamera = false;
let mapInstance = null;
let likeCount = 120;

document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('tarim_user');
    const authGate = document.getElementById('authGate');
    if (user === 'AL' && authGate) {
        authGate.style.display = 'none';
        authGate.classList.add('hidden');
    }
    initCameraStream();
    loadFeeds();
    loadInboxMessages();
    initOperationalTools();
});

function showToast(msg) {
    const box = document.getElementById('toastBox');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg mb-2 text-center animate-bounce';
    t.innerText = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function forceUnlockCastle() {
    const gate = document.getElementById('authGate');
    if (gate) { 
        gate.style.display = 'none'; 
        gate.classList.add('hidden'); 
    }
    localStorage.setItem('tarim_user', 'AL');
    showToast('👑 أهلاً بك يا أبو سلمان في القلعة السيادية');
}

function lockCastleAgain() {
    const gate = document.getElementById('authGate');
    if (gate) { 
        gate.style.display = 'flex'; 
        gate.classList.remove('hidden'); 
    }
    localStorage.removeItem('tarim_user');
    showToast('🚪 تم إقفال القلعة بنجاح');
}

function switchTab(tabName, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    const target = document.getElementById('tab-' + tabName);
    if (target) target.classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-cyan-400');
        btn.classList.add('text-slate-400');
    });
    if (btnElement) {
        btnElement.classList.remove('text-slate-400');
        btnElement.classList.add('text-cyan-400');
    }
    if (tabName === 'profile') backToProfile();
    
    if (tabName === 'create') {
        initCameraStream();
    } else {
        stopCameraStream();
    }
}

async function initCameraStream() {
    const videoEl = document.getElementById('liveCameraFeed');
    if (!videoEl) return;
    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        const constraints = {
            video: { facingMode: useFrontCamera ? "user" : "environment" },
            audio: true
        };
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoEl.srcObject = currentStream;
    } catch (err) {
        console.log("تشغيل الكاميرا الافتراضي نشط:", err);
    }
}

function stopCameraStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

function switchCameraFacing() {
    useFrontCamera = !useFrontCamera;
    initCameraStream();
    showToast(useFrontCamera ? "🔄 تم التبديل للكاميرا الأمامية" : "🔄 تم التبديل للكاميرا الخلفية");
}

function applyFilter(filterClass) {
    const videoEl = document.getElementById('liveCameraFeed');
    if (!videoEl) return;
    videoEl.className = "w-full h-full object-cover " + filterClass;
    showToast('✨ تم تطبيق الفلتر الإمبراطوري بنجاح');
}

function openGiftsPanel() {
    showToast('🎁 أرسل الإمبراطور هدية: تاج سيادي 👑 (+500 نقطة رصيد)');
}

function startLiveBroadcast() {
    const badge = document.getElementById('liveBadge');
    if (badge) badge.classList.remove('hidden');
    switchTab('create', document.querySelectorAll('.nav-btn')[2]);
    showToast('🔴 بدأ البث المباشر السيادي بشاشة كاملة');
}

function triggerLike() {
    likeCount++;
    const display = document.getElementById('likeCountDisplay');
    const profileLikes = document.getElementById('profileLikes');
    if (display) display.innerText = likeCount;
    if (profileLikes) profileLikes.innerText = likeCount;
    showToast('❤️ تم الإعجاب بالفيديو السيادي');
}

function openCommentModal() {
    switchTab('inbox', document.querySelectorAll('.nav-btn')[3]);
    showToast('💬 انتقلت لصندوق التعليقات والردود الآمنة');
}

function saveCurrentVideo() {
    showToast('⭐ تم حفظ الفيديو في قائمة الفيديوهات المفضلة دون اتصال');
}

function publishPostDirectly() {
    const input = document.getElementById('postContentInput');
    const text = input ? input.value.trim() : "فيديو وكاميرا سيادية مباشرة";
    
    let feeds = JSON.parse(localStorage.getItem('tarim_feeds') || '[]');
    feeds.unshift({
        caption: text,
        time: new Date().toLocaleTimeString(),
        author: '@AL 👑'
    });
    localStorage.setItem('tarim_feeds', JSON.stringify(feeds));
    
    if (input) input.value = '';
    showToast('🚀 تم النشر بنجاح وحفظه في القائمة الرئيسية');
    loadFeeds();
    switchTab('home', document.querySelectorAll('.nav-btn')[0]);
}

function loadFeeds() {
    const placeholder = document.getElementById('homeDefaultPlaceholder');
    const list = document.getElementById('dynamicFeedsList');
    if (!list) return;

    let feeds = JSON.parse(localStorage.getItem('tarim_feeds') || '[]');
    if (feeds.length === 0) {
        if (placeholder) placeholder.classList.remove('hidden');
        list.classList.add('hidden');
        return;
    }

    if (placeholder) placeholder.classList.add('hidden');
    list.classList.remove('hidden');

    list.innerHTML = feeds.map(f => `
        <div class="bg-slate-900 border border-cyan-500/30 p-3 rounded-xl space-y-2 text-right shadow-md">
            <div class="flex justify-between items-center text-[10px] text-cyan-400">
                <span>${f.author}</span>
                <span class="text-slate-500">${f.time}</span>
            </div>
            <p class="text-xs text-white">${f.caption}</p>
            <div class="w-full h-32 bg-slate-950 rounded-lg flex items-center justify-center text-slate-500 text-xs border border-slate-800">
                📹 بث / فيديو سيادي محفوظ
            </div>
        </div>
    `).join('');
}

function sendInboxMessage() {
    const input = document.getElementById('inboxInputField');
    if (input && input.value.trim() !== '') {
        let msgs = JSON.parse(localStorage.getItem('tarim_inbox') || '[]');
        msgs.push({ sender: 'الإمبراطور AL', text: input.value.trim(), time: new Date().toLocaleTimeString() });
        localStorage.setItem('tarim_inbox', JSON.stringify(msgs));
        input.value = '';
        loadInboxMessages();
        showToast('💬 تم إرسال الرسالة أو التعليق السيادي');
    } else {
        showToast('⚠️ يرجى كتابة نص الرسالة أولاً');
    }
}

function loadInboxMessages() {
    const list = document.getElementById('inboxMessagesList');
    if (!list) return;
    let msgs = JSON.parse(localStorage.getItem('tarim_inbox') || '[]');
    if (msgs.length === 0) {
        list.innerHTML = `<p class="text-[11px] text-slate-400 text-center py-4">صندوق الوارد والتعليقات آمن وجاهز.</p>`;
        return;
    }
    list.innerHTML = msgs.map(m => `
        <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs space-y-1">
            <div class="flex justify-between text-[10px] text-cyan-400">
                <span>${m.sender}</span>
                <span class="text-slate-500">${m.time}</span>
            </div>
            <p class="text-white">${m.text}</p>
        </div>
    `).join('');
}

function initOperationalTools() {
    const opQrBtn = document.getElementById('opQrBtn');
    if (opQrBtn) {
        opQrBtn.addEventListener('click', () => {
            const qrBox = document.getElementById('operationsQrBox');
            if (qrBox && typeof QRCode !== 'undefined') {
                qrBox.classList.toggle('hidden');
                qrBox.innerHTML = "";
                if (!qrBox.classList.contains('hidden')) {
                    new QRCode(qrBox, { text: "https://tarimos.org/operations/qr", width: 100, height: 100 });
                    showToast('🧾 تم إصدار ختم QR السيادي');
                }
            }
        });
    }

    const opMapBtn = document.getElementById('opMapBtn');
    if (opMapBtn) {
        opMapBtn.addEventListener('click', () => {
            const mapContainer = document.getElementById('mapContainer');
            if (mapContainer) {
                mapContainer.classList.toggle('hidden');
                if (!mapContainer.classList.contains('hidden') && !mapInstance && typeof L !== 'undefined') {
                    mapInstance = L.map('mapContainer').setView([16.0608, 48.9814], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: 'TARIM OS Offline Map'
                    }).addTo(mapInstance);
                    L.marker([16.0608, 48.9814]).addTo(mapInstance).bindPopup('قلعة تريم السيادية - أبو سلمان').openPopup();
                    showToast('🗺️ خريطة تريم Offline مفعلة');
                }
            }
        });
    }
}

function showSubPage(pageId) {
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.add('hidden');
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    
    const target = document.getElementById('sub-' + pageId);
    if (target) {
        target.classList.remove('hidden');
        if (pageId === 'qr-page') {
            const qrContainer = document.getElementById('qrcode');
            if (qrContainer && typeof QRCode !== 'undefined') {
                qrContainer.innerHTML = "";
                new QRCode(qrContainer, { text: "https://tarimos.org/user/AL", width: 128, height: 128 });
            }
        }
    }
}

function backToProfile() {
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.remove('hidden');
}
