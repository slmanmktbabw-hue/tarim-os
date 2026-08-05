// app.js - TARIM OS V1 FINAL - STABLE
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏰 TARIM OS Client Application Initialized - KING AL');
});

function forceUnlockCastle() {
    const gate = document.getElementById('authGate');
    if (gate) { 
        gate.style.display = 'none'; 
        gate.classList.add('hidden'); 
    }
    localStorage.setItem('tarim_user', 'AL');
}

function lockCastleAgain() {
    const gate = document.getElementById('authGate');
    if (gate) { 
        gate.style.display = 'flex'; 
        gate.classList.remove('hidden'); 
    }
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
    if(tabName === 'profile') backToProfile();
}

function showSubPage(pageId) {
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.add('hidden');
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    
    const target = document.getElementById('sub-' + pageId);
    if(target) {
        target.classList.remove('hidden');
        if(pageId === 'qr-page') {
            const qrContainer = document.getElementById('qrcode');
            if (qrContainer) {
                qrContainer.innerHTML = "";
                if (typeof QRCode !== 'undefined') {
                    new QRCode(qrContainer, { text: "https://tarimos.org/user/AL", width: 128, height: 128 });
                }
            }
        }
    }
}

function backToProfile() {
    document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
    const profileMain = document.getElementById('profile-main');
    if (profileMain) profileMain.classList.remove('hidden');
}
