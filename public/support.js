// public/support.js - TARIM OS Support System
document.addEventListener('DOMContentLoaded', () => {
    const supportBtn = document.getElementById('openSupportBtn');
    if (supportBtn) {
        // حراسة لضمان عدم تكرار ربط الحدث
        if (!supportBtn.dataset.bound) {
            supportBtn.dataset.bound = "true";
            supportBtn.addEventListener('click', () => {
                alert('🛡️ فريق الدعم السيادي لـ TARIM OS في خدمتك دائماً على مدار الساعة يا أبو سلمان من تريم حضرموت.');
            });
        }
    }
});
