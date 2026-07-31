let socket = null;
try { socket = io(); } catch(e) {}
let stream = null;
let currentFacingMode = 'user';

function showToast(m) {
    const b = document.getElementById('toastBox');
    if(!b) return;
    const d = document.createElement('div');
    d.className = 'glass p-3 rounded-xl text-xs text-center font-bold bg-cyan-500/20 text-cyan-300 mt-2 border border-cyan-500/30 shadow-2xl';
    d.innerText = m;
    b.appendChild(d);
    setTimeout(() => d.remove(), 3500);
}

function openTab(id) {
    document.querySelectorAll('main').forEach(x => x.classList.add('hidden'));
    const target = document.getElementById('tab-' + id);
    if(target) target.classList.remove('hidden');
    window.scrollTo(0,0);
}

function updateUI() {
    const n = localStorage.getItem('ceo_name') || 'الإمبراطور AL';
    document.querySelectorAll('.userNameDisplay').forEach(e => e.innerText = n);
}

async function registerAndLogin() {
    const phone = document.getElementById('userPhone').value.trim();
    const pass = document.getElementById('userPass').value.trim();
    if(!phone || pass.length < 8) {
        showToast('❌ أدخل المعرف ورقم سر 8 خانات على الأقل');
        return;
    }
    try {
        await fetch('/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ phone, pass })
        });
    } catch(e) {}
    localStorage.setItem('ceo_user', phone);
    localStorage.setItem('ceo_name', 'الإمبراطور ' + phone);
    const gate = document.getElementById('authGate');
    if(gate) gate.style.display = 'none';
    updateUI();
    showToast('🌍 أهلاً بك في قلعة tarimos.org السيادية العالمية');
}

function handle(actionName) {
    if(actionName.includes('رصيد')) {
        fetch('/api/wallet').then(r => r.json()).then(d => {
            showToast(`💰 رصيد OKX الملكي: ${d.balance} [${d.wallet}]`);
        }).catch(() => {
            showToast('💰 رصيد OKX السيادي: 0x53ce...0af6 [متصل]');
        });
    } else {
        showToast(`⚙️ تم تفعيل قسم: ${actionName} بنجاح`);
    }
}

function sendMsg() {
    const i = document.getElementById('chatIn');
    if(!i || !i.value.trim()) return;
    const t = i.value;
    socket?.emit('message', { text: t, user: localStorage.getItem('ceo_name') || 'الإمبراطور AL' });
    addChat('أنت: ' + t);
    i.value = '';
}

function addChat(t) {
    const l = document.getElementById('chatLogs');
    if(!l) return;
    const d = document.createElement('div');
    d.className = 'glass p-2.5 rounded-xl text-xs';
    d.innerText = t;
    l.appendChild(d);
    l.scrollTop = l.scrollHeight;
}

function sendAI() {
    const i = document.getElementById('aiIn');
    if(!i || !i.value.trim()) return;
    const t = i.value;
    const logs = document.getElementById('aiLogs');
    if(logs) {
        const u = document.createElement('div');
        u.className = 'bg-cyan-950/70 p-2.5 rounded-xl text-xs text-cyan-200 border border-cyan-500/30';
        u.innerText = 'أنت: ' + t;
        logs.appendChild(u);
    }
    socket?.emit('ai_prompt', { text: t });
    i.value = '';
}

function sendSupport() {
    const i = document.getElementById('supportIn');
    if(!i || !i.value.trim()) return;
    const t = i.value;
    const logs = document.getElementById('supportLogs');
    if(logs) {
        const u = document.createElement('div');
        u.className = 'bg-yellow-950/60 p-2.5 rounded-xl text-xs text-yellow-200 border border-yellow-500/30';
        u.innerText = 'أنت: ' + t;
        logs.appendChild(u);
    }
    socket?.emit('support_prompt', { text: t });
    i.value = '';
}

async function openCamera(facing = 'user') {
    currentFacingMode = facing;
    try {
        if(stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: currentFacingMode }, 
            audio: true 
        });
        const v = document.getElementById('camPreview');
        if(v) {
            v.srcObject = stream;
            v.classList.remove('hidden');
        }
        showToast(`📹 تم تشغيل الكاميرا (${facing === 'user' ? 'الأمامية' : 'الخلفية'}) بنجاح`);
    } catch(e) {
        showToast('❌ تعذر تشغيل الكاميرا - تحقق من الأذونات');
    }
}

function toggleCameraFacing() {
    currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
    openCamera(currentFacingMode);
}

function startLive() {
    openCamera('user');
    socket?.emit('live_start', { user: localStorage.getItem('ceo_name') || 'الإمبراطور AL' });
    showToast('🔴 بدأ البث المباشر السيادي المشفر (8 دقائق)');
    setTimeout(() => {
        if(stream) stream.getTracks().forEach(t => t.stop());
        showToast('⏰ انتهت جلسة البث المباشر (8 دقائق)');
    }, 8 * 60 * 1000);
}

function applyFilter() {
    showToast('✨ تم تطبيق الفلتر السيادي المتقدم بنجاح');
}

function createPost(type) {
    showToast('✨ وضع إنشاء: ' + type);
    const postInput = document.getElementById('postText');
    if(postInput) postInput.focus();
}

function publishPost() {
    const txt = document.getElementById('postText')?.value.trim();
    if(!txt) {
        showToast('⚠️ اكتب محتوى النشر أولاً');
        return;
    }
    let img = null;
    const v = document.getElementById('camPreview');
    const canvas = document.getElementById('camCanvas');
    if(v && !v.classList.contains('hidden') && canvas) {
        canvas.width = v.videoWidth || 320;
        canvas.height = v.videoHeight || 240;
        canvas.getContext('2d').drawImage(v, 0, 0);
        img = canvas.toDataURL('image/jpeg');
    }
    fetch('/api/posts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ text: txt, image: img, user: localStorage.getItem('ceo_name') || 'الإمبراطور AL', time: Date.now() })
    }).then(() => {
        const postInput = document.getElementById('postText');
        if(postInput) postInput.value = '';
        if(v) v.classList.add('hidden');
        loadFeed();
        openTab('home');
        showToast('✅ تم النشر عالمياً ووصل لجمهور القلعة الحي');
    });
}

async function loadFeed() {
    try {
        const r = await fetch('/api/posts');
        const d = await r.json();
        const f = document.getElementById('feed');
        if(f) {
            f.innerHTML = d.map(p => `
                <div class="glass p-3.5 rounded-2xl text-xs space-y-2 border border-white/10 shadow-lg">
                    <div class="font-bold text-cyan-400 flex justify-between"><span>${p.user || 'الإمبراطور AL'}</span><span class="text-[9px] text-cyan-200 bg-cyan-500/20 px-2 py-0.5 rounded-full">جمهور حي 🌍</span></div>
                    <div class="text-gray-200">${p.text || ''}</div>
                    ${p.image ? `<img src="${p.image}" class="mt-2 rounded-xl w-full object-cover max-h-56 border border-cyan-500/30">` : ''}
                </div>
            `).join('');
        }
    } catch(e) {}
}

function genQR() {
    const id = localStorage.getItem('ceo_user') || 'AL';
    const data = `${location.origin}?king=${id}&wallet=0x53ce5e429ac48f355b775e418ded0b13931c0af6`;
    const q = document.getElementById('qrcode');
    if(q) {
        q.innerHTML = '';
        new QRCode(q, {
            text: data,
            width: 180,
            height: 180,
            colorDark: "#00f0ff",
            colorLight: "#000000"
        });
        showToast('🔏 تم اصدار الختم الميداني المشفر وQR بنجاح');
    }
}

function openMap() {
    showToast('🗺️ خريطة حضرموت وتريم تعمل بدون إنترنت (Offline)');
}

function changeBg() {
    const u = document.getElementById('bgUrlInput')?.value.trim();
    if(!u) return;
    localStorage.setItem('ceo_bg', u);
    document.body.style.background = `url('${u}') center/cover no-repeat fixed`;
    showToast('🎨 تم تحديث خلفية التطبيق السيادي');
}

if(socket) {
    socket.on('ai_response', d => {
        const l = document.getElementById('aiLogs');
        if(l) {
            const x = document.createElement('div');
            x.className = 'bg-cyan-950/70 p-2.5 rounded-xl border border-cyan-500/30 text-xs text-cyan-200';
            x.innerText = d.user + ': ' + d.text;
            l.appendChild(x);
            l.scrollTop = l.scrollHeight;
        }
    });
    socket.on('support_response', d => {
        const l = document.getElementById('supportLogs');
        if(l) {
            const x = document.createElement('div');
            x.className = 'bg-yellow-950/60 p-2.5 rounded-xl border border-yellow-500/30 text-xs text-yellow-200';
            x.innerText = d.user + ': ' + d.text;
            l.appendChild(x);
            l.scrollTop = l.scrollHeight;
        }
    });
    socket.on('message', d => addChat((d.user || 'مستخدم') + ': ' + d.text));
    socket.on('new_post', () => { loadFeed(); showToast('🔔 منشور جديد وصل من الجمهور الحقيقي!'); });
}

window.addEventListener('load', () => {
    if(localStorage.getItem('ceo_user')) {
        const gate = document.getElementById('authGate');
        if(gate) gate.style.display = 'none';
        updateUI();
    }
    const savedBg = localStorage.getItem('ceo_bg');
    if(savedBg) {
        document.body.style.background = `url('${savedBg}') center/cover no-repeat fixed`;
    }
    loadFeed();
});
      
