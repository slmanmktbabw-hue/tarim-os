// settings.js - عقل الدولة السيادي لـ TARIM OS
// كل أرقام القلعة السيادية هنا - غير من هنا يطبق في كل المنصة

module.exports = {
    // معلومات النظام
    systemName: "TARIM OS V1.0 Beta",
    systemFullName: "من تريم إلى العالم",
    sovereign: "AL",
    emperorName: "أبو سلمان",
    version: "1.0.0 Official",
    
    // الموقع السيادي - تريم حضرموت
    location: {
        city: "Tarim",
        region: "Hadhramaut",
        country: "Yemen",
        coords: [16.0500, 48.9833],
        lat: 16.0500,
        lng: 48.9833
    },

    // إعدادات البث المباشر الملكي
    live: {
        maxDurationMinutes: 8,
        maxDurationSeconds: 480, // 8*60
        autoStop: true,
        enableChat: true,
        enableLikes: true,
        enableGifts: true
    },

    // إعدادات الكاميرا السيادية
    camera: {
        defaultFacing: "environment", // env = خلفية، user = أمامية
        enableTorch: true,
        enableFilters: true,
        enableSwitch: true
    },

    // خريطة حضرموت Offline
    map: {
        provider: "Offline Leaflet",
        defaultZoom: 13,
        defaultCenter: [16.0500, 48.9833],
        offlineCache: true,
        attribution: "TARIM OS Sovereign Map"
    },

    // محفظة OKX الملكية
    okx: {
        initialBalance: 1000,
        currency: "TARIM",
        walletPrefix: "0x53",
        walletSuffix: "ab96"
    },

    // الأمان السيادي
    security: {
        jwtExpiresIn: "7d",
        rateLimitGlobal: 100,
        rateLimitLogin: 5,
        helmetEnabled: true,
        corsEnabled: true
    },

    // عين الذكاء الاصطناعي
    aiEye: {
        offline: true,
        model: "TarimAI v1",
        language: "ar",
        version: "Sovereign"
    },

    // المنصة
    platform: {
        domain: "tarimos.org",
        port: 10000,
        env: "production"
    }
};
