let currentStream = null;
let currentFacingMode = 'user';
let totalGiftsScore = 0;
let isFlashOn = false;

async function startLiveStreamWithCamera(mode) {
    currentFacingMode = mode || 'user';
    const modal = document.getElementById('liveStreamModal');
    const video = document.getElementById('liveVideoElement');
    if (!modal || !video) return;

    modal.classList.remove('hidden');

    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: { facingMode: currentFacingMode },
            audio: true
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        showToast(`🔴 بدأ البث بالكاميرا الـ ${currentFacingMode === 'user' ? 'أمامية' : 'خلفية'} بنجاح!`);
    } catch (err) {
        console.error(err);
        showToast('⚠️ تعذر تشغيل الكاميرا، يرجى منح الإذن من المتصفح');
        modal.classList.add('hidden');
    }
}

function stopLiveStream() {
    const modal = document.getElementById('liveStreamModal');
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    if (modal) modal.classList.add('hidden');
    showToast('⏹️ تم إيقاف البث بنجاح');
}

async function toggleFlash() {
    if (!currentStream) {
        showToast('⚠️ يرجى تشغيل الكاميرا (خلفية) أولاً لتفعيل الفلاش');
        return;
    }
    const track = currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (!capabilities.torch) {
        showToast('⚠️ الفلاش غير متوفر في هذه الكاميرا');
        return;
    }

    try {
        isFlashOn = !isFlashOn;
        await track.applyConstraints({
            advanced: [{ torch: isFlashOn }]
        });
        showToast(isFlashOn ? '⚡ تم تشغيل الفلاش' : '⚡ تم إطفاء الفلاش');
    } catch (err) {
        console.error(err);
        showToast('⚠️ تعذر تشغيل الفلاش');
    }
}

function applyFilter(filterValue) {
    const video = document.getElementById('liveVideoElement');
    if (video) {
        video.style.filter = filterValue;
        showToast('✨ تم تطبيق الفلتر على البث');
    }
}

function sendGift(giftName, points) {
    totalGiftsScore += points;
    const badge = document.getElementById('giftCounterBadge');
    if (badge) {
        badge.innerText = `🎁 الهدايا: ${totalGiftsScore}`;
    }
    showToast(`🎁 تم إرسال: ${giftName} (+${points} نقطة)!`);
}

function handleFileSelected(event, type) {
    const file = event.target.files[0];
    if (file) {
        showToast(`✅ تم اختيار الـ ${type === 'image' ? 'صورة' : 'فيديو'} بنجاح: ${file.name}`);
    }
}
