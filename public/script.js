const socket = io();
let posts = [];
let stream = null;
let facing = 'user';
let currentUser = localStorage.getItem('tarim_user') || 'AL';
let liveLikeCount = 0;

function openTab(name) {
    document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
    const tab = document.getElementById('tab-' + name);
    if (tab) tab.classList.remove('hidden');
    else document.getElementById('tab-home')?.classList.remove('hidden');
    
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('text-cyan-400'));
    if (name === 'home') document.querySelectorAll('nav button')[0]?.classList.add('text-cyan-400');
    if (name === 'operations') document.querySelectorAll('nav button')[1]?.classList.add('text-cyan-400');
    if (name === 'messages') document.querySelectorAll('nav button')[3]?.classList.add('text-cyan-400');
    if (name === 'profile') document.querySelectorAll('nav button')[4]?.classList.add('text-cyan-400');
    if (name === 'profile') genQR();
}

function registerAndLogin() {
    const u = document.getElementById('userPhone').value.trim() || 'AL';
    const p = document.getElementById('userPass').value;
    if (p.length < 3) return toast('كلمة المرور قصيرة');
    localStorage.setItem('tarim_user', u);
    currentUser = u;
    document.getElementById('authGate').style.display = 'none';
    toast('أهلاً ' + u + ' - النظام جاهز 🌍');
    loadPosts();
    updateWalletUI();
}

async function loadPosts() {
    try {
        const res = await fetch('/api/posts');
        posts = await res.json();
        const feed = document.getElementById('feed');
        if (!feed) return;
        feed.innerHTML = '';
        posts.forEach(p => {
            const d = document.createElement('div');
            d.className = 'glass p-3 rounded-2xl text-xs';
            d.innerHTML = `<b>${p.user || 'AL'}</b><p class="mt-1">${p.text || ''}</p>${p.media ? (p.type === 'video' ? `<video src="${p.media}" controls class="w-full rounded-xl mt-2"></video>` : `<img src="${p.media}" class="w-full rounded-xl mt-2">`) : ''}<div class="mt-2 flex gap-3"><span>❤️ ${p.likes || 0}</span><span onclick="sendGift()" class="cursor-pointer text-cyan-400">🎁 هدية</span></div>`;
            feed.appendChild(d);
        });
    } catch (e) {
        console.error("خطأ في تحميل المنشورات");
    }
}

async function publishPost(mediaUrl = null, type = 'text') {
    const textInput = document.getElementById('postText');
    const text = textInput ? textInput.value : '';
    if (!text && !mediaUrl) return toast('اكتب محتوى المنشور أولاً');
    
    const post = { user: currentUser, text, media: mediaUrl, type, likes: 0, time: Date.now() };
    try {
        await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(post)
        });
        socket.emit('new_post', post);
        if (textInput) textInput.value = '';
        toast('نشر عالمي 🌍');
        openTab('home');
        loadPosts();
    } catch (e) {
        toast('فشل النشر');
    }
}

function toast(msg) {
    const box = document.getElementById('toastBox');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'bg-cyan-500 text-black font-black px-4 py-2 rounded-xl text-xs mb-2 shadow-lg transition-all';
    t.innerText = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

async function updateWalletUI() {
    try {
        const res = await fetch('/api/wallet/' + currentUser);
        const data = await res.json();
        const bShow = document.getElementById('balanceShow');
        const myBal = document.getElementById('myBalance');
        if (bShow) bShow.innerText = data.balance || 0;
        if (myBal) myBal.innerText = data.balance || 0;
    } catch (e) {}
}

function genQR() {
    const qc = document.getElementById('qrcode');
    if (!qc) return;
    qc.innerHTML = '';
    new QRCode(qc, {
        text: "https://tarimos.org/@" + currentUser,
        width: 128,
        height: 128,
        colorDark: "#00f0ff",
        colorLight: "#050b14",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function startLive() {
    document.getElementById('fullScreenCam')?.classList.remove('hidden');
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => {
        stream = s;
        const v = document.getElementById('fullCamVideo');
        if (v) v.srcObject = s;
    }).catch(e => toast('تعذر تشغيل الكاميرا'));
}

function confirmStartLive() {
    document.getElementById('preLiveOverlay')?.classList.add('hidden');
    toast('🔴 بدأ البث المباشر السيادي');
}

function exitFullScreen() {
    document.getElementById('fullScreenCam')?.classList.add('hidden');
    if (stream) stream.getTracks().forEach(t => t.stop());
}

function likeLive() {
    liveLikeCount++;
    const l = document.getElementById('liveLikes');
    if (l) l.innerText = liveLikeCount;
}

function sendGift() {
    toast('🎁 تم إرسال الهدية بنجاح بنظام OKX');
}

socket.on('broadcast_post', (post) => {
    loadPosts();
});
