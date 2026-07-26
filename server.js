<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TARIM OS v14 - سيادي كامل</title><script src="https://cdn.tailwindcss.com"></script><script src="/socket.io/socket.io.js"></script><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@700;800;900&display=swap" rel="stylesheet"><style>*{font-family:'Tajawal',sans-serif}body{background:#080c14}.glass{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.08)}</style></head><body class="text-white min-h-screen pb-28">

<!-- بوابة CEO -->
<div id="authGate" class="fixed inset-0 z-[100] bg-[#080c14] flex items-center justify-center p-4">
<div class="w-full max-w-[360px] bg-[#0e1524]/90 border border-cyan-500/20 rounded-[24px] p-6 backdrop-blur-xl">
<div class="w-20 h-20 mx-auto rounded-full bg-[#0f1f35] border border-cyan-500/20 flex items-center justify-center text-3xl">🛡️</div>
<h2 class="text-center font-black text-cyan-400 text-[18px] mt-4">بصمة الأمان السيادية للـ CEO</h2>
<p class="text-center text-gray-400 text-[12px] mt-1">انشاء حساب/ أدخل رقم الجوال / البريد الالكتروني</p>
<input id="userPhone" type="text" placeholder="رقم الجوال أو البريد الإلكتروني" class="w-full mt-6 bg-black/60 border border-white/10 rounded-2xl px-4 py-3.5 text-[13px] text-center outline-none">
<input id="userPass" type="password" placeholder="••••••••" class="w-full mt-3 bg-black/60 border border-white/10 rounded-2xl px-4 py-3.5 text-[13px] text-center outline-none">
<button onclick="loginCEO()" class="w-full mt-4 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-black py-3.5 rounded-2xl text-[13px]">فتح القلعة السيادية</button>
<button onclick="showToast('🚨 تم إرسال SOS - فريق الدعم AL في الطريق')" class="w-full mt-3 bg-red-900/30 border border-red-500/20 text-red-400 py-3 rounded-2xl text-[13px] font-bold">⚠️ طوارئ SOS</button>
</div>
</div>

<header class="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10 px-3 py-2.5 flex justify-between items-center"><div class="flex items-center gap-2"><div class="font-black text-cyan-400 text-[11px]">TARIM OS v14</div><span onclick="openTab('ai')" class="bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[9px] px-3 py-1 rounded-full font-bold cursor-pointer">فريق الدعم (AL) ✅</span></div><div onclick="showToast('👓 تم تفعيل التمويه السيادي')" class="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] px-3 py-1.5 rounded-full font-bold cursor-pointer">👓 تمويه</div></header>

<main id="tab-home" class="p-3 space-y-3">
<div class="h-[265px] rounded-[22px] overflow-hidden border border-white/10 relative bg-cover bg-center cursor-pointer" onclick="showToast('🔴 دخلت البث المباشر السيادي')" style="background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.9)),url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200')"><div class="absolute top-3 left-3 right-3 flex justify-between"><span class="bg-red-600 text-[11px] px-3 py-1 rounded-full font-bold animate-pulse">مباشر</span><span class="bg-black/60 border border-white/10 text-yellow-400 text-[13px] px-3 py-1 rounded-full font-bold">24.3K ⭐</span></div><div class="absolute left-3 top-[65px] space-y-3"><div onclick="event.stopPropagation();createPost('هدية')" class="w-12 h-12 bg-black/60 border border-white/15 rounded-full flex flex-col items-center justify-center"><span>🎁</span><span class="text-[8px]">إرسال</span></div><div onclick="event.stopPropagation();showToast('📥 استقبال الهدايا شغال')" class="w-12 h-12 bg-black/60 border border-white/15 rounded-full flex flex-col items-center justify-center"><span>📥</span><span class="text-[8px]">استقبال</span></div></div><div class="absolute bottom-0 left-0 right-0 p-3 text-center"><div class="font-black text-[13px]">بث مباشر سيادي ومشفر (فلتر بصري وهدايا)</div><div class="text-[11px] text-gray-300">سيرفرات أسطورية • إرسال واستقبال هدايا</div></div></div>
<div id="tasksContainer" class="space-y-2"></div>
<div class="grid grid-cols-2 gap-2"><button onclick="executeOrder()" class="glass p-3 rounded-xl text-[12px] font-bold">⚡ تنفيذ أمر سيادي</button><button onclick="scanAI()" class="glass p-3 rounded-xl text-[12px] font-bold">👁️ فحص عين الذكاء</button></div>
</main>

<main id="tab-operations" class="p-3 space-y-2 hidden">
<button onclick="openTab('home')" class="w-full glass p-4 rounded-2xl text-right flex justify-between"><span class="font-bold text-[13px]">🔴 بث مباشر سيادي ومشفر (8 دقائق)</span><span>›</span></button>
<button onclick="openTab('messages')" class="w-full glass p-4 rounded-2xl text-right flex justify-between"><span class="font-bold text-[13px]">🔒 المراسلة والاتصال الآمن</span><span>›</span></button>
<button onclick="showToast('🗺️ خريطة حضرموت Offline - جاري التحميل')" class="w-full glass p-4 rounded-2xl text-right flex justify-between"><span class="font-bold text-[13px]">🗺️ خريطة حضرموت وتريم Offline</span><span>›</span></button>
<button onclick="openTab('ai')" class="w-full glass p-4 rounded-2xl text-right flex justify-between border border-cyan-500/20"><span class="font-bold text-[13px]">🔏 إصدار الختم الميداني + QR</span><span class="text-cyan-400">›</span></button>
</main>

<main id="tab-messages" class="p-3 hidden"><div class="glass p-4 rounded-2xl"><div class="font-black mb-3">💬 المراسلة الآمنة</div><div id="chatLogs" class="space-y-2 max-h-[300px] overflow-y-auto mb-3"></div><div class="flex gap-2"><input id="chatIn" placeholder="اكتب رسالة سيادية..." class="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs"><button onclick="sendMsg()" class="bg-cyan-500 text-black px-4 rounded-xl text-xs font-bold">إرسال</button></div></div></main>

<main id="tab-profile" class="p-3 space-y-2 hidden">
<div class="glass p-4 rounded-2xl flex gap-3 items-center"><div class="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-black font-black">AL</div><div><div class="font-black">الإمبراطور AL</div><div id="userDisplay" class="text-xs text-gray-400">الملف الشخصي</div></div></div>
<button onclick="showToast('💰 رصيدك: 12,540 نقطة سيادية')" class="w-full glass p-3.5 rounded-xl text-right text-[13px] flex justify-between"><span>💰 رصيد</span><span>›</span></button>
<button onclick="showToast('📊 34 نشاط - 12 مهمة مكتملة')" class="w-full glass p-3.5 rounded-xl text-right text-[13px] flex justify-between"><span>📊 مركز الأنشطة</span><span>›</span></button>
<button onclick="showToast('📹 8 فيديوهات محفوظة Offline')" class="w-full glass p-3.5 rounded-xl text-right text-[13px] flex justify-between"><span>📹 فيديوهات دون اتصال</span><span>›</span></button>
<button onclick="openTab('ai')" class="w-full glass p-3.5 rounded-xl text-right text-[13px] flex justify-between border border-cyan-500/20"><span>🔳 رمز QR لديك</span><span class="text-cyan-400">›</span></button>
<button onclick="showToast('🏪 المتجر السيادي - قريبا')" class="w-full glass p-3.5 rounded-xl text-right text-[13px] flex justify-between"><span>🏪 المجموعة التجارية</span><span>›</span></button>
<button onclick="showToast('📢 ترويج ممول - قريبا')" class="w-full glass p-3.5 rounded-xl text-right text-[13px] flex justify-between"><span>📢 الترويج</span><span>›</span></button>
<div class="text-[11px] text-gray-500 font-bold pt-2">الإعدادات والخصوصية</div>
<button onclick="showToast('📝 إدارة المنشورات')" class="w-full glass p-3 rounded-xl text-right text-[12px]">📝 إدارة المنشورات</button>
<button onclick="showToast('🎛️ تم حفظ تفضيلات المحتوى')" class="w-full glass p-3 rounded-xl text-right text-[12px]">🎛️ تفضيلات المحتوى</button>
<button onclick="openTab('home')" class="w-full glass p-3 rounded-xl text-right text-[12px]">🔴 LIVE - العودة للبث</button>
<button onclick="showToast('🔔 الإشعارات: مفعلة')" class="w-full glass p-3 rounded-xl text-right text-[12px]">🔔 الإشعارات</button>
<button onclick="showToast('🛡️ الأمان: مشفر سيادي ✅')" class="w-full glass p-3 rounded-xl text-right text-[12px]">🛡️ الأمان والأذونات</button>
<button onclick="localStorage.clear();location.reload();" class="w-full bg-red-900/20 border border-red-500/20 p-3 rounded-xl text-right text-[12px] text-red-400">🚪 تسجيل خروج</button>
</main>

<main id="tab-ai" class="p-3 hidden"><div class="glass p-4 rounded-2xl text-center"><h3 class="font-black text-cyan-400">فريق الدعم AL + الختم الميداني</h3><canvas id="qr" width="160" height="160" class="bg-white rounded-xl hidden mx-auto mt-3"></canvas><div id="sealCode" class="mt-2 text-xs text-cyan-300"></div><button onclick="genQR()" class="mt-3 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold">توليد الختم</button><div id="aiRes" class="mt-3 text-xs bg-black/40 p-3 rounded-xl">جاهز...</div><button onclick="scanAI()" class="mt-3 w-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 py-2 rounded-xl text-xs">👁️ فحص عين الذكاء</button></div></main>

<div id="createSheet" class="fixed inset-0 z-[90] hidden"><div onclick="closeCreate()" class="absolute inset-0 bg-black/70"></div><div class="absolute bottom-0 left-0 right-0 bg-[#10131f] border-t border-white/10 rounded-t-[28px] p-5"><h3 class="font-black text-center mb-4">إنشاء</h3><div class="grid grid-cols-2 gap-3"><button onclick="createPost('نص سيادي')" class="glass py-5 rounded-2xl font-bold">📝 نص</button><button onclick="createPost('منشور سيادي')" class="glass py-5 rounded-2xl font-bold">📄 منشور</button><button onclick="createPost('بث LIVE')" class="glass py-5 rounded-2xl font-bold text-red-300">🔴 LIVE</button><button onclick="createPost('فلتر بصري')" class="glass py-5 rounded-2xl font-bold">🎨 فلتر</button></div><button onclick="closeCreate()" class="w-full mt-4 text-gray-400 text-xs">إغلاق</button></div></div>

<nav class="fixed bottom-0 left-0 right-0 bg-[#080c14] border-t border-white/10 py-2 px-1 flex justify-around z-50">
<button onclick="openTab('home')" data-nav="home" class="flex flex-col items-center text-cyan-400"><span class="text-[22px]">🏠</span><span class="text-[9px] mt-1 font-bold">الرئيسية</span></button>
<button onclick="openTab('operations')" data-nav="operations" class="flex flex-col items-center text-white/40"><span class="text-[22px]">👁️</span><span class="text-[9px] mt-1">العمليات</span></button>
<button onclick="openCreate()" class="w-14 h-14 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-black text-2xl -mt-7 border-4 border-[#080c14]">+</button>
<button onclick="openTab('messages')" data-nav="messages" class="flex flex-col items-center text-white/40"><span class="text-[22px]">💬</span><span class="text-[9px] mt-1">المراسلة</span></button>
<button onclick="openTab('profile')" data-nav="profile" class="flex flex-col items-center text-white/40"><span class="text-[22px]">👑</span><span class="text-[9px] mt-1">الملف</span></button>
</nav>
<div id="toastBox" class="fixed top-16 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm space-y-2"></div>
<script src="script.js"></script>
</body></html>
