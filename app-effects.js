(function () {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes app-page-enter { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes app-reveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes app-toast-enter { from { opacity: 0; transform: translate3d(12px,-6px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
    body.app-effects-ready { animation: app-page-enter .38s ease-out both; }
    body.app-effects-ready button, body.app-effects-ready a[href] { transition-property: transform, box-shadow; transition-duration: 150ms; }
    body.app-effects-ready button:active, body.app-effects-ready a[href]:active { transform: scale(.98); }
    .app-reveal-pending { opacity: 0; transform: translateY(12px); }
    .app-revealed { animation: app-reveal .45s ease-out both; }
    #appToastRegion { position: fixed; top: 5.25rem; right: 1rem; z-index: 120; display: flex; width: min(360px, calc(100vw - 2rem)); flex-direction: column; gap: .5rem; pointer-events: none; }
    .app-toast { display: flex; align-items: flex-start; gap: .65rem; border: 1px solid #e8e2d5; border-left: 4px solid #1c4a3e; border-radius: 10px; background: #fff; padding: .8rem .75rem .8rem .9rem; color: #29231f; box-shadow: 0 12px 32px rgba(40,25,20,.16); animation: app-toast-enter .22s ease-out both; pointer-events: auto; }
    .app-toast[data-kind="error"] { border-left-color: #b42318; }
    .app-toast[data-kind="info"] { border-left-color: #9e782f; }
    .app-toast-message { flex: 1; font-size: 13px; line-height: 1.45; }
    .app-toast-close { display: inline-flex; height: 24px; width: 24px; align-items: center; justify-content: center; border-radius: 6px; color: #6b625b; }
    .app-toast-close:hover { background: #f5f1eb; }
    @media (prefers-reduced-motion: reduce) { body.app-effects-ready, .app-revealed, .app-toast { animation: none; } body.app-effects-ready button, body.app-effects-ready a[href] { transition: none; } }
  `;
  document.head.appendChild(style);

  function getToastRegion() {
    let region = document.getElementById('appToastRegion');
    if (!region) {
      region = document.createElement('div');
      region.id = 'appToastRegion';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(region);
    }
    return region;
  }

  window.showAppToast = function (message, kind = 'success', duration = 3600) {
    if (!message) return;
    const region = getToastRegion();
    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.dataset.kind = ['success', 'error', 'info'].includes(kind) ? kind : 'success';
    const icon = kind === 'error' ? 'error' : kind === 'info' ? 'info' : 'check_circle';
    const iconColor = kind === 'error' ? '#b42318' : kind === 'info' ? '#9e782f' : '#1c4a3e';
    toast.innerHTML = `<span class="material-symbols-outlined" style="color:${iconColor}" aria-hidden="true">${icon}</span><span class="app-toast-message"></span><button class="app-toast-close" type="button" aria-label="Đóng thông báo"><span class="material-symbols-outlined text-[18px]">close</span></button>`;
    toast.querySelector('.app-toast-message').textContent = String(message);
    const remove = () => toast.remove();
    toast.querySelector('.app-toast-close').addEventListener('click', remove);
    region.appendChild(toast);
    window.setTimeout(remove, duration);
  };

  window.setAppToastForNextPage = function (message, kind = 'success') {
    try {
      localStorage.setItem('appToastFlash', JSON.stringify({ message, kind }));
    } catch (error) {
      window.showAppToast(message, kind);
    }
  };

  function revealPageContent() {
    document.body.classList.add('app-effects-ready');
    try {
      const flash = JSON.parse(localStorage.getItem('appToastFlash') || 'null');
      localStorage.removeItem('appToastFlash');
      if (flash?.message) window.showAppToast(flash.message, flash.kind);
    } catch (error) {
      localStorage.removeItem('appToastFlash');
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const candidates = document.querySelectorAll('main > section, main > div > section, main article, #section-overview, #section-books, #section-posts, #section-members, #section-guide-management, #section-settings');
    if (!('IntersectionObserver' in window)) {
      candidates.forEach((element) => element.classList.add('app-revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('app-reveal-pending');
        entry.target.classList.add('app-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    candidates.forEach((element, index) => {
      element.style.animationDelay = `${Math.min(index, 6) * 45}ms`;
      element.classList.add('app-reveal-pending');
      observer.observe(element);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', revealPageContent, { once: true });
  else revealPageContent();
})();