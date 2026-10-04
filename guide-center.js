(function () {
  const storageKey = 'suvietPageGuides';
  const pages = {
    'index.html': {
      title: 'Trang chủ',
      intro: 'Trang chủ tập trung dòng thời gian lịch sử và lối tắt đến tra cứu, thư viện, bài viết cộng đồng.',
      features: [
        { title: 'Tra cứu theo năm', description: 'Nhập năm dương lịch để mở trang sự kiện tương ứng.', steps: ['Nhập năm vào ô Tìm Năm Cụ Thể.', 'Nhấn Enter hoặc nút Tìm.', 'Chọn một mốc trong danh sách để xem nội dung.'] },
        { title: 'Tìm kiếm và mở kho sách', description: 'Dùng thanh tìm kiếm ở đầu trang hoặc chuyển sang kho sách lịch sử.', steps: ['Nhập tên nhân vật, sự kiện hoặc từ khóa vào ô tìm kiếm.', 'Nhấn Enter để xem kết quả phù hợp.', 'Chọn Sách lịch sử Việt Nam để mở thư viện.'] },
        { title: 'Đăng bài ẩn danh', description: 'Gửi câu chuyện hoặc phát hiện lịch sử từ khu vực cộng đồng ở cuối trang.', steps: ['Mở mục Chia sẻ một phát hiện.', 'Nhập tiêu đề, nội dung và nguồn tham khảo nếu có.', 'Nhấn Đăng bài; bài sẽ hiển thị với tên Ẩn danh.'] }
      ]
    },
    'search.html': {
      title: 'Tra cứu sự kiện',
      intro: 'Trang tra cứu trình bày các mốc lịch sử theo dòng thời gian, kèm nội dung, tư liệu và nguồn tham khảo.',
      features: [
        { title: 'Chọn mốc thời gian', description: 'Nhấn vào thẻ sự kiện trên dòng thời gian để chọn và làm nổi bật mốc đó.', steps: ['Tìm mốc cần xem trong danh sách.', 'Nhấn vào thẻ sự kiện.', 'Đọc nội dung chi tiết và tư liệu hiển thị bên cạnh.'] },
        { title: 'Mở nhanh theo năm', description: 'Dùng ô năm trên trang chủ hoặc thanh tìm kiếm để đến các mốc liên quan.', steps: ['Nhập năm cần tra cứu.', 'Nhấn Enter hoặc nút tìm.', 'Chọn sự kiện phù hợp trong kết quả.'] },
        { title: 'Tra cứu tư liệu liên quan', description: 'Mỗi mốc có thể kèm văn kiện, hình ảnh, bản đồ hoặc liên kết nguồn.', steps: ['Chọn một mốc sự kiện.', 'Cuộn đến phần tư liệu và nguồn.', 'Mở liên kết nguồn để đọc đối chiếu.'] }
      ]
    },
    'book.html': {
      title: 'Kho sách lịch sử',
      intro: 'Kho sách cho phép duyệt danh mục, tìm tác phẩm và mở trang đọc chi tiết.',
      features: [
        { title: 'Tìm tên sách hoặc tác giả', description: 'Ô Lọc trong tủ sách tìm theo tiêu đề, tác giả, thời kỳ, thể loại hoặc phần giới thiệu.', steps: ['Nhập từ khóa vào ô Lọc trong tủ sách.', 'Nhấn Enter để cập nhật danh sách.', 'Chọn Đọc ngay tại tác phẩm phù hợp.'] },
        { title: 'Duyệt danh mục và mở sách', description: 'Danh sách hiển thị ảnh bìa, thời kỳ, tác giả và phần giới thiệu ngắn.', steps: ['Cuộn qua danh sách và các nhóm tư liệu gợi ý ở cột bên.', 'Đọc thông tin tóm tắt trên thẻ sách.', 'Nhấn Đọc ngay để mở trang chi tiết.'] },
        { title: 'Đọc và nghe nội dung', description: 'Trang chi tiết có các phần nội dung, bản dịch và công cụ đọc thành tiếng khi dữ liệu hỗ trợ.', steps: ['Mở một tác phẩm.', 'Chuyển giữa các thẻ nội dung và bản dịch.', 'Nhấn nút đọc thành tiếng nếu nút này xuất hiện.'] }
      ]
    },
    'login.html': {
      title: 'Đăng nhập và đăng ký',
      intro: 'Dùng trang này để đăng nhập tài khoản hiện có hoặc tạo tài khoản thành viên mới.',
      features: [
        { title: 'Đăng nhập', description: 'Nhập thông tin tài khoản đã đăng ký để vào trang chủ.', steps: ['Chọn tab Đăng Nhập.', 'Nhập email/tên đăng nhập và mật khẩu.', 'Nhấn Đăng Nhập Vào Sử Việt Ký.'] },
        { title: 'Đăng ký tài khoản', description: 'Tạo tài khoản bằng tên, email và mật khẩu xác nhận.', steps: ['Chọn Đăng Ký Tài Khoản.', 'Điền các thông tin bắt buộc và xác nhận mật khẩu.', 'Sau khi đăng ký thành công, chuyển sang tab đăng nhập và nhập mật khẩu để tiếp tục.'] },
        { title: 'Hiện hoặc ẩn mật khẩu', description: 'Dùng biểu tượng con mắt cạnh trường mật khẩu để kiểm tra nội dung vừa nhập.', steps: ['Nhấn biểu tượng con mắt.', 'Kiểm tra mật khẩu.', 'Nhấn lại để ẩn mật khẩu.'] }
      ]
    },
    're.html': {
      title: 'Đăng ký thành viên',
      intro: 'Trang đăng ký thành viên cung cấp biểu mẫu tạo tài khoản và khu vực đăng nhập.',
      features: [
        { title: 'Tạo tài khoản', description: 'Nhập họ tên, tên đăng nhập/email và mật khẩu theo yêu cầu trên biểu mẫu.', steps: ['Điền đầy đủ các trường bắt buộc.', 'Nhập lại mật khẩu xác nhận nếu biểu mẫu yêu cầu.', 'Gửi biểu mẫu; đăng ký xong cần đăng nhập riêng.'] },
        { title: 'Đăng nhập', description: 'Dùng khu vực đăng nhập để vào ứng dụng sau khi đã có tài khoản.', steps: ['Mở phần Đăng Nhập.', 'Nhập tài khoản và mật khẩu.', 'Nhấn nút đăng nhập để tiếp tục.'] },
        { title: 'Kiểm tra dữ liệu', description: 'Nếu biểu mẫu báo lỗi, kiểm tra email, độ dài mật khẩu và hai trường xác nhận.', steps: ['Đọc thông báo hiển thị.', 'Sửa trường được nhắc đến.', 'Gửi lại biểu mẫu.'] }
      ]
    },
    'post.html': {
      title: 'Đăng bài và thảo luận',
      intro: 'Soạn bài lịch sử ẩn danh, xem bài cộng đồng, bình luận và trò chuyện.',
      features: [
        { title: 'Soạn và định dạng bài', description: 'Chọn thời kỳ, chủ đề và dùng thanh công cụ để làm rõ nội dung.', steps: ['Nhập tiêu đề và chọn triều đại/chủ đề.', 'Soạn nội dung; chọn đoạn chữ rồi dùng đậm, nghiêng, phông hoặc cỡ chữ.', 'Chèn trích dẫn hoặc ảnh tư liệu nếu cần.'] },
        { title: 'Lưu nháp, xem trước và đăng', description: 'Bản nháp được lưu trên thiết bị; bài đăng hiển thị công khai dưới tên Ẩn danh.', steps: ['Nhấn Lưu nháp để lưu tạm.', 'Nhấn Xem trước để kiểm tra bài.', 'Nhấn Đăng bài ngay để đưa bài vào danh sách.'] },
        { title: 'Tìm, lọc và tương tác', description: 'Dùng bộ lọc để duyệt bài, tìm kiếm theo từ khóa, thích, bình luận hoặc lưu bài.', steps: ['Chọn Tất cả, Mới nhất, Nổi bật hoặc Đã thẩm định.', 'Nhập từ khóa vào ô tìm kiếm.', 'Dùng các biểu tượng cuối bài để thích, mở bình luận hoặc lưu.'] },
        { title: 'Chat cộng đồng', description: 'Mở nút Chat cộng đồng ở góc dưới để trao đổi ẩn danh.', steps: ['Nhấn Chat cộng đồng.', 'Nhập nội dung; nhấn Enter để gửi hoặc Shift+Enter để xuống dòng.', 'Thu gọn bằng nút mũi tên hoặc nhấn Escape.'] }
      ]
    }
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  function getOverrides() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function getCurrentPage() {
    const filename = decodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
    return filename || 'index.html';
  }

  function getGuide(page) {
    const defaults = pages[page] || pages['index.html'];
    const override = getOverrides()[page];
    return override ? { ...defaults, ...override, features: Array.isArray(override.features) ? override.features : defaults.features } : defaults;
  }

  function renderGuideContent(guide) {
    return `<div class="mb-5 rounded-lg bg-[#FBF9F5] p-4 text-sm leading-6 text-stone-700">${escapeHtml(guide.intro)}</div>${guide.features.map((feature, index) => `<section class="border-b border-[#EEE9E0] py-4 last:border-0"><h3 class="flex items-start gap-2 font-semibold text-[#6B0210]"><span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F6ECE7] text-[11px]">${index + 1}</span>${escapeHtml(feature.title)}</h3><p class="ml-7 mt-1 text-sm leading-6 text-stone-600">${escapeHtml(feature.description)}</p><ol class="ml-7 mt-2 list-decimal space-y-1 pl-4 text-sm leading-6 text-stone-700">${feature.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section>`).join('')}`;
  }

  function initPublicGuide() {
    if (getCurrentPage() === 'admin.html') return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'openPageGuide';
    button.className = 'fixed bottom-5 left-5 z-[65] flex h-12 w-12 items-center justify-center rounded-full border border-[#E8E2D5] bg-white text-[#6B0210] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#F6ECE7] focus:outline-none focus:ring-2 focus:ring-[#9E782F] focus:ring-offset-2';
    button.setAttribute('aria-label', 'Mở sách hướng dẫn trang này');
    button.title = 'Sách hướng dẫn';
    button.innerHTML = '<span class="material-symbols-outlined">menu_book</span>';
    document.body.appendChild(button);

    const dialog = document.createElement('dialog');
    dialog.id = 'pageGuideDialog';
    dialog.className = 'w-[min(720px,calc(100vw-2rem))] max-h-[85vh] overflow-hidden rounded-xl border border-[#E8E2D5] p-0 shadow-2xl backdrop:bg-black/50';
    document.body.appendChild(dialog);
    const showGuide = () => {
      const guide = getGuide(getCurrentPage());
      dialog.innerHTML = `<div class="flex items-start justify-between gap-4 border-b border-[#E8E2D5] px-5 py-4"><div><p class="text-[11px] font-bold uppercase tracking-wide text-[#9E782F]">Sách hướng dẫn</p><h2 class="mt-1 font-heritage text-xl font-bold text-[#6B0210]">${escapeHtml(guide.title)}</h2></div><button aria-label="Đóng hướng dẫn" class="rounded p-1 text-stone-600 transition hover:bg-stone-100" type="button"><span class="material-symbols-outlined">close</span></button></div><div class="max-h-[72vh] overflow-y-auto px-5 py-2">${renderGuideContent(guide)}</div>`;
      dialog.querySelector('button').addEventListener('click', () => dialog.close());
      dialog.showModal();
    };
    button.addEventListener('click', showGuide);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  }

  function readEditorForm(form) {
    return {
      title: form.querySelector('[name="guideTitle"]').value.trim(),
      intro: form.querySelector('[name="guideIntro"]').value.trim(),
      features: [...form.querySelectorAll('[data-guide-feature]')].map((row) => ({
        title: row.querySelector('[name="featureTitle"]').value.trim(),
        description: row.querySelector('[name="featureDescription"]').value.trim(),
        steps: row.querySelector('[name="featureSteps"]').value.split('\n').map((step) => step.trim()).filter(Boolean)
      })).filter((feature) => feature.title || feature.description || feature.steps.length)
    };
  }

  function initAdminGuideEditor() {
    const container = document.getElementById('guideAdminEditor');
    if (!container) return;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser?.role !== 'admin') {
      container.innerHTML = '<p class="rounded border border-error/30 bg-error-container/30 p-4 text-sm text-error">Chỉ tài khoản admin mới được chỉnh sửa sách hướng dẫn.</p>';
      return;
    }
    let currentPage = Object.keys(pages)[0];

    const render = (draftGuide = getGuide(currentPage)) => {
      const guide = draftGuide;
      container.innerHTML = `<div class="mb-5 grid gap-space-md md:grid-cols-[minmax(220px,0.7fr)_1.3fr] md:items-end"><div><label class="mb-1 block text-xs font-semibold text-on-surface-variant" for="guidePageSelect">Trang cần chỉnh sửa</label><select class="w-full rounded border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm" id="guidePageSelect">${Object.entries(pages).map(([key, value]) => `<option value="${escapeHtml(key)}" ${key === currentPage ? 'selected' : ''}>${escapeHtml(value.title)} · ${escapeHtml(key)}</option>`).join('')}</select></div><p class="text-xs leading-5 text-on-surface-variant">Các thay đổi được lưu trên trình duyệt này và sẽ hiện trên trang tương ứng khi mở bằng cùng trình duyệt.</p></div><form id="guideEditorForm" class="space-y-5"><div class="grid gap-space-md md:grid-cols-2"><label class="text-xs font-semibold text-on-surface-variant">Tên hướng dẫn<input class="mt-1 w-full rounded border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm font-normal text-on-surface" maxlength="100" name="guideTitle" required value="${escapeHtml(guide.title)}"></label><label class="text-xs font-semibold text-on-surface-variant">Giới thiệu trang<textarea class="mt-1 w-full rounded border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm font-normal leading-5 text-on-surface" maxlength="600" name="guideIntro" required rows="3">${escapeHtml(guide.intro)}</textarea></label></div><div><div class="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 class="font-headline-sm font-bold text-on-surface">Chức năng và các bước</h3><p class="mt-1 text-xs text-on-surface-variant">Mỗi dòng trong ô Các bước sẽ thành một bước riêng trong hướng dẫn.</p></div><button class="inline-flex items-center gap-1 rounded border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-semibold hover:bg-surface-container" id="addGuideFeature" type="button"><span class="material-symbols-outlined text-base">add</span>Thêm chức năng</button></div><div class="space-y-3" id="guideFeatureList">${guide.features.map((feature, index) => `<article class="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-4" data-guide-feature><div class="mb-3 flex items-center justify-between gap-3"><h4 class="text-sm font-bold text-primary">Chức năng ${index + 1}</h4><button aria-label="Xóa chức năng" class="rounded p-1 text-error hover:bg-error-container/40" data-remove-guide-feature type="button"><span class="material-symbols-outlined">delete</span></button></div><div class="grid gap-3 md:grid-cols-2"><label class="text-xs font-semibold text-on-surface-variant">Tên chức năng<input class="mt-1 w-full rounded border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm font-normal text-on-surface" maxlength="100" name="featureTitle" required value="${escapeHtml(feature.title)}"></label><label class="text-xs font-semibold text-on-surface-variant">Mô tả<textarea class="mt-1 w-full rounded border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm font-normal leading-5 text-on-surface" maxlength="400" name="featureDescription" required rows="2">${escapeHtml(feature.description)}</textarea></label><label class="text-xs font-semibold text-on-surface-variant md:col-span-2">Các bước, mỗi bước một dòng<textarea class="mt-1 w-full rounded border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm font-normal leading-5 text-on-surface" maxlength="1200" name="featureSteps" required rows="4">${escapeHtml(feature.steps.join('\n'))}</textarea></label></div></article>`).join('')}</div></div><div class="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container pt-4"><p class="hidden text-sm font-semibold text-tertiary" id="guideSaveStatus" role="status"></p><div class="ml-auto flex flex-wrap gap-2"><button class="rounded border border-outline-variant/40 px-3 py-2 text-xs font-semibold hover:bg-surface-container-low" id="resetGuidePage" type="button">Khôi phục mặc định</button><button class="inline-flex items-center gap-1 rounded bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary-container" type="submit"><span class="material-symbols-outlined text-base">save</span>Lưu hướng dẫn</button></div></div></form>`;

      container.querySelector('#guidePageSelect').addEventListener('change', (event) => {
        currentPage = event.target.value;
        render(getGuide(currentPage));
      });
      container.querySelector('#addGuideFeature').addEventListener('click', () => {
        const updated = readEditorForm(container.querySelector('form'));
        updated.features.push({ title: 'Chức năng mới', description: 'Mô tả chức năng mới.', steps: ['Bước 1'] });
        render(updated);
        container.querySelector('[data-guide-feature]:last-child [name="featureTitle"]')?.focus();
        window.showAppToast?.('Đã thêm chức năng vào bản hướng dẫn. Nhớ lưu để áp dụng.', 'info');
      });
      container.querySelectorAll('[data-remove-guide-feature]').forEach((button) => button.addEventListener('click', () => {
        const updated = readEditorForm(container.querySelector('form'));
        const featureIndex = Number(button.closest('[data-guide-feature]').dataset.index);
        updated.features.splice(featureIndex, 1);
        render(updated);
        window.showAppToast?.('Đã xóa chức năng khỏi bản nháp hướng dẫn. Nhớ lưu để áp dụng.', 'info');
      }));
      container.querySelectorAll('[data-guide-feature]').forEach((row, index) => { row.dataset.index = String(index); });
      container.querySelector('#resetGuidePage').addEventListener('click', () => {
        if (!confirm(`Khôi phục hướng dẫn mặc định cho trang ${pages[currentPage].title}?`)) return;
        const overrides = getOverrides();
        delete overrides[currentPage];
        localStorage.setItem(storageKey, JSON.stringify(overrides));
        render(pages[currentPage]);
        window.showAppToast?.('Đã khôi phục hướng dẫn mặc định.');
      });
      container.querySelector('#guideEditorForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const guide = readEditorForm(event.currentTarget);
        if (!guide.features.length || guide.features.some((feature) => !feature.title || !feature.description || !feature.steps.length)) {
          window.showAppToast?.('Mỗi chức năng cần có tên, mô tả và ít nhất một bước.', 'error');
          return;
        }
        const overrides = getOverrides();
        overrides[currentPage] = guide;
        localStorage.setItem(storageKey, JSON.stringify(overrides));
        const status = container.querySelector('#guideSaveStatus');
        status.textContent = 'Đã lưu hướng dẫn cho trang này.';
        status.classList.remove('hidden');
        window.showAppToast?.('Đã lưu sách hướng dẫn.');
      });
    };

    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPublicGuide();
    initAdminGuideEditor();
  });
})();