let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("✅ التطبيق جاهز للتنزيل الفوري كـ PWA");
});

function installAppPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        showToast('📥 جاري تثبيت التطبيق على جهازك...');
      }
      deferredPrompt = null;
    });
  } else {
    showToast('💡 لتنزيل التطبيق: اضغط على خيارات المتصفح (⋮) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
  }
}

// تسجيل Service Worker لضمان العمل الحقيقي
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('🛡️ Service Worker يعمل بنجاح:', reg.scope))
      .catch(err => console.log('⚠️ خطأ في Service Worker:', err));
  });
}
