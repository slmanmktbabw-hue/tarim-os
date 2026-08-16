// TARIM OS V8.6 KING SECURE - Main Application Script
const KING_KEY = 'TARIM_KING_2026';
const KING_USERS = ['Gooaz', 'google_529@', 'أبو سلمان'];

let currentUser = {
    username: 'Gooaz',
    displayName: 'الإمبراطور AL',
    okxId: '0x53...c0af6',
    isKing: true,
    followers: 1250,
    following: 140,
    likes: 9840,
    okxBalance: 520.50
};

let posts = [
    { id: 1, author: 'Google_529@', text: 'مرحباً بكم في منصة تريم الإمبراطورية V8.6 KING SECURE 🌴 #تريم #حضرموت', likes: 120, comments: 45, type: 'post' }
];

let localStream = null;
let isLiveActive = false;
let liveTimerInterval = null;
let liveSeconds = 0;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavigation();
    initCameraAndCreate();
    initProfileAndSettings();
    initAIHelper();
    initOperations();
    renderAllFeeds();
    loadUserBg();
});

// Toast Notification
function showToast(message, type = 'info') {
    const box = document.getElementById('toastBox');
    if (!box) return;
    const alertEl = document.createElement('div');
    alertEl.className = `p-3 mb-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all transform translate-y-0 ${type === 'error' ? 'bg-rose-600' : 'bg-cyan-600'}`;
    alertEl.textContent = sanitizeText(message);
    box.appendChild(alertEl);
    setTimeout(() => {
        alertEl.style.opacity = '0';
        setTimeout(() => alertEl.remove(), 300);
    }, 3000);
}

function sanitizeText(str) {
    if (!str) return '';
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Auth Gate
function initAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const authGate = document.getElementById('authGate');
    const loginError = document.getElementById('loginError');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const userVal = document.getElementById('userPhoneOrEmail').value.trim();
            const passVal = document.getElementById('userPass').value.trim();

            if (userVal === '' || passVal === '') {
                loginError.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
                loginError.classList.remove('hidden');
                return;
            }

            currentUser.username = userVal;
            currentUser.isKing = KING_USERS.includes(userVal) || userVal.toLowerCase().includes('gooaz');
            
            authGate.classList.add('hidden');
            showToast('تم تسجيل الدخول بنجاح إلى القلعة السيادية 👑');
            updateProfileUI();
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authGate.classList.remove('hidden');
            showToast('تم تسجيل الخروج بنجاح');
        });
    }
}

// Navigation Tabs
function initNavigation() {
    const navButtons = document.querySelectorAll('nav button[data-action], button[data-action]');
    navButtons.forEach(btn => {
        const action = btn.getAttribute('data-action');
        if (!action) return;

        btn.addEventListener('click', () => {
            if (action.startsWith('tab')) {
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                const tabId = 'tab-' + action.replace('tab', '').toLowerCase();
                const targetTab = document.getElementById(tabId);
                if (targetTab) targetTab.classList.add('active');

                document.querySelectorAll('nav button').forEach(b => b.classList.remove('text-cyan-400'));
                document.querySelectorAll('nav button').forEach(b => b.classList.add('text-slate-400'));
                if (btn.closest('nav')) {
                    btn.classList.remove('text-slate-400');
                    btn.classList.add('text-cyan-400');
                }
            } else if (action === 'openAccountSettings') {
                showSubPage('sub-account-settings');
            } else if (action === 'openSecurity') {
                showSubPage('sub-security-settings');
            } else if (action === 'openPromo') {
                showSubPage('sub-promo-page');
            } else if (action === 'openQrPage') {
                showSubPage('sub-qr-page');
                generateQRCodeDisplay();
            } else if (action === 'openManagePosts') {
                showSubPage('sub-manage-posts');
                renderManagePosts();
            } else if (action === 'backToProfile') {
                hideAllSubPages();
            } else if (action === 'openOkx') {
                showToast(`رصيد OKX الملكي: $${currentUser.okxBalance} USDT 💰`);
            } else if (action === 'openActivity') {
                showToast('مركز النشاطات السيادية: الجلسة مؤمنة بنسبة 100%');
            } else if (action === 'openOffline') {
                showToast('لا توجد فيديوهات مخزنة دون اتصال حالياً');
            } else if (action === 'openCommerce') {
                showToast('المجموعة التجارية: مكتب أبو سلمان للخدمات العامة (تعز / تريم)');
            } else if (action === 'shareProfileLink') {
                navigator.clipboard?.writeText(window.location.href);
                showToast('تم نسخ رابط الملف الشخصي السيادي 🔗');
            }
        });
    });
}

function showSubPage(pageId) {
    document.getElementById('profile-main').classList.add('hidden');
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');
}

function hideAllSubPages() {
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    document.getElementById('profile-main').classList.remove('hidden');
}

// Camera & Create
function initCameraAndCreate() {
    const videoElem = document.getElementById('cameraPreview');
    const uploadBtn = document.getElementById('uploadTriggerBtn');
    const videoInput = document.getElementById('videoInput');
    const publishBtn = document.getElementById('publishBtn');
    const startLiveBtn = document.getElementById('startLiveBtn');
    const stopLiveBtn = document.getElementById('stopLiveBtn');
    const stopLiveBtnFull = document.getElementById('stopLiveBtnFull');
    const endLiveTopBtn = document.getElementById('endLiveTopBtn');
    const cameraWrap = document.getElementById('cameraWrap');
    const liveControlsFull = document.getElementById('liveControlsFull');
    const normalControls = document.getElementById('normalControls');
    const liveBadge = document.getElementById('liveBadge');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                if (videoElem) videoElem.srcObject = stream;
            })
            .catch(err => {
                console.warn('Camera access unavailable:', err);
            });
    }

    if (uploadBtn && videoInput) {
        uploadBtn.addEventListener('click', () => videoInput.click());
        videoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                showToast('تم إرفاق الملف بنجاح جاهز للنشر 📹');
            }
        });
    }

    if (startLiveBtn) {
        startLiveBtn.addEventListener('click', () => {
            isLiveActive = true;
            liveBadge.classList.remove('hidden');
            endLiveTopBtn.classList.remove('hidden');
            cameraWrap.classList.add('fullscreen-live');
            liveControlsFull.classList.remove('hidden');
            normalControls.classList.add('hidden');
            startLiveTimer();
            showToast('🔴 بدأ البث المباشر السيادي بملء الشاشة');
        });
    }

    const stopLiveHandler = () => {
        isLiveActive = false;
        liveBadge.classList.add('hidden');
        endLiveTopBtn.classList.add('hidden');
        cameraWrap.classList.remove('fullscreen-live');
        liveControlsFull.classList.add('hidden');
        normalControls.classList.remove('hidden');
        stopLiveTimer();
        showToast('⏹️ تم إنهاء البث المباشر بنجاح');
    };

    if (stopLiveBtn) stopLiveBtn.addEventListener('click', stopLiveHandler);
    if (stopLiveBtnFull) stopLiveBtnFull.addEventListener('click', stopLiveHandler);
    if (endLiveTopBtn) endLiveTopBtn.addEventListener('click', stopLiveHandler);

    if (publishBtn) {
        publishBtn.addEventListener('click', () => {
            const input = document.getElementById('postContentInput');
            const val = input ? input.value.trim() : '';
            if (!val && !videoInput.files.length) {
                showToast('يرجى كتابة وصف أو إرفاق وسائط النشر', 'error');
                return;
            }
            posts.unshift({
                id: Date.now(),
                author: currentUser.username,
                text: sanitizeText(val || 'منشور جديد سيادي'),
                likes: 0,
                comments: 0,
                type: 'post'
            });
            if (input) input.value = '';
            renderAllFeeds();
            showToast('🚀 تم نشر المحتوى بنجاح في القلعة');
        });
    }
}

function startLiveTimer() {
    liveSeconds = 0;
    const timerElem = document.getElementById('liveTimer');
    liveTimerInterval = setInterval(() => {
        liveSeconds++;
        const mins = String(Math.floor(liveSeconds / 60)).padStart(2, '0');
        const secs = String(liveSeconds % 60).padStart(2, '0');
        if (timerElem) timerElem.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopLiveTimer() {
    if (liveTimerInterval) clearInterval(liveTimerInterval);
    const timerElem = document.getElementById('liveTimer');
    if (timerElem) timerElem.textContent = '00:00';
}

// Feeds & Rendering
function renderAllFeeds() {
    const postsFeed = document.getElementById('postsFeed');
    if (!postsFeed) return;
    postsFeed.innerHTML = '';

    posts.forEach(p => {
        const div = document.createElement('div');
        div.className = 'glass p-4 rounded-2xl space-y-2 border border-cyan-500/30';
        div.innerHTML = `
            <div class="flex justify-between items-center text-xs text-cyan-400 font-bold">
                <span>👑 ${sanitizeText(p.author)}</span>
                <span class="text-[10px] text-slate-400">تريم - حضرموت</span>
            </div>
            <p class="text-xs text-white">${sanitizeText(p.text)}</p>
            <div class="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
                <button onclick="likePost(${p.id})" class="flex items-center gap-1 hover:text-rose-400">❤️ <span>${p.likes}</span></button>
                <button class="flex items-center gap-1">💬 <span>${p.comments}</span> تعليقات</button>
                <button onclick="sharePost()" class="flex items-center gap-1">🚀 مشاركة</button>
            </div>
        `;
        postsFeed.appendChild(div);
    });
}

function likePost(id) {
    const post = posts.find(p => p.id === id);
    if (post) {
        post.likes++;
        renderAllFeeds();
        showToast('❤️ تم تسجيل الإعجاب');
    }
}

function sharePost() {
    showToast('🔗 تم نسخ رابط المنشور السيادي');
}

function renderManagePosts() {
    const list = document.getElementById('managePostsList');
    if (!list) return;
    list.innerHTML = '';

    if (posts.length === 0) {
        list.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">لا توجد منشورات حالياً</p>';
        return;
    }

    posts.forEach(p => {
        const item = document.createElement('div');
        item.className = 'bg-slate-900 border border-slate-700 p-3 rounded-xl flex justify-between items-center text-xs';
        item.innerHTML = `
            <span class="truncate flex-1 ml-2 text-right">${sanitizeText(p.text)}</span>
            <button onclick="deletePost(${p.id})" class="bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg font-bold border border-rose-500/40">حذف</button>
        `;
        list.appendChild(item);
    });
}

function deletePost(id) {
    posts = posts.filter(p => p.id !== id);
    renderManagePosts();
    renderAllFeeds();
    showToast('🗑️ تم حذف المنشور بنجاح');
}

// Profile & Settings
function initProfileAndSettings() {
    const saveSettingsBtn = document.getElementById('saveAccountSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('settingsDisplayName').value.trim();
            const okxInput = document.getElementById('settingsOkxId').value.trim();
            
            if (nameInput) currentUser.displayName = nameInput;
            if (okxInput) currentUser.okxId = okxInput;

            updateProfileUI();
            hideAllSubPages();
            showToast('💾 تم حفظ التعديلات السيادية بنجاح');
        });
    }
}

function updateProfileUI() {
    const nameDisplay = document.getElementById('profileNameDisplay');
    const homeUsername = document.getElementById('homeUsernameDisplay');
    if (nameDisplay) nameDisplay.textContent = currentUser.displayName;
    if (homeUsername) homeUsername.textContent = `TARIM OS V8.6 - ${currentUser.displayName}`;
}

// Background Customization
function changeBg(color) {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = color;
    localStorage.setItem('tarim_bg_color', color);
    localStorage.removeItem('tarim_bg_image');
    showToast('🎨 تم تغيير الخلفية بنجاح');
}

function changeBgImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgUrl = e.target.result;
            document.body.style.backgroundImage = `url('${imgUrl}')`;
            localStorage.setItem('tarim_bg_image', imgUrl);
            showToast('🖼️ تم تعيين الخلفية الشخصية بنجاح');
        };
        reader.readAsDataURL(file);
    }
}

function loadUserBg() {
    const savedImg = localStorage.getItem('tarim_bg_image');
    const savedColor = localStorage.getItem('tarim_bg_color');
    if (savedImg) {
        document.body.style.backgroundImage = `url('${savedImg}')`;
    } else if (savedColor) {
        document.body.style.backgroundColor = savedColor;
    }
}

// AI Helper (عين الذكاء)
function initAIHelper() {
    const aiEyeBtn = document.getElementById('aiEyeBtn');
    const aiModal = document.getElementById('aiModal');
    const aiCloseBtn = document.getElementById('aiCloseBtn');
    const aiSendBtn = document.getElementById('aiSendBtn');
    const aiInput = document.getElementById('aiInput');
    const aiMessages = document.getElementById('aiMessages');

    if (aiEyeBtn && aiModal) {
        aiEyeBtn.addEventListener('click', () => aiModal.classList.remove('hidden'));
    }
    if (aiCloseBtn && aiModal) {
        aiCloseBtn.addEventListener('click', () => aiModal.classList.add('hidden'));
    }

    if (aiSendBtn && aiInput && aiMessages) {
        const appendMsg = (sender, text) => {
            const m = document.createElement('div');
            m.className = sender === 'user' ? 'text-right text-cyan-300' : 'text-left text-slate-300';
            m.innerHTML = `<span class="font-bold">${sender === 'user' ? 'أنت' : 'عين الذكاء'}:</span> ${sanitizeText(text)}`;
            aiMessages.appendChild(m);
            aiMessages.scrollTop = aiMessages.scrollHeight;
        };

        appendMsg('ai', 'أهلاً بك يا أبو سلمان في النظام الملكي. كيف يمكنني مساعدتك في عمليات تريم والمنصة اليوم؟');

        aiSendBtn.addEventListener('click', () => {
            const text = aiInput.value.trim();
            if (!text) return;
            appendMsg('user', text);
            aiInput.value = '';

            setTimeout(() => {
                let reply = 'تم استلاستفسارك ومعالجته عبر درع الحماية السيادي بنجاح.';
                if (text.includes('سعر') || text.includes('okx')) {
                    reply = 'منصة OKX متصلة بنجاح، رصيدك الحالي آمن ومعاملات P2P تعمل بكفاءة عالية.';
                } else if (text.includes('تريم') || text.includes('حضرموت')) {
                    reply = 'نظام خريطة حضرموت وخدمات مكتب أبو سلمان تعمل بأعلى أداء.';
                }
                appendMsg('ai', reply);
            }, 800);
        });
    }
}

// Operations & QR
function initOperations() {
    const inboxSendBtn = document.getElementById('sendInboxMsgBtn');
    const inboxInput = document.getElementById('inboxInputField');
    const inboxList = document.getElementById('inboxMessagesList');

    if (inboxSendBtn && inboxInput && inboxList) {
        inboxSendBtn.addEventListener('click', () => {
            const val = inboxInput.value.trim();
            if (!val) return;

            const msgDiv = document.createElement('div');
            msgDiv.className = 'bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs text-right';
            msgDiv.innerHTML = `<span class="text-cyan-400 font-bold block mb-1">أنت:</span>${sanitizeText(val)}`;
            inboxList.appendChild(msgDiv);
            inboxInput.value = '';

            setTimeout(() => {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'bg-cyan-950/40 border border-cyan-500/30 p-2.5 rounded-xl text-xs text-right';
                replyDiv.innerHTML = `<span class="text-cyan-300 font-bold block mb-1">فريق الدعم السيادي:</span>تم استلام رسالتك وسيتم الرد الفوري.`;
                inboxList.appendChild(replyDiv);
                inboxList.scrollTop = inboxList.scrollHeight;
            }, 1000);
        });
    }
}

function generateQRCodeDisplay() {
    const qrContainer = document.getElementById('qrcode');
    const opsQrContainer = document.getElementById('operationsQrBox');
    const qrText = `TARIM_OS_V8.6_SECURE:${currentUser.username}:${currentUser.okxId}`;
    
    if (qrContainer && window.QRCode) {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: qrText,
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    if (opsQrContainer && window.QRCode) {
        opsQrContainer.innerHTML = '';
        new QRCode(opsQrContainer, {
            text: qrText,
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}
