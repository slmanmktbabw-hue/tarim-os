// public/support.js - TARIM OS Sovereign Support - PRODUCTION READY - NO ALERT
"use strict";

(function() {
    let isOpen = false;

    function createSupportModal() {
        if (document.getElementById('supportModal')) return;

        const modal = document.createElement('div');
        modal.id = 'supportModal';
        modal.className = 'hidden fixed inset-0 z-[75] bg-black/90 backdrop-blur-sm p-4 items-center justify-center';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        const box = document.createElement('div');
        box.className = 'glass w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl border border-cyan-500/20';

        // Header
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center border-b border-white/10 pb-4';
        const title = document.createElement('h3');
        title.className = 'text-sm font-black text-cyan-400';
        title.textContent = 'فريق الدعم السيادي - TARIM OS';
        const closeBtn = document.createElement('button');
        closeBtn.id = 'closeSupportBtn';
        closeBtn.className = 'text-slate-400 hover:text-white text-xs bg-slate-900 px-3 py-1 rounded-lg';
        closeBtn.textContent = 'إغلاق';
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'space-y-4 text-right';

        const info = document.createElement('div');
        info.className = 'bg-slate-900/70 p-4 rounded-xl border border-white/5 space-y-2';
        const p1 = document.createElement('p');
        p1.className = 'text-[13px] text-slate-200';
        p1.textContent = 'أهلاً بك يا إمبراطور في مركز القيادة من تريم حضرموت.';
        const p2 = document.createElement('p');
        p2.className = 'text-[11px] text-slate-400';
        p2.textContent = 'نعمل 24/7 لحماية سيادة منصتك. متوسط الرد: 8 دقائق.';
        info.appendChild(p1);
        info.appendChild(p2);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'grid grid-cols-2 gap-2';

        const waBtn = document.createElement('a');
        waBtn.href = 'https://wa.me/967000000000?text=سلام%20فريق%20TARIM%20OS';
        waBtn.target = '_blank';
        waBtn.rel = 'noopener';
        waBtn.className = 'bg-emerald-600 hover:bg-emerald-500 text-white text-center py-3 rounded-xl text-xs font-bold transition';
        waBtn.textContent = 'واتساب سيادي';

        const mailBtn = document.createElement('a');
        mailBtn.href = 'mailto:sovereign@tarimos.org?subject=دعم%20TARIM%20OS';
        mailBtn.className = 'bg-slate-800 hover:bg-slate-700 text-white text-center py-3 rounded-xl text-xs font-bold border border-white/10 transition';
        mailBtn.textContent = 'بريد سيادي';

        actions.appendChild(waBtn);
        actions.appendChild(mailBtn);

        const footer = document.createElement('p');
        footer.className = 'text-[10px] text-slate-500 text-center';
        footer.textContent = 'Tarim, Hadhramaut - من تريم إلى العالم - 2026';

        body.appendChild(info);
        body.appendChild(actions);
        body.appendChild(footer);

        box.appendChild(header);
        box.appendChild(body);
        modal.appendChild(box);
        document.body.appendChild(modal);

        // Events - محصنة
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function openModal() {
        const modal = document.getElementById('supportModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const modal = document.getElementById('supportModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        isOpen = false;
        document.body.style.overflow = '';
    }

    // تهيئة عند التحميل
    document.addEventListener('DOMContentLoaded', () => {
        createSupportModal();

        const supportBtn = document.getElementById('openSupportBtn');
        if (supportBtn) {
            supportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        }

        // إغلاق بزر Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) closeModal();
        });

        console.log('[TARIM SUPPORT] Sovereign Support System Loaded - No Alert');
    });

})();
