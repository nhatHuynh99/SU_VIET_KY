const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const rateLimit = new Map<string, { count: number; windowStartedAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 12;
const MAX_EVENTS = 8;

type HistoricalEvent = {
  date: string;
  category: string;
  title: string;
  summary: string;
  detail: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getText(response: Record<string, unknown>): string {
  const steps = Array.isArray(response.steps) ? response.steps : [];
  return steps
    .filter((step): step is Record<string, unknown> =>
      Boolean(step) && typeof step === "object" && (step as Record<string, unknown>).type === "model_output"
    )
    .flatMap((step) => Array.isArray(step.content) ? step.content : [])
    .filter((block): block is Record<string, unknown> =>
      Boolean(block) && typeof block === "object" && (block as Record<string, unknown>).type === "text"
    )
    .map((block) => typeof block.text === "string" ? block.text : "")
    .join("\n")
    .trim();
}

function getSources(response: Record<string, unknown>) {
  const steps = Array.isArray(response.steps) ? response.steps : [];
  const sources = new Map<string, string>();

  for (const step of steps) {
    if (!step || typeof step !== "object" || !Array.isArray(step.content)) continue;
    for (const block of step.content) {
      if (!block || typeof block !== "object" || !Array.isArray(block.annotations)) continue;
      for (const annotation of block.annotations) {
        if (!annotation || typeof annotation !== "object") continue;
        const citation = annotation as Record<string, unknown>;
        if (citation.type !== "url_citation" || typeof citation.url !== "string") continue;
        try {
          const url = new URL(citation.url);
          if (url.protocol !== "https:" && url.protocol !== "http:") continue;
          sources.set(url.href, typeof citation.title === "string" ? citation.title : url.hostname);
        } catch {
          continue;
        }
      }
    }
  }

  return [...sources].map(([url, title]) => ({ url, title }));
}

function parseEvents(text: string): HistoricalEvent[] {
  const json = text.match(/\[[\s\S]*\]/)?.[0];
  if (!json) throw new Error("AI response did not contain an event list.");

  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error("AI response was not an event list.");

  return parsed.slice(0, MAX_EVENTS).map((item) => {
    if (!item || typeof item !== "object") throw new Error("AI returned an invalid event.");
    const event = item as Record<string, unknown>;
    const fields = ["date", "category", "title", "summary", "detail"] as const;
    for (const field of fields) {
      if (typeof event[field] !== "string" || !event[field].trim()) {
        throw new Error(`AI returned an event without ${field}.`);
      }
    }
    return Object.fromEntries(fields.map((field) => [field, (event[field] as string).trim().slice(0, 2400)])) as HistoricalEvent;
  });
}

async function findCommonsImage(title: string, year: number) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${title} ${year} Việt Nam`,
    gsrnamespace: "6",
    gsrlimit: "1",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1400",
    format: "json",
    origin: "*",
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "SuVietKy/1.0 (historical image search)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Wikimedia Commons image search failed.");

  const result = await response.json();
  const page = Object.values(result.query?.pages || {})[0] as Record<string, unknown> | undefined;
  const imageInfo = Array.isArray(page?.imageinfo) ? page.imageinfo[0] as Record<string, unknown> : undefined;
  if (!imageInfo || typeof imageInfo.thumburl !== "string") return null;
  const metadata = imageInfo.extmetadata && typeof imageInfo.extmetadata === "object"
    ? imageInfo.extmetadata as Record<string, { value?: string }>
    : {};

  return {
    url: imageInfo.thumburl,
    pageUrl: typeof imageInfo.descriptionurl === "string" ? imageInfo.descriptionurl : null,
    artist: metadata.Artist?.value?.replace(/<[^>]*>/g, "").slice(0, 300) || null,
    license: metadata.LicenseShortName?.value?.replace(/<[^>]*>/g, "").slice(0, 100) || null,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Chỉ hỗ trợ phương thức POST." }, 405);

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const clientLimit = rateLimit.get(clientIp);
  if (clientLimit && now - clientLimit.windowStartedAt < RATE_LIMIT_WINDOW_MS) {
    if (clientLimit.count >= RATE_LIMIT_REQUESTS) {
      return jsonResponse({ error: "Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau ít phút." }, 429);
    }
    clientLimit.count += 1;
  } else {
    rateLimit.set(clientIp, { count: 1, windowStartedAt: now });
  }

  let year: number;
  try {
    const body = await request.json();
    year = Number(body?.year);
  } catch {
    return jsonResponse({ error: "Dữ liệu yêu cầu không hợp lệ." }, 400);
  }
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return jsonResponse({ error: "Năm tra cứu phải là số nguyên từ 1 đến 9999." }, 400);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return jsonResponse({ error: "Chưa cấu hình GEMINI_API_KEY cho Edge Function." }, 503);

  try {
    const prompt = [
      `Tra cứu các sự kiện lịch sử Việt Nam nổi bật thực sự diễn ra trong năm ${year}.`,
      "Dùng Google Search để kiểm chứng dữ kiện, ưu tiên nguồn chính thống, bảo tàng, cơ quan lưu trữ, văn kiện nhà nước và cơ quan báo chí uy tín.",
      "Chỉ đưa sự kiện có căn cứ đáng tin cậy; không suy đoán, không bịa ngày tháng, chi tiết, ảnh hoặc nguồn. Nếu không xác minh được sự kiện nổi bật, trả về mảng rỗng.",
      "Trả lời bằng tiếng Việt, tối đa 8 sự kiện, sắp xếp theo thời gian.",
      'Chỉ trả về JSON array, không markdown, mỗi phần tử có đúng các trường: {"date":"ngày/tháng/năm hoặc khoảng thời gian","category":"nhóm sự kiện","title":"tên sự kiện","summary":"tóm tắt ngắn","detail":"ý nghĩa và diễn biến đã được kiểm chứng"}.',
      "Không viết sự kiện của năm khác, dù có liên quan đến bối cảnh.",
    ].join(" ");
    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        input: prompt,
        tools: [{ type: "google_search" }],
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!aiResponse.ok) {
      console.error("Gemini request failed with status:", aiResponse.status);
      return jsonResponse({ error: "AI hiện không thể tra cứu. Vui lòng thử lại sau." }, 502);
    }

    const interaction = await aiResponse.json() as Record<string, unknown>;
    const text = getText(interaction);
    const sources = getSources(interaction);
    if (!text || sources.length === 0) {
      return jsonResponse({ error: "AI không trả về kết quả kèm nguồn kiểm chứng. Vui lòng thử lại." }, 502);
    }

    const events = parseEvents(text);
    const enrichedEvents = await Promise.all(events.map(async (event) => {
      try {
        return { ...event, image: await findCommonsImage(event.title, year) };
      } catch (error) {
        console.error("Wikimedia image lookup failed:", error);
        return { ...event, image: null };
      }
    }));

    return jsonResponse({ year, events: enrichedEvents, sources });
  } catch (error) {
    console.error("Historical year search failed:", error);
    return jsonResponse({ error: "Không thể hoàn tất tra cứu lúc này. Vui lòng thử lại." }, 502);
  }
});
