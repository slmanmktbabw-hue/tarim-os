const socket = io();
let currentUser = null;
let liveStream = null;

function showToast(msg){ alert(msg) }

async function login() {
    const username = document.getElementById('userInput').value;
    const password = document.getElementById('passInput').value;
    if (!username ||!password) return showToast('دخل البيانات');

    let res = await fetch('/api/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username, password}) });
    let data = await res.json();
    if(data.success){
        currentUser = username;
        document.getElementById('login').classList.remove('active');
        document.getElementById('mainApp').classList.remove('hidden');
        showToast('مرحبا ' + username);
    }
}

function switchPage(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

async function startLive(){
    document.getElementById('fullScreenCam').style.display = 'block';
    liveStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
    document.getElementById('cam').srcObject = liveStream;
    socket.emit('startLive');
}

function closeLive(){
    document.getElementById('fullScreenCam').style.display = 'none';
    if(liveStream) liveStream.getTracks().forEach(t => t.stop());
    socket.emit('stopLive');
}

function openAIEye(){ showToast('عين الذكاء') }
function openSupport(){ showToast('الدعم') }
