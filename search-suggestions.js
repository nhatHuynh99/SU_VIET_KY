(function () {
  const suggestions = [
    { label: 'Bình Ngô Đại Cáo', detail: 'Tác phẩm · Nguyễn Trãi', query: 'Bình Ngô Đại Cáo', type: 'book' },
    { label: 'Binh Thư Yếu Lược', detail: 'Binh thư · Trần Hưng Đạo', query: 'Binh Thư Yếu Lược', type: 'book' },
    { label: 'Bạch Đằng 1288', detail: 'Sự kiện · Thời Trần', query: '1288', type: 'year' },
    { label: 'Chiếu dời đô', detail: 'Tác phẩm · Nhà Lý, năm 1010', query: 'Chiếu dời đô', type: 'book' },
    { label: 'Thăng Long 1010', detail: 'Sự kiện · Lý Công Uẩn dời đô', query: '1010', type: 'year' },
    { label: 'Quang Trung đại phá quân Thanh', detail: 'Sự kiện · Tây Sơn, năm 1789', query: '1789', type: 'year' },
    { label: 'Tuyên ngôn Độc lập', detail: 'Sự kiện · Hà Nội, năm 1945', query: '1945', type: 'year' },
    { label: 'Hịch Tướng Sĩ', detail: 'Tác phẩm · Trần Quốc Tuấn', query: 'Hịch Tướng Sĩ', type: 'book' },
    { label: 'Nam Quốc Sơn Hà', detail: 'Tác phẩm · Thời Lý', query: 'Nam Quốc Sơn Hà', type: 'book' },
    { label: 'Đại Việt Sử Ký Toàn Thư', detail: 'Bộ quốc sử · Ngô Sĩ Liên', query: 'Đại Việt Sử Ký Toàn Thư', type: 'book' },
    { label: 'Hai Bà Trưng', detail: 'Nhân vật · Khởi nghĩa năm 40', query: '40', type: 'year' },
    { label: 'Lê Lợi', detail: 'Nhân vật · Khởi nghĩa Lam Sơn', query: 'Lê Lợi', type: 'book' }
  ];
  const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();

  function destination(item) {
    return item.type === 'year'
      ? `search.html?year=${encodeURIComponent(item.query)}`
      : `book.html?q=${encodeURIComponent(item.query)}`;
  }

  function bindInput(input) {
    if (input.dataset.suggestionsBound) return;
    input.dataset.suggestionsBound = 'true';
    const host = input.parentElement;
    if (!host) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const list = document.createElement('div');
    list.className = 'search-suggestions hidden';
    list.setAttribute('role', 'listbox');
    list.id = `searchSuggestions-${Math.random().toString(36).slice(2, 9)}`;
    list.style.cssText = 'position:absolute;top:calc(100% + 8px);left:0;right:0;z-index:100;max-height:min(360px,60vh);overflow:auto;background:white;border:1px solid #e8e2d5;border-radius:12px;padding:6px;box-shadow:0 16px 36px rgba(40,25,20,.16)';
    host.appendChild(list);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    let activeIndex = -1;

    const close = () => {
      list.classList.add('hidden');
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');
    };
    const paintActive = () => {
      const options = [...list.querySelectorAll('[role="option"]')];
      options.forEach((option, index) => {
        const active = index === activeIndex;
        option.style.background = active ? '#f6ece7' : 'transparent';
        option.setAttribute('aria-selected', String(active));
      });
      if (options[activeIndex]) {
        input.setAttribute('aria-activedescendant', options[activeIndex].id);
        options[activeIndex].scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    };
    const render = () => {
      const query = normalize(input.value);
      if (query.length < 1) {
        close();
        return;
      }
      const matches = suggestions.filter((item) => normalize(`${item.label} ${item.detail}`).includes(query)).slice(0, 7);
      if (!matches.length) {
        list.innerHTML = '<div style="padding:12px;color:#746b64;font-size:13px">Chưa có gợi ý phù hợp. Nhấn Enter để tìm trong kho.</div>';
      } else {
        list.innerHTML = matches.map((item, index) => `<a href="${destination(item)}" id="${list.id}-option-${index}" role="option" aria-selected="false" data-suggestion-index="${index}" style="display:flex;width:100%;align-items:center;gap:10px;border:0;border-radius:8px;background:transparent;padding:9px 10px;text-align:left;text-decoration:none;cursor:pointer"><span class="material-symbols-outlined" style="color:#9e782f;font-size:20px">${item.type === 'year' ? 'event' : 'menu_book'}</span><span style="display:flex;min-width:0;flex-direction:column"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#332923;font-size:13px;font-weight:600">${item.label}</span><span style="margin-top:2px;color:#746b64;font-size:11px">${item.detail}</span></span></a>`).join('');
        list.querySelectorAll('[data-suggestion-index]').forEach((button) => {
          button.addEventListener('mouseenter', () => {
            activeIndex = Number(button.dataset.suggestionIndex);
            paintActive();
          });
          button.addEventListener('click', () => {
            const selected = matches[Number(button.dataset.suggestionIndex)];
            if (selected) window.setAppToastForNextPage?.(`Đang mở gợi ý “${selected.label}”.`, 'info');
          });
        });
      }
      activeIndex = -1;
      list.classList.remove('hidden');
    };

    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('keydown', (event) => {
      if (list.classList.contains('hidden')) return;
      const options = list.querySelectorAll('[role="option"]');
      if (event.key === 'ArrowDown' && options.length) {
        event.preventDefault();
        activeIndex = (activeIndex + 1) % options.length;
        paintActive();
      } else if (event.key === 'ArrowUp' && options.length) {
        event.preventDefault();
        activeIndex = activeIndex <= 0 ? options.length - 1 : activeIndex - 1;
        paintActive();
      } else if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        options[activeIndex]?.click();
      } else if (event.key === 'Escape') close();
    }, true);
    document.addEventListener('pointerdown', (event) => {
      if (!host.contains(event.target)) close();
    });
  }

  function bindAll() {
    document.querySelectorAll('header input[type="search"], header input[type="text"], #book-filter, #postSearchInput').forEach(bindInput);
  }

  document.addEventListener('DOMContentLoaded', bindAll, { once: true });
  const observer = new MutationObserver(bindAll);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
