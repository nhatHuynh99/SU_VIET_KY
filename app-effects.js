(function () {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes app-page-enter { from { opacity: 0; } to { opacity: 1; } }
    @keyframes app-reveal { from { opacity: 0; transform: translate3d(0,18px,0) scale(.99); } to { opacity: 1; transform: translate3d(0,0,0) scale(1); } }
    @keyframes app-toast-enter { from { opacity: 0; transform: translate3d(12px,-6px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
    body.app-effects-ready { animation: app-page-enter .32s ease-out; }
    html, body { transform: none !important; perspective: none !important; }
    body.app-effects-ready button, body.app-effects-ready a[href] { transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease, background-color .22s ease, border-color .22s ease, color .22s ease; }
    body.app-effects-ready button:not(:disabled):hover { transform: translateY(-2px); }
    body.app-effects-ready button:active, body.app-effects-ready a[href]:active { transform: scale(.98); }
    .app-motion-card { transition: transform .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease, border-color .32s ease; }
    .app-motion-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(40,25,20,.12); }
    .app-motion-card img { transition: transform .55s cubic-bezier(.22,1,.36,1); }
    .app-motion-card:hover img { transform: scale(1.025); }
    .app-reveal-pending { opacity: 0; transform: translate3d(0,18px,0) scale(.99); }
    .app-revealed { animation: app-reveal .62s cubic-bezier(.22,1,.36,1) both; }
    #appToastRegion { position: fixed; top: 5.25rem; right: 1rem; z-index: 120; display: flex; width: min(360px, calc(100vw - 2rem)); flex-direction: column; gap: .5rem; pointer-events: none; }
    .app-toast { display: flex; align-items: flex-start; gap: .65rem; border: 1px solid #e8e2d5; border-left: 4px solid #1c4a3e; border-radius: 10px; background: #fff; padding: .8rem .75rem .8rem .9rem; color: #29231f; box-shadow: 0 12px 32px rgba(40,25,20,.16); animation: app-toast-enter .22s ease-out both; pointer-events: auto; }
    .app-toast[data-kind="error"] { border-left-color: #b42318; }
    .app-toast[data-kind="info"] { border-left-color: #9e782f; }
    .app-toast-message { flex: 1; font-size: 13px; line-height: 1.45; }
    .app-toast-close { display: inline-flex; height: 24px; width: 24px; align-items: center; justify-content: center; border-radius: 6px; color: #6b625b; }
    .app-toast-close:hover { background: #f5f1eb; }
    @media (prefers-reduced-motion: reduce) {
      body.app-effects-ready, .app-revealed, .app-toast { animation: none; }
      body.app-effects-ready button, body.app-effects-ready a[href], .app-motion-card, .app-motion-card img { transition: none; }
      body.app-effects-ready button:not(:disabled):hover, .app-motion-card:hover, .app-motion-card:hover img { transform: none; }
    }
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
    const revealSelector = 'main > div > section, main article, #section-overview, #section-books, #section-posts, #section-members, #section-guide-management, #section-settings, main [data-app-reveal]';
    const cardSelector = 'main article, main [data-app-hover], main > div > div[class*="rounded-"][class*="shadow"]';
    const observed = new WeakSet();
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('app-reveal-pending');
          entry.target.classList.add('app-revealed');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' })
      : null;

    function prepareContent(root = document) {
      function collect(selector) {
        const elements = Array.from(root.querySelectorAll(selector));
        if (root.nodeType === Node.ELEMENT_NODE && root.matches(selector)) elements.unshift(root);
        return elements;
      }

      collect(cardSelector).forEach((element) => element.classList.add('app-motion-card'));
      collect(revealSelector).forEach((element, index) => {
        if (observed.has(element)) return;
        observed.add(element);
        if (!observer) {
          element.classList.add('app-revealed');
          return;
        }
        element.style.animationDelay = `${Math.min(index, 6) * 55}ms`;
        element.classList.add('app-reveal-pending');
        observer.observe(element);
      });
    }

    prepareContent();
    if ('MutationObserver' in window && document.body) {
      const contentObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) prepareContent(node);
          });
        });
      });
      contentObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', revealPageContent, { once: true });
  else revealPageContent();
})();