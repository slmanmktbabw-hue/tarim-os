let currentStream = null;
let facingMode = "environment";

function showToast(msg){
    const box = document.getElementById('toastBox');
    const t = document.createElement('div');
    t.className = 'bg-cyan-500 text-black px-4 py-2 rounded mb-2 text-xs font-bold';
    t.innerText = msg; box.appendChild(t);
    setTimeout(()=>t.remove(),2000);
}

function forceUnlockCastle(){
    document.getElementById('authGate').style.display='none';
    localStorage.setItem('tarim_user','AL');
    showToast('أهلاً بك يا أبو سلمان 👑');
    initCamera();
}

function switchTab(tab,btn){
    if(currentStream){ currentStream.getTracks().forEach(t=>t.stop()) }
    document.querySelectorAll('.tab-content').forEach(x=>x.classList.add('hidden'));
    document.getElementById('tab-'+tab).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.replace('text-cyan-400','text-slate-400'));
    btn.classList.replace('text-slate-400','text-cyan-400');
    if(tab==='create') initCamera();
}

async function initCamera(){
    const box = document.getElementById('cameraBox');
    if(!document.getElementById('cameraPreview')){
        box.innerHTML = `<video id="cameraPreview" autoplay playsinline muted class="w-full h-64 bg-black rounded-xl"></video>`;
    }
    const video = document.getElementById('cameraPreview');
    if(currentStream) currentStream.getTracks().forEach(t=>t.stop());
    try{
        currentStream = await navigator.mediaDevices.getUserMedia({video:{facingMode: facingMode==='env'?'environment':'user'}});
        video.srcObject = currentStream;
    }catch(e){ showToast('⚠️ فشل تشغيل الكاميرا') }
}

document.addEventListener('click', e=>{
    if(e.target.id==='switchCam'){
        facingMode = facingMode==='env'?'user':'env'; initCamera();
    }
    if(e.target.classList.contains('camBtn')){
        facingMode = e.target.dataset.cam; initCamera();
    }
    if(e.target.id==='liveBtn'){ showToast('🔴 البث 8 دقايق جاي قريب') }
    if(e.target.id==='publishTextBtn'){ showToast('🚀 تم النشر') }
})
