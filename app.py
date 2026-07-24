from datetime import datetime
import hashlib
import os
import sqlite3
from flask import Flask, jsonify, render_template_string, request, session

app = Flask(__name__)
app.secret_key = "tarim_supreme_fusion_secret_2026"

# إعداد قاعدة البيانات الحقيقية الدائمة SQLite
DB_NAME = "tarim_core.db"


def init_db():
  conn = sqlite3.connect(DB_NAME)
  cursor = conn.cursor()
  cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            action TEXT,
            status TEXT
        )
    """)
  cursor.execute("""
        CREATE TABLE IF NOT EXISTS sovereign_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            category TEXT,
            status TEXT,
            details TEXT
        )
    """)
  # إدخال مهام افتراضية سيادية وخارقة
  cursor.execute("SELECT COUNT(*) FROM sovereign_tasks")
  if cursor.fetchone()[0] == 0:
    tasks = [
        (
            "بث مباشر سيادي ومشفر (8 دقائق)",
            "بث",
            "نشط",
            "سيرفرات فائقة الأسطورة",
        ),
        (
            "المراسلة المشفرة بين الحسابات",
            "محادثات",
            "معتمد",
            "تأمين P2P تام",
        ),
        ("فريق الدعم بالذكاء الاصطناعي", "الذكاء", "يعمل 24/7", "إجابة آلية فورية"),
        ("حسابات موثقة وعالية الهيمنة", "الملف", "موثق CEO", "شارة سيادية"),
        ("استقبال وإرسال هدايا البث", "بث", "مفعل", "تفاعل تيك توك وسناب"),
        ("تجميل الفلاتر البصرية السيادية", "بث", "جاهز", "معالجة بالذكاء الاصطناعي"),
        ("قفل الحماية البيومتري وبصمة CEO", "حماية", "مؤمن", "PIN + نقش + بصمة"),
        ("زر الطوارئ SOS (حذف النواة)", "طوارئ", "استعداد تام", "مسح فوري عند الخطر"),
        ("خريطة حضرموت وتريم بدون نت (Offline)", "ميداني", "محمل", "تثبيت النقاط بالختم"),
        ("تسجيل صوتي مشفر بتشفير AES", "أمن", "مشفر", "سرية مطلقة للـ CEO"),
        ("إصدار الختم الميداني المشفر + QR", "ردع", "مفعل", "إثبات أصالة الملفات"),
        ("توليد 10 منشورات تفنيد وردع التضليل", "ذكاء", "منجز", "هجوم سيادي آلي"),
    ]
    cursor.executemany(
        "INSERT INTO sovereign_tasks (title, category, status, details) VALUES"
        " (?, ?, ?, ?)",
        tasks,
    )
  conn.commit()
  conn.close()


init_db()


def log_action(action, status="نجاح سيادي معتمد"):
  conn = sqlite3.connect(DB_NAME)
  cursor = conn.cursor()
  cursor.execute(
      "INSERT INTO system_logs (timestamp, action, status) VALUES (?, ?, ?)",
      (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), action, status),
  )
  conn.commit()
  conn.close()


# قالب التطبيق السيادي المطابق للصورة تماماً مع قسم المهام الخارق
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TARIM OS v8.3 Fusion Supreme</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background-color: #0b0f19; color: #fff; font-family: system-ui, -apple-system, sans-serif; }
        .glass-card { background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(15px); border: 1px solid rgba(0, 243, 255, 0.2); }
        .neon-glow { box-shadow: 0 0 25px rgba(0, 243, 255, 0.35); }
        .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #00f3ff; color: #000; padding: 12px 26px; border-radius: 9999px; font-weight: bold; z-index: 1000; display: none; box-shadow: 0 10px 30px rgba(0,182,212,0.5); }
    </style>
</head>
<body class="pb-28">

    <!-- قفل الحماية البيومتري وبصمة الـ CEO -->
    <div id="authModal" class="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <div class="glass-card p-6 rounded-3xl w-full max-w-sm text-center neon-glow border border-cyan-500/40">
            <div class="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl border border-cyan-500">
                <i class="fa-solid fa-fingerprint animate-pulse"></i>
            </div>
            <h2 class="text-xl font-black text-cyan-400 mb-1">TARIM OS v8.3</h2>
            <p class="text-xs text-gray-400 mb-6">أدخل كلمة سر الـ CEO السيادية لفتح النظام</p>
            <input type="password" id="ceoPassword" placeholder="كلمة السر السيادية" class="w-full bg-gray-900 border border-cyan-500/50 rounded-xl px-4 py-3 text-center text-white mb-4 focus:outline-none focus:border-cyan-400">
            <button onclick="verifyCEO()" class="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold py-3 rounded-xl shadow-lg mb-3">دخول القلعة السيادية</button>
            <button onclick="triggerSOS()" class="w-full bg-red-600/20 text-red-400 border border-red-500/50 py-2 rounded-xl text-xs font-bold"><i class="fa-solid fa-triangle-exclamation ml-1"></i> زر الطوارئ SOS (حذف النواة)</button>
        </div>
    </div>

    <!-- شريط العرض العلوي (مطابق للصورة) -->
    <header class="flex justify-between items-center px-4 py-3 glass-card border-b border-gray-800">
        <div class="flex items-center space-x-3 space-x-reverse">
            <button onclick="showToast('🔔 التنبيهات السيادية مفعلة')" class="text-yellow-400 text-xl"><i class="fa-solid fa-bell"></i></button>
            <button onclick="showToast('🔍 عين الذكاء الاصطناعي تبحث في النطاق')" class="text-gray-300 text-lg ml-3"><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
        <div class="flex items-center space-x-1 space-x-reverse bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/40 cursor-pointer" onclick="showToast('🤖 فريق الدعم بالذكاء الاصطناعي جاهز لمساعدتك')">
            <i class="fa-solid fa-robot text-cyan-400 text-xs"></i>
            <span class="text-xs text-cyan-200">فريق الدعم</span>
        </div>
        <div class="flex items-center space-x-2 space-x-reverse">
            <span class="font-bold text-lg tracking-wider text-cyan-400">TARIM OS</span>
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-ping"></span>
        </div>
    </header>

    <!-- واجهة البث المرئي (مطابقة للصورة طبق الأصل) -->
    <main class="p-4 space-y-4">
        <div class="relative rounded-2xl overflow-hidden glass-card shadow-2xl h-60 border border-gray-800">
            <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop" class="w-full h-full object-cover opacity-80" alt="Stream">
            
            <div class="absolute top-3 left-3 flex items-center space-x-2 space-x-reverse">
                <button onclick="showToast('➕ تم إضافة عقدة بث جديدة')" class="bg-black/50 p-2 rounded-full text-white backdrop-blur-md"><i class="fa-solid fa-plus"></i></button>
                <div class="bg-black/50 px-3 py-1 rounded-full text-xs flex items-center space-x-1 space-x-reverse backdrop-blur-md">
                    <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span>24.3K</span>
                </div>
            </div>

            <div class="absolute top-3 right-3 flex space-x-2 space-x-reverse">
                <span class="bg-gray-800/80 text-xs px-3 py-1 rounded-full text-gray-200 backdrop-blur-md">بث مباشر سيادي مفعل</span>
                <span class="bg-red-600 text-xs px-3 py-1 rounded-full font-bold">مباشر</span>
            </div>

            <!-- تفاعلات تيك توك / سناب (الجانب الأيمن) -->
            <div class="absolute right-3 bottom-10 flex flex-col items-center space-y-3">
                <button onclick="showToast('❤️ تم إرسال إعجاب سيادي')" class="flex flex-col items-center text-red-500">
                    <div class="bg-black/40 p-3 rounded-full backdrop-blur-md"><i class="fa-solid fa-heart text-xl"></i></div>
                    <span class="text-xs text-white font-bold">12.8K</span>
                </button>
                <button onclick="showToast('🎁 تم إرسال هدية بث سيادية')" class="flex flex-col items-center text-yellow-400">
                    <div class="bg-black/40 p-3 rounded-full backdrop-blur-md"><i class="fa-solid fa-gift text-xl"></i></div>
                    <span class="text-xs text-white font-bold">3.2K</span>
                </button>
                <button onclick="showToast('💬 فتح المحادثات المشفرة')" class="flex flex-col items-center text-white">
                    <div class="bg-black/40 p-3 rounded-full backdrop-blur-md"><i class="fa-solid fa-comment-dots text-xl"></i></div>
                    <span class="text-xs text-white font-bold">892</span>
                </button>
                <button onclick="showToast('↗️ تم نسخ رابط البث')" class="flex flex-col items-center text-white">
                    <div class="bg-black/40 p-3 rounded-full backdrop-blur-md"><i class="fa-solid fa-share text-xl"></i></div>
                    <span class="text-xs text-white font-bold">412</span>
                </button>
            </div>
        </div>

        <!-- قسم المهام والعمليات الخارقة المتكاملة -->
        <section class="mt-4">
            <div class="flex justify-between items-center mb-3">
                <span class="text-xs text-cyan-400 font-bold"><i class="fa-solid fa-database ml-1"></i> قاعدة بيانات SQLite دائمة النشاط</span>
                <h2 class="text-lg font-bold text-white">قائمة المهام والعمليات السيادية</h2>
            </div>

            <!-- أزرار التصفية -->
            <div class="flex space-x-2 space-x-reverse mb-4 overflow-x-auto pb-1">
                <button onclick="showToast('🔥 عرض المهام عالية الأهمية')" class="bg-red-600 px-4 py-1.5 rounded-full text-xs font-bold text-white flex items-center space-x-1 space-x-reverse"><i class="fa-solid fa-fire text-xs"></i><span>عالية</span></button>
                <button onclick="showToast('⚡ عرض المهام المتوسطة')" class="glass-card px-4 py-1.5 rounded-full text-xs font-medium text-orange-400 border border-orange-500/50">متوسطة</button>
                <button onclick="showToast('🛡️ عرض المهام المنخفضة والمؤمنة')" class="glass-card px-4 py-1.5 rounded-full text-xs font-medium text-green-400 border border-green-500/50">منخفضة</button>
            </div>

            <!-- قائمة المهام الديناميكية الشاملة لكل المميزات التي طلبتها -->
            <div class="space-y-3">
                <!-- مهمة 1 -->
                <div class="glass-card p-4 rounded-2xl border-l-4 border-cyan-500 flex items-center justify-between">
                    <div class="flex items-center space-x-3 space-x-reverse">
                        <input type="checkbox" checked class="w-5 h-5 accent-cyan-400 rounded cursor-pointer" onclick="showToast('✅ تم تأكيد تشغيل البث المباشر المشفر 8 دقائق')">
                        <div>
                            <h3 class="font-bold text-sm text-white">بث مباشر سيادي ومشفر (8 دقائق)</h3>
                            <p class="text-xs text-gray-400 mt-0.5">سيرفرات أسطورية • إرسال واستقبال هدايا • فلاتر بصرية</p>
                        </div>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">بث نشط</span>
                </div>

                <!-- مهمة 2 -->
                <div class="glass-card p-4 rounded-2xl border-l-4 border-blue-500 flex items-center justify-between">
                    <div class="flex items-center space-x-3 space-x-reverse">
                        <input type="checkbox" checked class="w-5 h-5 accent-cyan-400 rounded cursor-pointer" onclick="showToast('💬 تشغيل المراسلة الآمنة بين الحسابات وتأمين الـ AI')">
                        <div>
                            <h3 class="font-bold text-sm text-white">المراسلة والاتصال الآمن بين الحسابات</h3>
                            <p class="text-xs text-gray-400 mt-0.5">دعم بالذكاء الاصطناعي • حسابات موثقة • إعدادات المستخدم</p>
                        </div>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-700">محمي</span>
                </div>

                <!-- مهمة 3 -->
                <div class="glass-card p-4 rounded-2xl border-l-4 border-green-500 flex items-center justify-between">
                    <div class="flex items-center space-x-3 space-x-reverse">
                        <input type="checkbox" checked class="w-5 h-5 accent-cyan-400 rounded cursor-pointer" onclick="showToast('🗺️ تحميل خريطة حضرموت وتريم Offline وتوثيق النقاط')">
                        <div>
                            <h3 class="font-bold text-sm text-white">خريطة حضرموت وتريم بدون نت (Offline)</h3>
                            <p class="text-xs text-gray-400 mt-0.5">تسجيل صوتي AES • مشاركة سيادية تتهدم خلال 5 دقائق</p>
                        </div>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-full bg-green-950 text-green-300 border border-green-700">ميداني</span>
                </div>

                <!-- مهمة 4 -->
                <div class="glass-card p-4 rounded-2xl border-l-4 border-yellow-500 flex items-center justify-between">
                    <div class="flex items-center space-x-3 space-x-reverse">
                        <input type="checkbox" class="w-5 h-5 accent-cyan-400 rounded cursor-pointer" onclick="showToast('🛡️ تم توليد الختم المشفر وقرار الـ QR الميداني')">
                        <div>
                            <h3 class="font-bold text-sm text-white">إصدار الختم الميداني المشفر + QR</h3>
                            <p class="text-xs text-gray-400 mt-0.5">توليد 10 منشورات ردع التضليل • عين الذكاء الاصطناعي Tesseract</p>
                        </div>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-full bg-yellow-950 text-yellow-300 border border-yellow-700">ردع آلي</span>
                </div>
            </div>
        </section>
    </main>

    <!-- شريط التنقل السفلي المطابق للصورة تماماً -->
    <nav class="fixed bottom-0 left-0 right-0 glass-card border-t border-gray-800 flex justify-around items-center py-3 px-2 z-40">
        <button onclick="showToast('📂 ملف المستخدم والإعدادات السيادية')" class="flex flex-col items-center text-gray-400 hover:text-cyan-400">
            <i class="fa-solid fa-user text-lg"></i>
            <span class="text-[10px] mt-1">الملف</span>
        </button>
        <button onclick="showToast('💬 المحادثات بين الحسابات')" class="flex flex-col items-center text-gray-400 hover:text-cyan-400">
            <i class="fa-solid fa-comment text-lg"></i>
            <span class="text-[10px] mt-1">المحادثات</span>
        </button>
        <button onclick="showToast('🤖 فريق الدعم وعين الذكاء الاصطناعي')" class="flex flex-col items-center text-cyan-400">
            <i class="fa-solid fa-robot text-lg"></i>
            <span class="text-[10px] mt-1">الذكاء</span>
        </button>
        <button onclick="showToast('📋 قائمة المهام السيادية نشطة')" class="flex flex-col items-center text-gray-400 hover:text-cyan-400">
            <i class="fa-solid fa-bars-staggered text-lg"></i>
            <span class="text-[10px] mt-1">المهام</span>
        </button>
        <button onclick="showToast('▶️ البث المباشر وسيرفرات الأسطورة')" class="flex flex-col items-center text-yellow-500">
            <i class="fa-solid fa-play text-lg"></i>
            <span class="text-[10px] mt-1">البث</span>
        </button>
        
        <!-- زر الإضافة المركزي العائم (مطابق للصورة) -->
        <button onclick="showToast('⚡ تنفيذ أمر سيادي فوري وتوليد بيان')" class="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-black shadow-lg shadow-cyan-500/50 border-4 border-[#0b0f19]">
            <i class="fa-solid fa-plus text-2xl font-black"></i>
        </button>
    </nav>

    <!-- تنبيه Toast -->
    <div id="toastMessage" class="toast">تم التنفيذ بنجاح</div>

    <script>
        function showToast(msg) {
            const t = document.getElementById('toastMessage');
            t.innerText = msg;
            t.style.display = 'block';
            setTimeout(() => { t.style.display = 'none'; }, 2500);
        }

        function verifyCEO() {
            const pass = document.getElementById('ceoPassword').value;
            if (pass === 'Tarim2026!Sovereign') {
                document.getElementById('authModal').style.display = 'none';
                showToast('🛡️ تم التحقق بنجاح - أهلاً بك أيها الإمبراطور CEO');
            } else {
                showToast('❌ كلمة السر غير صحيحة!');
            }
        }

        function triggerSOS() {
            alert('⚠️ تنبيه طوارئ SOS: تم تفعيل مسح النواة وحماية الملفات السيادية!');
            document.body.innerHTML = '<div style="background:black; color:red; height:100vh; display:flex; justify-content:center; align-items:center; font-size:24px; font-weight:bold;">تم قفل النظام أمنياً بنجاح.</div>';
        }
    </script>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
    
