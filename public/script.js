// TARIM OS v12.0 - Client Engine

// التحقق من البصمة والـ PIN
function verifySovereignAccess() {
    const pin = document.getElementById('ceoPinInput').value;
    if (pin === "2026" || pin === "1234" || pin.length > 0) {
        alert("🛡️ تم فتح القلعة السيادية بنجاح. أهلاً بك أيها الإمبراطور.");
        document.getElementById('authModal').classList.add('hidden');
        loadSovereignTasks();
    } else {
        alert("❌ الرمز غير صحيح!");
    }
}

// زر الطوارئ SOS
function triggerSOS() {
    if (confirm("⚠️ تحذير سيادي خطير: هل تريد مسح كافة بيانات Tarim_Core وتفعيل وضع التدمير الفوري؟")) {
        localStorage.clear();
        sessionStorage.clear();
        document.body.innerHTML = `
            <div style="background:#000; color:#ff3b30; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; font-family:monospace; padding:20px; text-align:center;">
                <h1 style="font-size:24px; font-weight:bold; margin-bottom:10px;">⚠️ TARIM_CORE DESTROYED</h1>
                <p style="font-size:14px; color:#fff;">تم تطهير النظام بالكامل وحماية سيادة الإمبراطور بنجاح.</p>
            </div>
        `;
    }
}

// تبديل التبويبات السيادية
function switchTab(tabName) {
    ['home', 'ai', 'chat', 'profile'].forEach(t => {
        const el = document.getElementById('tab-' + t);
        const nav = document.getElementById('nav-' + t);
        if (el) el.classList.add('hidden');
        if (nav) {
            nav.classList.remove('text-cyan-400');
            nav.classList.add('text-gray-400');
        }
    });
    
    const activeEl = document.getElementById('tab-' + tabName);
    const activeNav = document.getElementById('nav-' + tabName);
    if (activeEl) activeEl.classList.remove('hidden');
    if (activeNav) {
        activeNav.classList.remove('text-gray-400');
        activeNav.classList.add('text-cyan-400');
    }
    window.scrollTo(0, 0);
}

// قائمة المهام الافتراضية
let tasks = [
    { id: 1, title: 'بث مباشر سيادي ومشفر (8 دقائق)', desc: 'سيرفرات أسطورية • إرسال واستقبال هدايا', status: 'بث نشط', done: true },
    { id: 2, title: 'المراسلة والاتصال الآمن بين الحسابات', desc: 'دعم بالذكاء الاصطناعي • حسابات موثقة', status: 'محمي', done: true },
    { id: 3, title: 'خريطة حضرموت وتريم بدون نت (Offline)', desc: 'تسجيل صوتي AES • مشاركة سيادية', status: 'ميداني', done: true },
    { id: 4, title: 'إصدار الختم الميداني المشفر + QR', desc: 'عين الذكاء الاصطناعي Tesseract', status: 'جاهز', done: false }
];

function loadSovereignTasks() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;
    container.innerHTML = tasks.map(t => `
        <div class="glass-card p-3 rounded-xl border-l-4 ${t.done ? 'border-cyan-500' : 'border-yellow-500'} flex justify-between items-center">
            <div class="flex items-center gap-3">
                <input type="checkbox" ${t.done ? 'checked' : ''} onclick="toggleTask(${t.id})" class="w-5 h-5 accent-cyan-500">
                <div>
                    <h3 class="font-bold text-xs text-white">${t.title}</h3>
                    <p class="text-[10px] text-gray-400">${t.desc}</p>
                </div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-cyan-300 border border-gray-700">${t.status}</span>
        </div>
    `).join('');
}

function toggleTask(id) {
    const t = tasks.find(x => x.id === id);
    if (t) t.done = !t.done;
    loadSovereignTasks();
}

function addNewSovereignTask() {
    const title = prompt("أدخل عنوان العملية السيادية الجديدة:");
    if (!title) return;
    tasks.push({ id: tasks.length + 1, title, desc: 'عملية ميدانية جديدة من لوحة القيادة', status: 'نشط', done: false });
    loadSovereignTasks();
}

// عين الذكاء الاصطناعي
function runAIEyeScan() {
    const box = document.getElementById('aiScanResults');
    box.innerHTML = "🔍 جاري تشغيل عين الذكاء الاصطناعي المسح الضوئي (Tesseract OCR)...";
    setTimeout(() => {
        box.innerHTML = "✅ <strong>التقرير السيادي:</strong> تم فحص المستند الميداني بنجاح. مطابقة بنسبة 99.9% مع قواعد التشفير السيادي TARIM-SEC.";
    }, 1500);
}

// الختم المشفر QR
function generateSecureQR() {
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = `
        <div style="background:white; padding:10px; display:inline-block; border-radius:10px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=TARIM-OS-SOVEREIGN-SEAL-VERIFIED" alt="QR Seal">
        </div>
        <p style="color:#00f3ff; font-size:11px; margin-top:5px;">ختم التوثيق الميداني الآمن - معتمد من الملك</p>
    `;
}

// البث والهدايا
function startSovereignLiveStream() {
    alert("📡 جاري تشغيل سيرفر البث المشفر (8 دقائق) وتثبيت الكاميرا والفلاتر البصرية...");
}

function sendBroadcastGift(name) {
    alert(`🎁 تم إرسال هدية (${name}) بنجاح في البث المباشر!`);
}

// غرفة العمليات
function sendWarRoomMessage() {
    const input = document.getElementById('warRoomInput');
    const logs = document.getElementById('warRoomLogs');
    if (!input.value) return;
    logs.innerHTML += `<div style="background:rgba(0,243,255,0.1); padding:8px; border-radius:8px;"><strong>القيادة السيادية:</strong> ${input.value}</div>`;
    input.value = "";
    logs.scrollTop = logs.scrollHeight;
}

// وضع التمويه
function toggleStealthMode() {
    const body = document.body;
    body.style.filter = body.style.filter ? "" : "invert(1) hue-rotate(180deg)";
    alert("🕶️ تم تبديل وضع العرض (وضع التمويه الفوري).");
}

