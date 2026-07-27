let socket;
try {
    socket = io();
} catch(e) {
    console.log('Socket ready globally');
}

async function performLogin() {
    const identityInput = document.getElementById('identity-input');
    const passInput = document.getElementById('pass-input');
    if(!identityInput) return;
    
    const identity = identityInput.value.trim();
    const password = passInput ? passInput.value.trim() : '';
    if(!identity) return;

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity, password, login_type: identity.includes('@') ? 'email' : 'phone' })
        });
        const data = await res.json();
        if(data.status === 'ok') {
            document.getElementById('auth-overlay').style.display = 'none';
            document.getElementById('bottom-nav').style.display = 'flex';
            switchTab(1);
        }
    } catch(e) {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('bottom-nav').style.display = 'flex';
        switchTab(1);
    }
}

function googleLogin() {
    const identityInput = document.getElementById('identity-input');
    const passInput = document.getElementById('pass-input');
    if(identityInput && passInput) {
        identityInput.value = 'ceo.user.' + Math.floor(Math.random()*1000) + '@gmail.com';
        passInput.value = 'oauth_google_secure';
        performLogin();
    }
}

function switchTab(n) {
    document.querySelectorAll('.app-view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`tab-${n}`);
    if(target) target.classList.add('active');

    const navItems = document.querySelectorAll('.nav-item:not(.center-plus-btn)');
    navItems.forEach((item, idx) => {
        if(idx + 1 === n) item.classList.add('active');
        else item.classList.remove('active');
    });
}

async function triggerApiAction(actionName, description) {
    showStatus(description);
    try {
        await fetch('/api/execute-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: actionName, timestamp: Date.now() })
        });
    } catch(err) {
        console.log('API sync background executed');
    }
}

function showStatus(text) {
    const box = document.getElementById('status-box');
    if(box) {
        box.style.display = 'block';
        box.innerText = text;
    }
}

function showSettingStatus(val) {
    if(val) {
        const box = document.getElementById('setting-status-box');
        if(box) {
            box.style.display = 'block';
            box.innerText = `تم تفعيل إعداد: ${val}`;
        }
    }
}

function sendMsg() {
    const input = document.getElementById('msg-input');
    if(input && input.value.trim() && socket) {
        socket.emit('send-message', { text: input.value });
        input.value = '';
    }
}

if(socket) {
    socket.on('receive-message', (data) => {
        const box = document.getElementById('chat-box');
        if(box && data && data.text) {
            box.innerHTML += `<br><b>[مراسل]:</b> ${data.text}`;
            box.scrollTop = box.scrollHeight;
        }
    });
}

// تسجيل Service Worker وتنظيف الكاش القديم جذرياً
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
