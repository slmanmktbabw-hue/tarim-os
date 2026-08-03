let warnings = 0;
let liveStream = null, liveTrack = null, flash = false;

// 1. شاشة الدخول
function switchTab(t) {
    document.querySelectorAll('.tab button').forEach(b => b.classList.remove('active'));
    document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.add('active');
}
function login() {
    let user = document.getElementById('userInput').value;
    let pass = document.getElementById('passInput').value;
    if (user && pass) {
        document.getElementById('login').classList.remove('active');
        document.getElementById('mainApp').style.display = 'block';
        switchPage('profile', document.querySelector('.nav-item'));
    } else { alert('دخل الايميل وكلمة السر'); }
}
function googleLogin() { alert('تسجيل دخول بجوجل - بنربطه ب Firebase'); }

// 2. التنقل - تم التصحيح هنا ✅
function switchPage(id, el) {
    document.querySelectorAll('#mainApp.page').forEach(p => p.classList.remove('active')); // <-- المسافة مهمة
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(el) el.classList.add('active'); // <-- حماية اضافية
}

// 3. باقي التروس
function editProfile(){alert('تعديل البروفايل')}
function checkWarnings(){warnings++;document.getElementById('warn').innerText=warnings+'/3';if(warnings>=3)alert('تم تعليق الحساب')}
function logout(){if(confirm('تسجيل الخروج؟')){document.getElementById('mainApp').style.display='none';document.getElementById('login').classList.add('active')}}
function start8MinLive(){alert('بدء بث 8 دقايق');switchPage('create',document.querySelector('.nav-plus'));openLive()}
function secureChat(){alert('المراسلة الامنة')}
function offlineMap(){alert('تحميل خريطة حضرموت')}
function generateQR(){document.getElementById('qrBox').innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=TARIM-OP" />'}
async function openLive(){document.getElementById('liveScreen').style.display='block';try{liveStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});document.getElementById('cam').srcObject=liveStream;liveTrack=liveStream.getVideoTracks()[0]}catch(e){alert('اسمح بالكاميرا')}}
function closeLive(){document.getElementById('liveScreen').style.display='none';if(liveStream)liveStream.getTracks().forEach(t=>t.stop())}
async function toggleFlash(){flash=!flash;try{await liveTrack.applyConstraints({advanced:[{torch:flash}]})}catch(e){alert('الفلاش غير مدعوم')}}
function flipCam(){alert('تبديل الكاميرا')};function sendGift(){alert('ارسال هدية')};function liveLike(){alert('❤️')};
function publishPost(){alert('تم النشر: '+document.getElementById('postText').value)}
function sendMsg(){let msg=document.getElementById('msgInput').value;if(msg){document.getElementById('chatBox').innerHTML+=`<div style="background:#1e2740;padding:8px;border-radius:8px;margin:5px 0">${msg}</div>`;document.getElementById('msgInput').value=''}}
function like(){alert('تم الاعجاب')};function comment(){alert('التعليقات')};function follow(){alert('متابعة')};function save(){alert('حفظ')};function share(){alert('مشاركة')}
function openAIEye(){alert('عين الذكاء')};function openSupport(){alert('فريق الدعم AI')};
function pickImage(){alert('اختيار صورة')};function pickVideo(){alert('اختيار فيديو')}
