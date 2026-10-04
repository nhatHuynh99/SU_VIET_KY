(function () {
  const storageKey = 'anonymousPosts';
  const chatStorageKey = 'anonymousCommunityChat';
  let activeFeedFilter = 'all';
  let activeSearchQuery = '';
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const allowedTags = new Set(['DIV', 'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'SPAN', 'IMG']);
  let savedEditorRange = null;

  function safeImageUrl(value) {
    return /^https:\/\//i.test(value) || /^data:image\/(png|jpeg|webp|gif);base64,/i.test(value);
  }

  function sanitizeRichContent(value = '') {
    const parsed = new DOMParser().parseFromString(String(value), 'text/html');
    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || '');
      if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();
      const tag = node.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'SVG') return document.createDocumentFragment();
      if (!allowedTags.has(tag) && tag !== 'FONT') {
        const fragment = document.createDocumentFragment();
        [...node.childNodes].forEach((child) => fragment.append(cleanNode(child)));
        return fragment;
      }
      const clean = document.createElement(tag === 'FONT' ? 'span' : tag.toLowerCase());
      if (tag === 'IMG') {
        const source = node.getAttribute('src') || '';
        if (!safeImageUrl(source)) return document.createDocumentFragment();
        clean.setAttribute('src', source);
        clean.setAttribute('alt', (node.getAttribute('alt') || 'Ảnh tư liệu').slice(0, 180));
        clean.setAttribute('loading', 'lazy');
      } else {
        if (tag === 'SPAN' || tag === 'FONT') {
          const script = node.getAttribute('data-script');
          const font = node.getAttribute('data-font') || (/(Noto Serif|serif)/i.test(node.getAttribute('face') || node.style.fontFamily) ? 'serif' : /(Be Vietnam|sans-serif)/i.test(node.getAttribute('face') || node.style.fontFamily) ? 'sans' : '');
          const size = node.getAttribute('data-size') || (parseFloat(node.style.fontSize || node.getAttribute('size') || '0') >= 18 ? 'large' : parseFloat(node.style.fontSize || node.getAttribute('size') || '0') > 0 && parseFloat(node.style.fontSize || node.getAttribute('size') || '0') <= 13 ? 'small' : '');
          if (script === 'nom') clean.setAttribute('data-script', 'nom');
          if (['serif', 'sans'].includes(font)) clean.setAttribute('data-font', font);
          if (['small', 'normal', 'large'].includes(size)) clean.setAttribute('data-size', size);
        }
        [...node.childNodes].forEach((child) => clean.append(cleanNode(child)));
      }
      return clean;
    };

    const wrapper = document.createElement('div');
    [...parsed.body.childNodes].forEach((node) => wrapper.append(cleanNode(node)));
    return wrapper.innerHTML.replace(/\u200b/g, '');
  }

  function contentForPost(value = '', format = 'text') {
    return format === 'html' ? sanitizeRichContent(value) : escapeHtml(value).replace(/\n/g, '<br>');
  }

  function postImage(post) {
    if (safeImageUrl(post.image || '')) return post.image;
    if (post.contentFormat !== 'html') return '';
    const parsed = new DOMParser().parseFromString(sanitizeRichContent(post.content), 'text/html');
    return parsed.querySelector('img')?.getAttribute('src') || '';
  }

  function postBody(post) {
    const content = contentForPost(post.content, post.contentFormat);
    if (post.contentFormat !== 'html') return content;
    const parsed = new DOMParser().parseFromString(content, 'text/html');
    parsed.querySelector('img')?.remove();
    return parsed.body.innerHTML;
  }

  function getPosts() {
    try {
      const posts = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(posts) ? posts : [];
    } catch (error) {
      return [];
    }
  }

  function savePosts(posts) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(posts));
    } catch (error) {
      window.showAppToast?.('Không đủ dung lượng để lưu bài viết. Hãy thử ảnh nhỏ hơn hoặc xóa bài cũ.', 'error');
      return false;
    }
    window.dispatchEvent(new CustomEvent('anonymous-posts-updated'));
    return true;
  }

  function formatDate(value) {
    return new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function getChatMessages() {
    try {
      const messages = JSON.parse(localStorage.getItem(chatStorageKey) || '[]');
      return Array.isArray(messages) ? messages : [];
    } catch (error) {
      return [];
    }
  }

  function renderChatMessages() {
    const list = document.getElementById('communityChatMessages');
    if (!list) return;
    const messages = getChatMessages();
    list.innerHTML = messages.length
      ? messages.map((message) => `<article class="max-w-[90%] self-end rounded-xl rounded-br-sm bg-[#6B0210] px-3 py-2 text-white shadow-sm"><div class="mb-1 flex items-center justify-between gap-4"><span class="text-[10px] font-semibold text-white/80">Ẩn danh</span><time class="text-[10px] text-white/65">${escapeHtml(new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }))}</time></div><p class="whitespace-pre-wrap break-words text-sm leading-5">${escapeHtml(message.text)}</p></article>`).join('')
      : '<div class="m-auto max-w-[230px] py-8 text-center"><span class="material-symbols-outlined mb-2 block text-3xl text-[#9E782F]">forum</span><p class="text-sm font-semibold text-stone-700">Bắt đầu cuộc trò chuyện</p><p class="mt-1 text-xs leading-5 text-stone-500">Tin nhắn hiển thị ẩn danh trên trình duyệt này.</p></div>';
    list.scrollTop = list.scrollHeight;
  }

  function bindCommunityChat() {
    const panel = document.getElementById('communityChatPanel');
    const toggle = document.getElementById('toggleCommunityChat');
    const input = document.getElementById('communityChatInput');
    const form = document.getElementById('communityChatForm');
    if (!panel || !toggle || !input || !form) return;

    const setOpen = (open) => {
      panel.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Đóng chat cộng đồng' : 'Mở chat cộng đồng');
      if (open) {
        renderChatMessages();
        input.focus();
      }
    };

    toggle.addEventListener('click', () => setOpen(panel.classList.contains('hidden')));
    document.getElementById('closeCommunityChat')?.addEventListener('click', () => setOpen(false));
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const messages = getChatMessages();
      messages.push({ id: `${Date.now()}-${Math.random()}`, text: text.slice(0, 500), createdAt: new Date().toISOString() });
      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(messages.slice(-100)));
      } catch (error) {
        window.showAppToast?.('Không đủ dung lượng để lưu tin nhắn chat.', 'error');
        return;
      }
      input.value = '';
      input.style.height = 'auto';
      renderChatMessages();
      window.showAppToast?.('Đã gửi tin nhắn ẩn danh.');
    });
    renderChatMessages();
  }

  function postMarkup(post, admin = false) {
    const image = postImage(post);
    const likes = Number(post.likes) || 0;
    const cover = image
      ? `<img alt="${escapeHtml(post.title)}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" src="${escapeHtml(image)}">`
      : `<div class="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,#f6ece7,#f4f1ea_55%,#e5eee8)] text-[#8B1E24]"><span class="material-symbols-outlined text-4xl">history_edu</span><span class="px-3 text-center text-[11px] font-semibold">Tư liệu lịch sử</span></div>`;
    return `<article class="anonymous-post group flex flex-col gap-4 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9E782F]/50 hover:shadow-lg sm:flex-row sm:p-5" data-post-card="${escapeHtml(post.id)}">
      <div class="relative h-44 w-full shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 sm:h-[198px] sm:w-[220px]">${cover}<span class="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded bg-[#6B0210]/90 px-2 py-1 text-[11px] font-semibold text-white shadow">${escapeHtml(new Date(post.createdAt).toLocaleDateString('vi-VN'))}</span></div>
      <div class="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div class="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span class="rounded-md border border-[#E9D8A8] bg-[#FFF5D8] px-2.5 py-1 font-semibold text-[#775A00]">${escapeHtml(post.era || 'Tư liệu lịch sử')}</span>
            ${post.topic ? `<span class="rounded-md bg-[#F6ECE7] px-2.5 py-1 text-[#6B0210]">${escapeHtml(post.topic)}</span>` : ''}
            <span class="inline-flex items-center gap-1 font-semibold text-[#1C4A3E]"><span class="material-symbols-outlined text-[15px]">verified</span>Chia sẻ cộng đồng</span>
            <time class="text-stone-500">${escapeHtml(formatDate(post.createdAt))}</time>
            ${admin ? `<button aria-label="Xóa bài viết" class="ml-auto rounded-lg p-1.5 text-red-700 transition hover:bg-red-50" data-delete-post="${escapeHtml(post.id)}" title="Xóa bài viết" type="button"><span class="material-symbols-outlined text-[19px]">delete</span></button>` : ''}
          </div>
          <h3 class="font-heritage text-lg font-bold leading-snug text-[#6B0210] sm:text-[20px]">${escapeHtml(post.title)}</h3>
          <div class="post-content post-card-content mt-2 text-sm leading-6 text-[#514840]">${postBody(post)}</div>
          ${post.source ? `<p class="mt-2 line-clamp-1 text-xs italic text-stone-500">Nguồn: ${escapeHtml(post.source)}</p>` : ''}
        </div>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E2D5] pt-3 text-xs text-stone-500">
          <div class="flex items-center gap-2"><span class="flex h-7 w-7 items-center justify-center rounded-full bg-[#6B0210] text-white"><span class="material-symbols-outlined text-[16px]">visibility_off</span></span><span class="font-semibold text-stone-800">Ẩn danh</span></div>
          <div class="flex items-center gap-3 sm:gap-4">
            <button aria-label="Thích bài viết" class="inline-flex items-center gap-1 transition hover:text-[#6B0210]" data-like-post="${escapeHtml(post.id)}" type="button"><span class="material-symbols-outlined text-[18px] text-[#6B0210]">favorite</span><span class="font-semibold text-stone-700" data-like-count>${likes.toLocaleString('vi-VN')}</span></button>
            <button aria-label="Bình luận" class="inline-flex items-center gap-1 transition hover:text-[#6B0210]" data-comment-post="${escapeHtml(post.id)}" type="button"><span class="material-symbols-outlined text-[18px]">chat_bubble_outline</span><span>${(post.comments || []).length.toLocaleString('vi-VN')}</span></button>
            <button aria-label="Lưu bài viết" class="inline-flex items-center text-[#9E782F] transition hover:text-[#6B0210]" data-bookmark-post="${escapeHtml(post.id)}" title="Lưu bài viết" type="button"><span class="material-symbols-outlined text-[18px]">bookmark_border</span></button>
          </div>
        </div>
      </div>
    </article>`;
  }

  function renderPostFeed(container, limit) {
    if (!container) return;
    let posts = getPosts().filter((post) => {
      const matchesFilter = activeFeedFilter !== 'verified' || post.verified === true;
      const searchableText = [post.title, post.content, post.era, post.topic, post.source].join(' ').replace(/<[^>]*>/g, ' ').toLocaleLowerCase('vi');
      return matchesFilter && (!activeSearchQuery || searchableText.includes(activeSearchQuery));
    });
    posts.sort(activeFeedFilter === 'featured'
      ? (first, second) => (Number(second.likes) || 0) - (Number(first.likes) || 0)
      : (first, second) => new Date(second.createdAt) - new Date(first.createdAt));
    const visiblePosts = Number.isInteger(limit) ? posts.slice(0, limit) : posts;
    container.innerHTML = visiblePosts.length
      ? visiblePosts.map((post) => postMarkup(post)).join('')
      : `<div class="rounded-xl border border-dashed border-[#D9CFBF] bg-white/70 p-8 text-center text-sm text-stone-500"><span class="material-symbols-outlined mb-2 block text-3xl text-[#9E782F]">${activeSearchQuery || activeFeedFilter === 'verified' ? 'search_off' : 'history_edu'}</span>${activeSearchQuery ? 'Không tìm thấy bài viết phù hợp.' : activeFeedFilter === 'verified' ? 'Chưa có bài cộng đồng được thẩm định.' : 'Chưa có bài viết cộng đồng. Hãy mở đầu dòng chuyện lịch sử.'}</div>`;
    bindPostActions(container);
    updatePostCount();
  }

  function staticCards() {
    return [...document.querySelectorAll('#staticPostList [data-static-post]')];
  }

  function updatePostCount() {
    const count = document.getElementById('postCount');
    if (!count) return;
    const visibleStatic = staticCards().filter((card) => !card.hidden).length;
    const visibleDynamic = getPosts().filter((post) => {
      const matchesFilter = activeFeedFilter !== 'verified' || post.verified === true;
      const text = [post.title, post.content, post.era, post.topic, post.source].join(' ').replace(/<[^>]*>/g, ' ').toLocaleLowerCase('vi');
      return matchesFilter && (!activeSearchQuery || text.includes(activeSearchQuery));
    }).length;
    count.textContent = `${(visibleStatic + visibleDynamic).toLocaleString('vi-VN')} bài viết`;
  }

  function updatePostPageControls() {
    const search = document.getElementById('postSearchInput');
    if (search) activeSearchQuery = search.value.trim().toLocaleLowerCase('vi');
    staticCards().forEach((card) => {
      const text = card.innerText.toLocaleLowerCase('vi');
      const matchesQuery = !activeSearchQuery || text.includes(activeSearchQuery);
      const matchesFilter = activeFeedFilter === 'all' || activeFeedFilter === 'latest' || activeFeedFilter === 'featured'
        || (activeFeedFilter === 'verified' && card.dataset.verified === 'true');
      card.hidden = !(matchesQuery && matchesFilter);
    });
    const staticList = document.getElementById('staticPostList');
    if (staticList && activeFeedFilter === 'featured') {
      staticCards().sort((first, second) => Number(second.dataset.baseLikes) - Number(first.dataset.baseLikes)).forEach((card) => staticList.append(card));
    }
    renderPostFeed(document.getElementById('communityPostList'));
    updatePostCount();
  }

  function formatLikeCount(value) {
    if (value >= 1000) return `${Number((value / 1000).toFixed(1))}k`;
    return value.toLocaleString('vi-VN');
  }

  function getPostComments(postId, isStatic) {
    if (isStatic) {
      const comments = JSON.parse(localStorage.getItem('anonymousPostComments') || '{}');
      return comments[postId] || [];
    }
    return getPosts().find((post) => post.id === postId)?.comments || [];
  }

  function openComments(postId, isStatic = false) {
    const post = isStatic ? null : getPosts().find((item) => item.id === postId);
    const staticId = postId.replace('legacy-', '');
    const staticCard = isStatic ? staticCards().find((card) => card.dataset.staticPost === staticId) : null;
    const title = post?.title || staticCard?.querySelector('h3')?.textContent.trim() || 'Bài viết';
    let dialog = document.getElementById('postCommentsDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'postCommentsDialog';
      dialog.className = 'w-[min(680px,calc(100vw-2rem))] max-h-[85vh] overflow-hidden rounded-xl border border-[#E8E2D5] p-0 shadow-2xl backdrop:bg-black/50';
      document.body.appendChild(dialog);
    }

    const renderDialog = () => {
      const comments = getPostComments(postId, isStatic);
      const commentList = comments.length
        ? [...comments].reverse().map((comment) => `<article class="rounded-lg border border-[#EEE9E0] bg-white p-3"><div class="mb-1.5 flex items-center justify-between gap-3"><span class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B0210]"><span class="material-symbols-outlined text-[16px]">visibility_off</span>Ẩn danh</span><time class="text-[11px] text-stone-500">${escapeHtml(formatDate(comment.createdAt || new Date().toISOString()))}</time></div><p class="whitespace-pre-wrap break-words text-sm leading-6 text-[#514840]">${escapeHtml(comment.text || '')}</p></article>`).join('')
        : `<div class="rounded-lg border border-dashed border-[#D9CFBF] bg-white/70 p-6 text-center"><span class="material-symbols-outlined mb-2 block text-3xl text-[#9E782F]">forum</span><p class="text-sm font-semibold text-stone-700">Chưa có nội dung bình luận được lưu trên thiết bị này.</p>${isStatic ? '<p class="mt-1 text-xs text-stone-500">Số lượt trao đổi trên bài mẫu chỉ là dữ liệu giới thiệu.</p>' : '<p class="mt-1 text-xs text-stone-500">Hãy mở đầu cuộc trao đổi.</p>'}</div>`;
      dialog.innerHTML = `<div class="flex items-start justify-between gap-4 border-b border-[#E8E2D5] px-5 py-4"><div class="min-w-0"><p class="text-[11px] font-bold uppercase tracking-wide text-[#9E782F]">Thảo luận · ${comments.length.toLocaleString('vi-VN')}</p><h2 class="mt-1 truncate font-heritage text-lg font-bold text-[#6B0210]">${escapeHtml(title)}</h2></div><button aria-label="Đóng bình luận" class="rounded p-1 text-stone-600 transition hover:bg-stone-100" type="button"><span class="material-symbols-outlined">close</span></button></div><div class="max-h-[55vh] space-y-2 overflow-y-auto bg-[#FBF9F5] p-4" id="postCommentList">${commentList}</div><form class="border-t border-[#E8E2D5] bg-white p-4"><label class="mb-1.5 block text-xs font-semibold text-stone-700" for="newPostComment">Viết bình luận ẩn danh</label><textarea class="w-full resize-y rounded-lg border border-[#E8E2D5] bg-[#FBF9F5] px-3 py-2.5 text-sm leading-6 focus:border-[#6B0210] focus:ring-[#6B0210]/20" id="newPostComment" maxlength="500" placeholder="Chia sẻ ý kiến của bạn..." required rows="3"></textarea><div class="mt-2 flex items-center justify-between gap-3"><span class="text-[11px] text-stone-500">Tối đa 500 ký tự</span><button class="inline-flex items-center gap-1.5 rounded-lg bg-[#6B0210] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#4a010a]" type="submit"><span class="material-symbols-outlined text-base">send</span>Gửi bình luận</button></div></form>`;

      dialog.querySelector('[aria-label="Đóng bình luận"]').addEventListener('click', () => dialog.close());
      dialog.querySelector('form').addEventListener('submit', (event) => {
        event.preventDefault();
        const input = dialog.querySelector('#newPostComment');
        const text = input.value.trim();
        if (!text) return;
        const comment = { text: text.slice(0, 500), createdAt: new Date().toISOString() };
        if (isStatic) {
          const commentsByPost = JSON.parse(localStorage.getItem('anonymousPostComments') || '{}');
          commentsByPost[postId] = [...(commentsByPost[postId] || []), comment];
          localStorage.setItem('anonymousPostComments', JSON.stringify(commentsByPost));
          const commentButton = staticCard?.querySelectorAll('.border-t button')[1];
          const baseCount = Number(staticCard?.dataset.baseComments) || 0;
          if (commentButton) commentButton.querySelector('span:last-child').textContent = String(baseCount + commentsByPost[postId].length);
        } else {
          const posts = getPosts();
          const target = posts.find((item) => item.id === postId);
          if (!target) return;
          target.comments = [...(target.comments || []), comment];
          if (!savePosts(posts)) return;
        }
        renderDialog();
        dialog.querySelector('#newPostComment')?.focus();
        window.showAppToast?.('Đã gửi bình luận ẩn danh.');
      });
    };

    renderDialog();
    if (!dialog.open) dialog.showModal();
    dialog.onclick = (event) => { if (event.target === dialog) dialog.close(); };
  }

  function bindStaticPostActions() {
    staticCards().forEach((card) => {
      const id = `legacy-${card.dataset.staticPost}`;
      const [likeButton, commentButton, bookmarkButton] = card.querySelectorAll('footer button, .border-t button');
      if (!likeButton || likeButton.dataset.bound) return;
      likeButton.dataset.bound = 'true';
      commentButton.dataset.bound = 'true';
      bookmarkButton.dataset.bound = 'true';
      const liked = new Set(JSON.parse(localStorage.getItem('anonymousPostLikes') || '[]'));
      const bookmarks = new Set(JSON.parse(localStorage.getItem('anonymousPostBookmarks') || '[]'));
      const count = likeButton.querySelector('span:last-child');
      const baseLikes = Number(card.dataset.baseLikes) || 0;
      count.textContent = formatLikeCount(baseLikes + (liked.has(id) ? 1 : 0));
      const comments = JSON.parse(localStorage.getItem('anonymousPostComments') || '{}');
      const baseComments = Number(card.dataset.baseComments) || 0;
      commentButton.querySelector('span:last-child').textContent = String(baseComments + (comments[id] || []).length);
      if (bookmarks.has(id)) bookmarkButton.querySelector('.material-symbols-outlined').textContent = 'bookmark_added';
      likeButton.addEventListener('click', () => {
        const current = new Set(JSON.parse(localStorage.getItem('anonymousPostLikes') || '[]'));
        if (current.has(id)) current.delete(id);
        else current.add(id);
        localStorage.setItem('anonymousPostLikes', JSON.stringify([...current]));
        count.textContent = formatLikeCount(baseLikes + (current.has(id) ? 1 : 0));
        likeButton.classList.toggle('text-[#6B0210]', current.has(id));
        window.showAppToast?.(current.has(id) ? 'Đã thích bài viết.' : 'Đã bỏ thích bài viết.', 'info');
      });
      commentButton.addEventListener('click', () => {
        openComments(id, true);
      });
      bookmarkButton.addEventListener('click', () => {
        const current = new Set(JSON.parse(localStorage.getItem('anonymousPostBookmarks') || '[]'));
        if (current.has(id)) current.delete(id);
        else current.add(id);
        localStorage.setItem('anonymousPostBookmarks', JSON.stringify([...current]));
        bookmarkButton.querySelector('.material-symbols-outlined').textContent = current.has(id) ? 'bookmark_added' : 'bookmark_border';
        window.showAppToast?.(current.has(id) ? 'Đã lưu bài viết.' : 'Đã bỏ lưu bài viết.', 'info');
      });
    });
  }

  function bindPostActions(container) {
    container.querySelectorAll('[data-like-post]').forEach((button) => button.addEventListener('click', () => {
      const postId = button.dataset.likePost;
      const posts = getPosts();
      const post = posts.find((item) => item.id === postId);
      if (!post) return;
      const liked = new Set(JSON.parse(localStorage.getItem('anonymousPostLikes') || '[]'));
      const nextLiked = !liked.has(postId);
      if (nextLiked) liked.add(postId);
      else liked.delete(postId);
      localStorage.setItem('anonymousPostLikes', JSON.stringify([...liked]));
      post.likes = Math.max(0, (Number(post.likes) || 0) + (nextLiked ? 1 : -1));
      if (savePosts(posts)) window.showAppToast?.(nextLiked ? 'Đã thích bài viết.' : 'Đã bỏ thích bài viết.', 'info');
    }));
    container.querySelectorAll('[data-comment-post]').forEach((button) => button.addEventListener('click', () => {
      openComments(button.dataset.commentPost);
    }));
    container.querySelectorAll('[data-bookmark-post]').forEach((button) => {
      const bookmarks = new Set(JSON.parse(localStorage.getItem('anonymousPostBookmarks') || '[]'));
      const postId = button.dataset.bookmarkPost;
      if (bookmarks.has(postId)) button.querySelector('.material-symbols-outlined').textContent = 'bookmark_added';
      button.addEventListener('click', () => {
        const saved = new Set(JSON.parse(localStorage.getItem('anonymousPostBookmarks') || '[]'));
        if (saved.has(postId)) saved.delete(postId);
        else saved.add(postId);
        localStorage.setItem('anonymousPostBookmarks', JSON.stringify([...saved]));
        button.querySelector('.material-symbols-outlined').textContent = saved.has(postId) ? 'bookmark_added' : 'bookmark_border';
        window.showAppToast?.(saved.has(postId) ? 'Đã lưu bài viết.' : 'Đã bỏ lưu bài viết.', 'info');
      });
    });
  }

  function renderAdminPosts() {
    const container = document.getElementById('adminPostList');
    const count = document.getElementById('adminPostCount');
    if (!container) return;
    const posts = getPosts().sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
    if (count) count.textContent = posts.length.toLocaleString('vi-VN');
    container.innerHTML = posts.length
      ? posts.map((post) => postMarkup(post, true)).join('')
      : '<p class="rounded-lg border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">Chưa có bài viết nào được đăng.</p>';
    container.querySelectorAll('[data-delete-post]').forEach((button) => button.addEventListener('click', () => deleteAnonymousPost(button.dataset.deletePost)));
  }

  function deleteAnonymousPost(id) {
    if (!confirm('Xóa bài viết này khỏi trang chủ và danh sách bài viết?')) return;
    if (!savePosts(getPosts().filter((post) => post.id !== id))) return;
    renderAdminPosts();
    window.showAppToast?.('Đã xóa bài viết.');
  }

  function submitAnonymousPost(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = form.querySelector('[name="title"]').value.trim();
    const editor = form.querySelector('#postEditor');
    const contentField = form.querySelector('[name="content"]');
    const rawContent = editor ? editor.innerHTML : contentField.value;
    const content = editor ? sanitizeRichContent(rawContent) : rawContent.trim();
    const textContent = editor ? editor.innerText.trim() : content.trim();
    if (!title || !textContent) {
      if (editor && !textContent) {
        editor.focus();
        window.showAppToast?.('Vui lòng nhập nội dung bài viết.', 'error');
      }
      return;
    }
    if (textContent.length > 12000) {
      window.showAppToast?.('Nội dung bài viết tối đa 12.000 ký tự.', 'error');
      return;
    }

    const era = form.querySelector('[data-selected-era]')?.textContent.trim() || 'Tư liệu lịch sử';
    const topic = form.querySelector('[data-selected-topic]')?.dataset.topicLabel || '';
    const source = form.querySelector('[name="source"]').value.trim();
    const posts = getPosts();
    posts.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title, content, contentFormat: editor ? 'html' : 'text', era, topic, source, createdAt: new Date().toISOString() });
    if (!savePosts(posts)) return;
    localStorage.removeItem('anonymousPostDraft');
    form.reset();
    if (editor) editor.innerHTML = '';
    if (contentField) contentField.value = '';
    form.querySelector('[name="title"]').focus();
    const status = document.getElementById('postSubmitStatus');
    if (status) {
      status.textContent = 'Bài viết đã được đăng ẩn danh.';
      status.classList.remove('hidden');
      status.classList.add('sr-only');
    }
    window.showAppToast?.('Bài viết đã được đăng ẩn danh.');
    renderPostFeed(document.getElementById('communityPostList'));
    renderPostFeed(document.getElementById('homePostList'), 3);
  }

  function currentDraft(form) {
    const editor = form.querySelector('#postEditor');
    return {
      title: form.querySelector('[name="title"]')?.value || '',
      content: editor ? sanitizeRichContent(editor.innerHTML) : form.querySelector('[name="content"]')?.value || '',
      contentFormat: editor ? 'html' : 'text',
      source: form.querySelector('[name="source"]')?.value || '',
      era: form.querySelector('[data-selected-era]')?.textContent.trim() || '',
      topic: form.querySelector('[data-selected-topic]')?.dataset.topicLabel || ''
    };
  }

  function saveDraft(form) {
    try {
      localStorage.setItem('anonymousPostDraft', JSON.stringify(currentDraft(form)));
      showEditorStatus('Bản nháp đã được lưu trên thiết bị này.');
    } catch (error) {
      window.showAppToast?.('Không đủ dung lượng để lưu bản nháp. Thử bỏ ảnh hoặc dùng ảnh nhỏ hơn.', 'error');
    }
  }

  function restoreDraft(form) {
    try {
      const draft = JSON.parse(localStorage.getItem('anonymousPostDraft') || 'null');
      if (!draft) return;
      form.querySelector('[name="title"]').value = draft.title || '';
      form.querySelector('[name="source"]').value = draft.source || '';
      const editor = form.querySelector('#postEditor');
      const content = form.querySelector('[name="content"]');
      if (editor) editor.innerHTML = draft.contentFormat === 'html' ? sanitizeRichContent(draft.content || '') : escapeHtml(draft.content || '').replace(/\n/g, '<br>');
      else if (content) content.value = draft.content || '';
      if (draft.era) {
        const option = [...form.querySelectorAll('[data-era-option]')].find((button) => button.textContent.trim() === draft.era);
        option?.click();
      }
      if (draft.topic) {
        const option = [...form.querySelectorAll('[data-topic-option]')].find((button) => button.dataset.topicLabel === draft.topic);
        option?.click();
      }
    } catch (error) {
      localStorage.removeItem('anonymousPostDraft');
    }
  }

  function showEditorStatus(message) {
    const status = document.getElementById('postSubmitStatus');
    if (!status) {
      window.showAppToast?.(message);
      return;
    }
    status.textContent = message;
    status.classList.remove('hidden');
    status.classList.add('sr-only');
    window.showAppToast?.(message);
  }

  function openPostPreview(form) {
    const draft = currentDraft(form);
    const plainContent = form.querySelector('#postEditor')?.innerText.trim() || form.querySelector('[name="content"]')?.value.trim() || '';
    if (!draft.title.trim() || !plainContent) {
      window.showAppToast?.('Nhập tiêu đề và nội dung trước khi xem trước.', 'error');
      return;
    }
    let dialog = document.getElementById('postPreviewDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'postPreviewDialog';
      dialog.className = 'w-[min(760px,calc(100vw-2rem))] max-h-[85vh] overflow-auto rounded-xl border border-[#E8E2D5] p-0 shadow-2xl backdrop:bg-black/50';
      document.body.appendChild(dialog);
    }
    dialog.innerHTML = `<div class="flex items-center justify-between border-b border-[#E8E2D5] px-5 py-4"><span class="text-xs font-bold uppercase tracking-wide text-[#9E782F]">Xem trước bài viết</span><button aria-label="Đóng xem trước" class="rounded p-1 text-stone-600 hover:bg-stone-100" type="button"><span class="material-symbols-outlined">close</span></button></div><article class="p-6"><div class="mb-2 text-xs font-semibold text-[#6B0210]">Ẩn danh · ${escapeHtml(draft.era || 'Tư liệu lịch sử')}</div><h2 class="font-heritage text-2xl font-bold text-[#6B0210]">${escapeHtml(draft.title)}</h2><div class="post-content mt-4 text-sm leading-7 text-[#514840]">${contentForPost(draft.content, draft.contentFormat)}</div>${draft.source ? `<p class="mt-5 border-t pt-3 text-xs italic text-stone-500">Nguồn: ${escapeHtml(draft.source)}</p>` : ''}</article>`;
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }, { once: true });
    dialog.showModal();
  }

  function wrapSelection(editor, attribute, value) {
    editor.focus();
    const selection = window.getSelection();
    let range = savedEditorRange?.cloneRange() || (selection.rangeCount ? selection.getRangeAt(0) : null);
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    const span = document.createElement('span');
    span.setAttribute(attribute, value);
    if (range.collapsed) {
      span.textContent = '\u200b';
      range.insertNode(span);
      range.setStart(span.firstChild, 1);
      range.collapse(true);
    } else {
      span.append(range.extractContents());
      range.insertNode(span);
      range.selectNodeContents(span);
    }
    selection.removeAllRanges();
    selection.addRange(range);
    savedEditorRange = range.cloneRange();
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'format' }));
  }

  function rememberEditorSelection(editor) {
    const selection = window.getSelection();
    if (selection.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      savedEditorRange = selection.getRangeAt(0).cloneRange();
    }
  }

  function bindPostEditor(form) {
    const editor = form.querySelector('#postEditor');
    const content = form.querySelector('[name="content"]');
    const imageInput = form.querySelector('#postImageInput');
    if (!editor || !content) return;

    editor.addEventListener('input', () => { content.value = sanitizeRichContent(editor.innerHTML); });
    editor.addEventListener('keyup', () => rememberEditorSelection(editor));
    editor.addEventListener('mouseup', () => rememberEditorSelection(editor));
    editor.addEventListener('touchend', () => rememberEditorSelection(editor));
    document.addEventListener('selectionchange', () => rememberEditorSelection(editor));

    form.querySelectorAll('[data-editor-action]').forEach((button) => {
      button.addEventListener('mousedown', (event) => {
        if (button.dataset.editorAction !== 'image') event.preventDefault();
        rememberEditorSelection(editor);
      });
      button.addEventListener('click', () => {
        const action = button.dataset.editorAction;
        editor.focus();
        if (action === 'bold' || action === 'italic') document.execCommand(action, false);
        if (action === 'blockquote') document.execCommand('formatBlock', false, 'blockquote');
        if (action === 'nom') wrapSelection(editor, 'data-script', 'nom');
        if (action === 'quote') {
          const selection = window.getSelection();
          const selectedText = selection.toString();
          document.execCommand('insertText', false, selectedText ? `«${selectedText}»` : '« trích dẫn »');
        }
        if (action === 'image') {
          rememberEditorSelection(editor);
          imageInput?.click();
        }
        if (action === 'draft') saveDraft(form);
        if (action === 'preview') openPostPreview(form);
        content.value = sanitizeRichContent(editor.innerHTML);
        rememberEditorSelection(editor);
      });
    });

    form.querySelector('#editorFont')?.addEventListener('change', (event) => {
      if (event.target.value !== 'default') wrapSelection(editor, 'data-font', event.target.value);
      event.target.value = 'default';
    });
    form.querySelector('#editorSize')?.addEventListener('change', (event) => {
      if (event.target.value !== 'default') wrapSelection(editor, 'data-size', event.target.value);
      event.target.value = 'default';
    });
    imageInput?.addEventListener('change', () => {
      if (imageInput.files?.[0]) insertImageFile(imageInput.files[0], editor);
      imageInput.value = '';
    });
    restoreDraft(form);
    content.value = sanitizeRichContent(editor.innerHTML);
  }

  function bindPostPageControls() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const greeting = document.getElementById('postGreetingName');
    const adminLink = document.getElementById('postAdminLink');
    if (greeting) greeting.textContent = user?.name || 'Khách';
    if (adminLink && user?.role === 'admin') adminLink.href = 'admin.html';
    document.getElementById('postLogoutButton')?.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.setAppToastForNextPage?.('Bạn đã đăng xuất.', 'success');
      window.location.href = 'login.html';
    });

    document.getElementById('postSearchInput')?.addEventListener('input', updatePostPageControls);
    document.querySelectorAll('[data-feed-filter]').forEach((button) => button.addEventListener('click', () => {
      activeFeedFilter = button.dataset.feedFilter;
      document.querySelectorAll('[data-feed-filter]').forEach((filter) => {
        const selected = filter === button;
        filter.classList.toggle('bg-primary', selected);
        filter.classList.toggle('text-white', selected);
        filter.classList.toggle('font-semibold', selected);
        filter.classList.toggle('text-stone-600', !selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      updatePostPageControls();
    }));
    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('postSearchInput')?.focus();
      }
      if (event.key === 'Escape' && document.activeElement?.id === 'postSearchInput') {
        const input = document.getElementById('postSearchInput');
        input.value = '';
        updatePostPageControls();
      }
    });
    bindStaticPostActions();
    updatePostPageControls();
  }

  function insertImageFile(file, editor) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 12 * 1024 * 1024) {
      window.showAppToast?.('Ảnh cần nhỏ hơn 12 MB trước khi tải lên.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => window.showAppToast?.('Không đọc được tệp ảnh.', 'error');
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => window.showAppToast?.('Tệp này không phải ảnh hợp lệ.', 'error');
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.76);
        if (dataUrl.length > 900000) {
          window.showAppToast?.('Ảnh sau nén vẫn quá lớn. Hãy chọn ảnh khác.', 'error');
          return;
        }
        editor.focus();
        const selection = window.getSelection();
        const range = savedEditorRange?.cloneRange() || (selection.rangeCount ? selection.getRangeAt(0) : document.createRange());
        if (!editor.contains(range.commonAncestorContainer)) {
          range.selectNodeContents(editor);
          range.collapse(false);
        }
        const element = document.createElement('img');
        element.src = dataUrl;
        element.alt = file.name.replace(/\.[^.]+$/, '').slice(0, 180) || 'Ảnh tư liệu';
        range.insertNode(element);
        range.setStartAfter(element);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        savedEditorRange = range.cloneRange();
        editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertImage' }));
        window.showAppToast?.('Đã chèn ảnh tư liệu vào bài viết.');
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  window.getAnonymousPosts = getPosts;
  window.renderAnonymousPostFeed = renderPostFeed;
  window.renderAdminPosts = renderAdminPosts;
  window.deleteAnonymousPost = deleteAnonymousPost;
  window.submitAnonymousPost = submitAnonymousPost;

  const animationStyle = document.createElement('style');
  animationStyle.textContent = '@keyframes post-arrive{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.anonymous-post{animation:post-arrive .45s ease-out both}.post-editor:empty:before{content:attr(data-placeholder);color:#a8a29e;pointer-events:none}.post-editor [data-script="nom"]{font-family:"Noto Serif",serif;color:#6B0210}.post-content [data-script="nom"]{font-family:"Noto Serif",serif;color:#6B0210}.post-editor [data-font="serif"],.post-content [data-font="serif"]{font-family:"Noto Serif",serif}.post-editor [data-font="sans"],.post-content [data-font="sans"]{font-family:"Be Vietnam Pro",sans-serif}.post-editor [data-size="small"],.post-content [data-size="small"]{font-size:.85em}.post-editor [data-size="normal"],.post-content [data-size="normal"]{font-size:1em}.post-editor [data-size="large"],.post-content [data-size="large"]{font-size:1.3em}.post-editor blockquote,.post-content blockquote{border-left:3px solid #9E782F;margin:.75rem 0;padding:.25rem 0 .25rem .8rem;color:#6b584a;font-family:"Noto Serif",serif;font-style:italic}.post-editor img,.post-content img{display:block;max-width:100%;max-height:420px;object-fit:contain;border-radius:8px;margin:.75rem auto}.post-content p{margin:.5rem 0}.post-content ul,.post-content ol{padding-left:1.5rem;list-style:initial}.post-card-content{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}.post-card-content img{display:none}@media(prefers-reduced-motion:reduce){.anonymous-post{animation:none;transition:none}}';
  document.head.appendChild(animationStyle);

  document.addEventListener('DOMContentLoaded', () => {
    renderPostFeed(document.getElementById('communityPostList'));
    renderPostFeed(document.getElementById('homePostList'), 3);
    renderAdminPosts();
    document.querySelectorAll('#anonymousPostForm').forEach(bindPostEditor);
    document.querySelectorAll('[data-era-option]').forEach((button) => button.addEventListener('click', () => {
      document.querySelectorAll('[data-era-option]').forEach((option) => {
        option.classList.remove('bg-primary', 'text-white', 'font-semibold');
        option.classList.add('bg-[#F6F2E9]', 'text-[#4F4138]');
        option.removeAttribute('data-selected-era');
      });
      button.classList.add('bg-primary', 'text-white', 'font-semibold');
      button.classList.remove('bg-[#F6F2E9]', 'text-[#4F4138]');
      button.setAttribute('data-selected-era', 'true');
      const label = document.getElementById('selectedEraLabel');
      if (label) label.textContent = `Đã chọn: ${button.textContent.trim()}`;
    }));
    document.querySelectorAll('[data-topic-option]').forEach((button) => button.addEventListener('click', () => {
      document.querySelectorAll('[data-topic-option]').forEach((option) => {
        const selected = option === button;
        option.classList.toggle('bg-[#F6ECE7]', selected);
        option.classList.toggle('text-primary', selected);
        option.classList.toggle('border-primary/20', selected);
        option.classList.toggle('bg-[#F6F2E9]', !selected);
        option.classList.toggle('text-stone-700', !selected);
        option.setAttribute('aria-pressed', String(selected));
        if (selected) option.setAttribute('data-selected-topic', 'true');
        else option.removeAttribute('data-selected-topic');
      });
    }));
    bindPostPageControls();
    bindCommunityChat();
  });

  window.addEventListener('anonymous-posts-updated', () => {
    renderPostFeed(document.getElementById('communityPostList'));
    renderPostFeed(document.getElementById('homePostList'), 3);
    renderAdminPosts();
    updatePostCount();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) {
      renderPostFeed(document.getElementById('communityPostList'));
      renderPostFeed(document.getElementById('homePostList'), 3);
      renderAdminPosts();
      updatePostPageControls();
    }
    if (event.key === chatStorageKey) renderChatMessages();
  });
})();