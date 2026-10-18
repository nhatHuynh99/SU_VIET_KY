(function () {
  const year = Number(new URLSearchParams(window.location.search).get("year"));
  const main = document.querySelector("main");
  const safe = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const fallbackEvents = window.historicalEvents?.[year];

  function renderStatus(message, isError) {
    main.innerHTML = `<div class="mx-auto max-w-4xl px-4 py-16 text-center">
      <span class="material-symbols-outlined text-4xl ${isError ? "text-primary" : "text-secondary"}">${isError ? "error_outline" : "progress_activity"}</span>
      <h1 class="mt-4 font-headline-lg text-2xl font-bold text-primary">Tra cứu sự kiện năm ${safe(year || "")}</h1>
      <p class="mt-3 text-on-surface-variant" role="status">${safe(message)}</p>
      ${isError ? '<button id="retryYearSearch" class="mt-5 rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-container" type="button">Thử lại</button>' : ""}
    </div>`;
    document.getElementById("retryYearSearch")?.addEventListener("click", load);
  }

  function renderResults(events, sources, isAi, warning) {
    const eventSources = (sources || []).map((source) => {
      if (!source || typeof source.url !== "string") return "";
      let url;
      try {
        url = new URL(source.url);
      } catch {
        return "";
      }
      if (url.protocol !== "https:" && url.protocol !== "http:") return "";
      return `<a class="block rounded-lg border border-surface-container p-3 text-sm text-primary hover:bg-surface-container-low" href="${safe(url.href)}" target="_blank" rel="noopener noreferrer">${safe(source.title || url.hostname)}<span class="ml-1 text-on-surface-variant">↗</span></a>`;
    }).filter(Boolean);
    const eventList = events.map((event, index) => `
      <button data-event-tab="${index}" class="w-full rounded-lg p-4 text-left transition-all ${index === 0 ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface hover:bg-surface-container"}" type="button">
        <span class="block text-xs font-bold opacity-80">${safe(event.date)}</span>
        <span class="mt-1 block font-headline-sm text-base font-bold">${safe(event.title)}</span>
        <span class="mt-2 block text-xs opacity-80">${safe(event.category)}</span>
      </button>`).join("");
    main.innerHTML = `<div class="mx-auto w-full max-w-7xl px-4 py-8 lg:px-12">
      <div class="mb-7">
        <span class="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-primary-fixed"><span class="material-symbols-outlined text-base">${isAi ? "auto_awesome" : "menu_book"}</span>${isAi ? "Tra cứu có AI · Google Search" : "Tư liệu biên soạn sẵn"}</span>
        <h1 class="mt-3 font-headline-lg text-3xl font-bold text-primary md:text-4xl">Sự kiện lịch sử Việt Nam năm <span class="text-secondary">${year}</span></h1>
        <p class="mt-2 text-on-surface-variant">${events.length ? `Tìm thấy ${events.length} sự kiện nổi bật. Chọn từng mốc để xem nội dung, hình ảnh và nguồn tham khảo.` : `Chưa tìm thấy sự kiện nổi bật được xác minh trong năm ${year}.`}</p>
        ${warning ? `<p class="mt-3 rounded-lg bg-secondary-container/40 p-3 text-sm text-on-surface" role="status">${safe(warning)}</p>` : ""}
      </div>
      ${events.length ? `<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <aside class="space-y-2 rounded-xl bg-white p-4 shadow-sm lg:col-span-4">
          <div class="mb-3 flex items-center justify-between border-b border-surface-container pb-3"><span class="font-headline-sm font-bold text-primary">Sự kiện trong năm</span><span class="text-xs font-bold text-secondary">${events.length} mốc</span></div>
          ${eventList}
          <a href="index.html" class="mt-4 flex items-center justify-center gap-2 py-2 font-semibold text-primary hover:underline"><span class="material-symbols-outlined text-lg">arrow_back</span>Tra cứu năm khác</a>
        </aside>
        <section id="event-detail" class="overflow-hidden rounded-xl bg-white shadow-sm lg:col-span-8" aria-live="polite"></section>
      </div>` : '<div class="rounded-xl bg-surface-container-low p-6 text-on-surface-variant">Không có dữ liệu để hiển thị. Hãy thử một năm khác hoặc kiểm tra lại sau.</div>'}
    </div>`;

    function selectEvent(index) {
      const event = events[index];
      document.querySelectorAll("[data-event-tab]").forEach((tab, tabIndex) => {
        tab.classList.toggle("bg-primary", tabIndex === index);
        tab.classList.toggle("text-on-primary", tabIndex === index);
        tab.classList.toggle("bg-surface-container-low", tabIndex !== index);
        tab.classList.toggle("text-on-surface", tabIndex !== index);
      });
      const image = event.image && typeof event.image.url === "string" ? event.image : null;
      const videoUrl = new URL("https://www.youtube.com/results");
      videoUrl.searchParams.set("search_query", `${event.title} ${year} tư liệu lịch sử`);
      const imageBlock = image
        ? `<img class="h-64 w-full bg-surface-container object-cover md:h-80" src="${safe(image.url)}" alt="${safe(event.title)}" loading="lazy" onerror="this.hidden=true"><div class="bg-surface-container-low px-5 py-2 text-xs text-on-surface-variant">${image.pageUrl ? `<a href="${safe(image.pageUrl)}" target="_blank" rel="noopener noreferrer" class="underline">${isAi ? "Ảnh Wikimedia Commons" : "Ảnh tư liệu"}</a>` : isAi ? "Ảnh Wikimedia Commons" : "Ảnh tư liệu"}${image.artist ? ` · ${safe(image.artist)}` : ""}${image.license ? ` · ${safe(image.license)}` : ""}</div>`
        : `<div class="flex h-48 items-center justify-center gap-2 bg-surface-container-low text-sm text-on-surface-variant"><span class="material-symbols-outlined">image_not_supported</span>Chưa tìm thấy ảnh phù hợp trên Wikimedia Commons</div>`;
      document.getElementById("event-detail").innerHTML = `${imageBlock}
        <div class="space-y-5 p-6 md:p-8">
          <div class="flex flex-wrap items-center gap-2"><span class="rounded bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">${safe(event.category)}</span><span class="text-sm text-on-surface-variant">${safe(event.date)}</span></div>
          <h2 class="font-headline-lg text-2xl font-bold leading-tight text-primary md:text-3xl">${safe(event.title)}</h2>
          <p class="text-lg leading-relaxed text-on-surface-variant">${safe(event.summary)}</p>
          <div class="rounded-lg border-l-4 border-secondary bg-surface-container-low p-4"><h3 class="mb-1 font-headline-sm font-bold text-primary">Thông tin sự kiện</h3><p class="leading-relaxed">${safe(event.detail)}</p></div>
          <a class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container" href="${safe(videoUrl.href)}" target="_blank" rel="noopener noreferrer"><span class="material-symbols-outlined">play_circle</span>Tìm video tư liệu</a>
          ${eventSources.length ? `<div><h3 class="mb-2 font-headline-sm font-bold text-primary">${isAi ? "Nguồn tham khảo từ Google Search" : "Nguồn tư liệu biên soạn"}</h3><div class="grid gap-2 sm:grid-cols-2">${eventSources.slice(0, 8).join("")}</div></div>` : ""}
          <p class="text-xs text-on-surface-variant">${isAi ? "Nội dung do AI tổng hợp từ các nguồn web được dẫn liên kết. Hãy mở nguồn để đối chiếu trước khi trích dẫn." : "Đang hiển thị dữ liệu biên soạn sẵn; hãy thử lại để AI tra cứu và cập nhật nguồn tham khảo."}</p>
        </div>`;
    }

    document.querySelectorAll("[data-event-tab]").forEach((button) => {
      button.addEventListener("click", () => selectEvent(Number(button.dataset.eventTab)));
    });
    if (events.length) selectEvent(0);
  }

  async function load() {
    if (!Number.isInteger(year) || year < 1 || year > 9999) {
      renderStatus("Vui lòng nhập một năm hợp lệ gồm 4 chữ số.", true);
      return;
    }
    renderStatus("AI đang tra cứu và đối chiếu nguồn tài liệu về các sự kiện trong năm này…", false);
    try {
      const client = window.suvietSupabase;
      if (!client) throw new Error("Không kết nối được dịch vụ tra cứu.");
      const { data, error } = await client.functions.invoke("historical-year-search", { body: { year } });
      if (error) throw error;
      if (!data || !Array.isArray(data.events) || !Array.isArray(data.sources)) {
        throw new Error("Dịch vụ AI trả về dữ liệu không hợp lệ.");
      }
      if (data.events.some((event) => !event || ["date", "category", "title", "summary", "detail"].some((field) => typeof event[field] !== "string"))) {
        throw new Error("Dịch vụ AI trả về nội dung sự kiện không hợp lệ.");
      }
      renderResults(data.events, data.sources, true, "");
    } catch (error) {
      console.error("AI historical search failed:", error);
      let errorMessage = error?.message || "Không thể kết nối dịch vụ tra cứu AI.";
      if (error?.context && typeof error.context.clone === "function") {
        try {
          const responseBody = await error.context.clone().json();
          if (typeof responseBody.error === "string") errorMessage = responseBody.error;
          else if (error.context.status === 404) errorMessage = "Chưa triển khai Edge Function tra cứu AI.";
        } catch {
          if (error.context.status === 404) {
            errorMessage = "Chưa triển khai Edge Function tra cứu AI.";
          }
        }
      }
      if (fallbackEvents?.length) {
        renderResults(
          fallbackEvents.map((event) => ({
            ...event,
            image: typeof event.image === "string" ? { url: event.image, pageUrl: null } : event.image,
          })),
          fallbackEvents.filter((event) => event.source).map((event) => ({ title: event.title, url: event.source })),
          false,
          `${errorMessage} Đang hiển thị dữ liệu biên soạn sẵn; hãy kiểm tra cấu hình rồi thử lại.`
        );
      } else {
        renderStatus(`${errorMessage} Kiểm tra Edge Function và cấu hình GEMINI_API_KEY rồi thử lại.`, true);
      }
    }
  }

  const searchInput = document.querySelector("header input");
  if (searchInput) {
    searchInput.value = Number.isInteger(year) && year > 0 ? String(year) : "";
    searchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || !searchInput.value.trim()) return;
      event.preventDefault();
      const value = searchInput.value.trim();
      window.location.href = /^\d{1,4}$/.test(value)
        ? `search.html?year=${encodeURIComponent(value)}`
        : `book.html?q=${encodeURIComponent(value)}`;
    });
  }

  load();
})();
