// chatbase.js - Tích hợp Trợ lý AI Sử Việt Ký qua Chatbase
(function () {
  const CHATBASE_BOT_ID = "8ZCRRelUbBmcRlJYgz0I7";
  const CHATBASE_DOMAIN = "www.chatbase.co";
  const CHATBASE_IDENTITY_SECRET = "jnj0ipyt9ei4m49bj11atadcpdckxywy";

  // Đảm bảo nút chat luôn nổi cố định trên viewport màn hình và không bị trôi xuống chân trang
  const floatingStyle = document.createElement("style");
  floatingStyle.id = "chatbase-floating-fix";
  floatingStyle.textContent = `
    html, body {
      transform: none !important;
      perspective: none !important;
    }
    #chatbase-bubble-button,
    #chatbase-bubble-window,
    #chatbase-message-container {
      position: fixed !important;
      z-index: 2147483647 !important;
    }
  `;
  if (document.head) {
    document.head.appendChild(floatingStyle);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(floatingStyle));
  }

  // 1. Khởi tạo queue và Proxy cho window.chatbase theo chuẩn Chatbase
  if (!window.chatbase || window.chatbase("getState") !== "initialized") {
    window.chatbase = (...arguments) => {
      if (!window.chatbase.q) {
        window.chatbase.q = [];
      }
      window.chatbase.q.push(arguments);
    };
    window.chatbase = new Proxy(window.chatbase, {
      get(target, prop) {
        if (prop === "q") {
          return target.q;
        }
        return (...args) => target(prop, ...args);
      },
    });
  }

  // 2. Tải script nhúng widget Chatbase
  const onLoad = function () {
    if (!document.getElementById(CHATBASE_BOT_ID)) {
      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = CHATBASE_BOT_ID;
      script.domain = CHATBASE_DOMAIN;
      document.body.appendChild(script);
    }

    // Nhận diện tài khoản người dùng nếu đã đăng nhập
    identifySignedInUser();
  };

  if (document.readyState === "complete") {
    onLoad();
  } else {
    window.addEventListener("load", onLoad);
  }

  // 3. Hàm tạo JWT Token HMAC-SHA256 từ Web Crypto API (Xác thực danh tính người dùng bảo mật)
  async function generateChatbaseToken(user) {
    try {
      if (!window.crypto || !window.crypto.subtle) return null;
      const enc = new TextEncoder();
      const header = { alg: "HS256", typ: "JWT" };
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        user_id: String(user.id || user.email || "guest"),
        email: user.email || "",
        name: user.name || "",
        role: user.role || "user",
        iat: now,
        exp: now + 3600 * 24, // Hạn dùng 24h
      };

      const b64Url = (obj) => {
        const json = typeof obj === "string" ? obj : JSON.stringify(obj);
        return btoa(unescape(encodeURIComponent(json)))
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");
      };

      const headerB64 = b64Url(header);
      const payloadB64 = b64Url(payload);
      const data = enc.encode(`${headerB64}.${payloadB64}`);

      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(CHATBASE_IDENTITY_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const sig = await crypto.subtle.sign("HMAC", key, data);
      const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      return `${headerB64}.${payloadB64}.${sigB64}`;
    } catch (err) {
      console.warn("Lỗi sinh Chatbase token:", err);
      return null;
    }
  }

  // 4. Nhận diện người dùng với Chatbase
  async function identifySignedInUser() {
    try {
      const userStr = localStorage.getItem("currentUser");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      if (!user || (!user.id && !user.email)) return;

      const token = await generateChatbaseToken(user);
      if (token && typeof window.chatbase === "function") {
        window.chatbase("identify", { token });
      }
    } catch (err) {
      console.warn("Chatbase identify warning:", err);
    }
  }

  // 5. Tự động đồng bộ khi phiên đăng nhập thay đổi
  window.addEventListener("storage", (e) => {
    if (e.key === "currentUser") {
      identifySignedInUser();
    }
  });

  window.identifyChatbaseUser = identifySignedInUser;
})();
