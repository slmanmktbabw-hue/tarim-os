// public/app.js - نسخة تعمل مع واجهتك الحالية
let currentStream = null;
let facingMode = "environment";

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏰 TARIM OS Started');
    if(localStorage.getItem('tarim_user')) document.getElementById('authGate').style.display='none';
});

// Toast
function showToast(msg){
    const box = document.getElementById('toastBox') || document.body;
    const t = document.createElement('div');
    t.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold z-50';
    t.innerText = msg; box.appendChild(t);
    setTimeout(()=>t.remove(),2000);
}

function forceUnlockCastle(){
    document.getElementById('authGate').style.display='none';
    localStorage.setItem('tarim_user','AL');
    showToast('أهلاً بك يا أبو سلمان 👑');
}

function lockCastleAgain(){
    document.getElementById('authGate').style.display='flex';
    localStorage.removeItem('tarim_user');
}

function switchTab(tab,btn){
    if(currentStream){ currentStream.getTracks().forEach(t=>t.stop()); currentStream=null; }
    document.querySelectorAll('.tab-content').forEach(x=>x.classList.add('hidden'));
    document.getElementById('tab-'+tab).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('text-cyan-400'));
    btn.classList.add('text-cyan-400');
    if(tab==='create') setTimeout(initCamera,300);
}

async function initCamera(){
    let box = document.getElementById('cameraBox');
    if(!box){
        // ننشئ مكان للكاميرا اول مرة
        const createDiv = document.getElementById('tab-create').querySelector('.glass');
        box = document.createElement('div'); box.id='cameraBox';
        createDiv.prepend(box);
    }
    if(!document.getElementById('cameraPreview')){
        box.innerHTML = `<video id="cameraPreview" autoplay playsinline muted class="w-full h-64 bg-black rounded-xl mb-3 border-cyan-500/40"></video>`;
    }
    const video = document.getElementById('cameraPreview');
    if(currentStream) currentStream.getTracks().forEach(t=>t.stop());
    try{
        currentStream = await navigator.mediaDevices.getUserMedia({video:{facingMode: facingMode==='env'?'environment':'user'}});
        video.srcObject = currentStream;
    }catch(e){ showToast('⚠️ ارفضت الكاميرا') }
}

// نربط الازرار بالنص
document.addEventListener('click', e=>{
    const txt = e.target.innerText;
    if(txt.includes('تبديل')){ facingMode = facingMode==='env'?'user':'env'; initCamera(); }
    if(txt.includes('امامية')){ facingMode='user'; initCamera(); }
    if(txt.includes('خلفية')){ facingMode='env'; initCamera(); }
    if(txt.includes('LIVE')){ showToast('🔴 البث 8 دقايق بيشتغل قريب') }
    if(txt.includes('نشر فوري')){ showToast('🚀 تم النشر بنجاح') }
    if(txt.includes('رفع صورة')){ showToast('🖼️ رفع الصورة قادم') }
})
