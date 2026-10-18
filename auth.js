// auth.js - Xử lý logic Đăng ký, Đăng nhập và Phân quyền HOÀN TOÀN qua Supabase Auth

function authFeedback(message, kind = 'info') {
  if (window.showAppToast) window.showAppToast(message, kind);
  else alert(message);
}

// Chuẩn hóa email: hỗ trợ cả tài khoản nhập dạng 'admin@123' hay username thông thường
function normalizeEmail(input) {
  if (!input) return '';
  const trimmed = input.trim().toLowerCase();
  // Nếu người dùng nhập admin@123, tự động chuyển về email admin chuẩn trên Supabase
  if (trimmed === 'admin@123' || trimmed === 'admin') {
    return 'admin@suvietky.vn';
  }
  // Nếu nhập username không có domain @ thì bổ sung đuôi @suvietky.vn
  if (!trimmed.includes('@')) {
    return `${trimmed}@suvietky.vn`;
  }
  return trimmed;
}

// 1. Hàm Đăng Ký người dùng mới qua Supabase Auth
async function registerUser(name, emailInput, password) {
  if (!window.suvietSupabase) {
    authFeedback("Dịch vụ Supabase chưa được tải. Vui lòng kiểm tra lại kết nối mạng.", 'error');
    return false;
  }

  name = (name || '').trim();
  const email = normalizeEmail(emailInput);
  password = (password || '').trim();

  if (name.length < 2) {
    authFeedback("Họ tên phải có ít nhất 2 ký tự.", 'error');
    return false;
  }

  if (password.length < 6) {
    authFeedback("Mật khẩu phải có ít nhất 6 ký tự theo tiêu chuẩn bảo mật Supabase.", 'error');
    return false;
  }

  // Mặc định người dùng tự đăng ký sẽ mang quyền 'user'
  const isSuperAdminEmail = email === 'admin@suvietky.vn';
  const role = isSuperAdminEmail ? 'admin' : 'user';

  authFeedback("Đang khởi tạo tài khoản trên hệ thống Supabase...", 'info');

  try {
    const { data, error } = await window.suvietSupabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          role: role
        }
      }
    });

    if (error) {
      console.error("Supabase signUp error:", error);
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists')) {
        authFeedback("Email này đã được đăng ký trên Supabase! Vui lòng chuyển sang tab Đăng Nhập.", 'error');
      } else if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        authFeedback("Đã chạm giới hạn gửi email của gói miễn phí Supabase. Hãy tắt 'Confirm email' trong Supabase Dashboard (Auth > Providers > Email) để đăng ký ngay lập tức không cần xác nhận email.", 'error');
      } else {
        authFeedback(`Lỗi đăng ký Supabase: ${error.message}`, 'error');
      }
      return false;
    }

    // Nếu Supabase trả về session ngay (trường hợp email autoconfirm bật)
    if (data.session && data.user) {
      const currentUser = {
        id: data.user.id,
        name: name,
        email: data.user.email,
        role: role,
        loginAt: Date.now(),
        provider: 'supabase'
      };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      window.setAppToastForNextPage?.(`Đăng ký và đăng nhập thành công! Xin chào, ${name}.`, 'success');
      window.location.href = role === 'admin' ? 'admin.html' : 'index.html';
      return true;
    }

    // Nếu Supabase yêu cầu đăng nhập sau khi tạo
    const loginEmail = document.getElementById('login-email');
    if (loginEmail) loginEmail.value = emailInput;
    if (typeof window.switchAuthTab === 'function') window.switchAuthTab('login');
    authFeedback(`Tạo tài khoản thành công cho ${name} trên Supabase! Hãy đăng nhập bằng mật khẩu vừa đặt.`, 'success');
    return true;
  } catch (err) {
    console.error("SignUp error:", err);
    authFeedback(`Lỗi kết nối máy chủ: ${err.message}`, 'error');
    return false;
  }
}

// 2. Hàm Đăng Nhập người dùng qua Supabase Auth
async function loginUser(emailInput, password) {
  if (!window.suvietSupabase) {
    authFeedback("Dịch vụ Supabase chưa sẵn sàng. Vui lòng làm mới trang.", 'error');
    return false;
  }

  const email = normalizeEmail(emailInput);
  password = (password || '').trim();

  if (!email || !password) {
    authFeedback("Vui lòng nhập đầy đủ email và mật khẩu.", 'error');
    return false;
  }

  authFeedback("Đang xác thực thông tin qua máy chủ Supabase...", 'info');

  try {
    const { data, error } = await window.suvietSupabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error("Supabase signIn error:", error);
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials")) {
        authFeedback("Email hoặc mật khẩu không chính xác trên hệ thống Supabase!", 'error');
      } else if (msg.includes("email not confirmed")) {
        authFeedback("Tài khoản chưa được xác nhận email. Bạn vui lòng kiểm tra hộp thư hoặc tắt 'Confirm email' trong Supabase Auth Settings.", 'error');
      } else {
        authFeedback(`Lỗi đăng nhập: ${error.message}`, 'error');
      }
      return false;
    }

    const user = data.user;
    const metadata = user.user_metadata || {};

    // Phân quyền Admin:
    // 1. role trong metadata của user là 'admin'
    // 2. hoặc email thuộc nhóm admin đặc quyền (admin@suvietky.vn, admin@gmail.com)
    // 3. hoặc người dùng nhập 'admin@123'
    const isAdmin = metadata.role === 'admin' ||
                    email === 'admin@suvietky.vn' ||
                    email === 'admin@gmail.com' ||
                    emailInput.trim().toLowerCase() === 'admin@123';

    const role = isAdmin ? 'admin' : (metadata.role || 'user');
    const displayName = metadata.name || metadata.full_name || email.split('@')[0] || (isAdmin ? 'Quản trị viên' : 'Thành viên');

    const currentUser = {
      id: user.id,
      name: displayName,
      email: user.email,
      role: role,
      loginAt: Date.now(),
      provider: 'supabase'
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    if (isAdmin) {
      window.setAppToastForNextPage?.(`Đăng nhập thành công với quyền Quản trị viên (Admin)! Xin chào, ${displayName}.`, 'success');
      window.location.href = 'admin.html';
    } else {
      window.setAppToastForNextPage?.(`Đăng nhập thành công! Xin chào, ${displayName}.`, 'success');
      window.location.href = 'index.html';
    }
    return true;
  } catch (err) {
    console.error("Login error:", err);
    authFeedback(`Lỗi kết nối Supabase: ${err.message}`, 'error');
    return false;
  }
}

// 3. Đăng nhập qua Google (OAuth trên Supabase)
function getAuthRedirectUrl() {
  if (window.location.protocol === 'file:') {
    return 'http://localhost:5500/index.html';
  }
  try {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    if (url.pathname.endsWith('login.html') || url.pathname.endsWith('re.html')) {
      url.pathname = url.pathname.replace(/(login|re)\.html$/, 'index.html');
    } else if (!url.pathname.endsWith('index.html')) {
      url.pathname = url.pathname.replace(/\/[^\/]*$/, '/index.html');
    }
    return url.toString();
  } catch (e) {
    return `${window.location.origin}/index.html`;
  }
}

async function loginWithGoogle() {
  if (!window.suvietSupabase) {
    authFeedback('Tính năng đăng nhập Google chưa sẵn sàng. Vui lòng thử lại sau.', 'error');
    return false;
  }

  if (window.location.protocol === 'file:') {
    authFeedback('Google OAuth chỉ hoạt động qua giao thức HTTP/HTTPS (ví dụ chạy qua Live Server: http://localhost:5500 hoặc http://localhost:3000).', 'error');
    return false;
  }

  try {
    const redirectUrl = getAuthRedirectUrl();
    const { error } = await window.suvietSupabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
    if (error) throw error;
    authFeedback('Đang chuyển hướng đến Google để xác thực...', 'info');
    return true;
  } catch (error) {
    console.error('Google login error:', error);
    authFeedback('Chưa bật nhà cung cấp Google trong Supabase Dashboard (Auth > Providers > Google).', 'error');
    return false;
  }
}

// 4. Đồng bộ phiên đăng nhập từ Supabase
function hydrateSupabaseSession() {
  if (!window.suvietSupabase) return;

  const syncUserFromSession = (session) => {
    if (!session?.user) return;
    const user = session.user;
    const metadata = user.user_metadata || {};
    const email = (user.email || '').toLowerCase();
    const isAdmin = metadata.role === 'admin' || email === 'admin@suvietky.vn' || email === 'admin@gmail.com';
    const displayName = metadata.name || metadata.full_name || email.split('@')[0] || (isAdmin ? 'Quản trị viên' : 'Thành viên');

    localStorage.setItem('currentUser', JSON.stringify({
      id: user.id,
      name: displayName,
      email: user.email,
      role: isAdmin ? 'admin' : (metadata.role || 'user'),
      loginAt: Date.now(),
      provider: 'supabase'
    }));

    checkAuthState();
  };

  // Kiểm tra phiên đăng nhập hiện tại trên Supabase
  window.suvietSupabase.auth.getSession().then(({ data: { session } }) => {
    if (session) syncUserFromSession(session);
  }).catch((error) => console.warn('Supabase getSession warning:', error));

  // Lắng nghe thay đổi trạng thái Auth từ Supabase
  window.suvietSupabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      syncUserFromSession(session);
    }
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('currentUser');
      checkAuthState();
    }
  });
}

function bindGoogleAuthButtons() {
  const buttons = document.querySelectorAll('#google-login-btn, #google-register-btn, [data-google-auth]');
  buttons.forEach((button) => {
    button.removeEventListener('click', loginWithGoogle);
    button.addEventListener('click', loginWithGoogle);
  });
}

// 5. Hàm Đăng Xuất hoàn toàn qua Supabase
async function logoutUser() {
  try {
    if (window.suvietSupabase && window.suvietSupabase.auth) {
      await window.suvietSupabase.auth.signOut();
    }
  } catch (error) {
    console.warn('Supabase signOut warning:', error);
  }

  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentUser');
  window.setAppToastForNextPage?.('Đã đăng xuất khỏi tài khoản Supabase.', 'success');
  window.location.href = 'login.html';
}

// 6. Kiểm tra quyền Quản trị viên
function isAdminUser() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return Boolean(currentUser && currentUser.role === 'admin');
}

// Bắt buộc quyền Admin cho các trang quản trị
function requireAdminPage() {
  if (!isAdminUser()) {
    window.location.replace('login.html?admin=1');
  }
}

// 7. Các tiện ích dữ liệu quản trị
function getAdminBooks() {
  try {
    return JSON.parse(localStorage.getItem('adminBooks') || '[]');
  } catch (error) {
    return [];
  }
}

function saveAdminBooks(books) {
  localStorage.setItem('adminBooks', JSON.stringify(books));
}

function addAdminNotification(message) {
  const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
  notifications.unshift({ message, createdAt: new Date().toLocaleString('vi-VN'), read: false });
  localStorage.setItem('adminNotifications', JSON.stringify(notifications.slice(0, 50)));
  window.showAppToast?.(message, 'success');
  if (window.suvietSupabase) {
    window.suvietSupabase.from('notifications').insert({ message }).then(({ error }) => {
      if (error) console.warn('Supabase notification fallback:', error.message);
    });
  }
}

function recordSiteView() {
  const views = JSON.parse(localStorage.getItem('siteViews') || '[]');
  views.push(Date.now());
  localStorage.setItem('siteViews', JSON.stringify(views.slice(-10000)));
  if (window.suvietSupabase) {
    const userId = window.suvietSupabase.auth.currentUser?.id || null;
    window.suvietSupabase.from('site_views').insert({ path: window.location.pathname, user_id: userId }).then(({ error }) => {
      if (error) console.warn('Supabase view fallback:', error.message);
    });
  }
}

// 8. Cập nhật giao diện Header theo người dùng đã đăng nhập Supabase
function checkAuthState() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const headerRightDiv = document.getElementById('user-header-area');
  if (!headerRightDiv) return;

  if (currentUser) {
    const displayName = String(currentUser.name || currentUser.email || 'người dùng').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    headerRightDiv.innerHTML = `
      <div class="flex items-center gap-2">
        ${isAdminUser()
          ? `<a href="admin.html" class="font-label-sm text-[12px] bg-primary text-on-primary hover:bg-primary-container px-2.5 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1 shadow-sm"><span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>Admin</a>`
          : ''}
        <span class="font-body-sm text-[13px] text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[17px]">account_circle</span>
          <span>${displayName}</span>
          ${currentUser.role === 'admin' ? '<span class="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded uppercase font-bold">Admin</span>' : ''}
        </span>
        <button onclick="logoutUser()" class="font-label-sm text-[12px] bg-red-100 text-red-700 hover:bg-red-200 px-2.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer" title="Đăng xuất khỏi Supabase">
          Đăng xuất
        </button>
      </div>
    `;
  } else {
    headerRightDiv.innerHTML = `
      <div class="flex items-center gap-2">
        <a href="login.html" class="px-3 py-1.5 rounded-full bg-primary text-white font-label-sm text-[12px] font-semibold hover:bg-primary-container transition-colors shadow-sm">
          Đăng Nhập
        </a>
        <a href="re.html" class="px-3 py-1.5 rounded-full border border-primary text-primary font-label-sm text-[12px] font-semibold hover:bg-primary/5 transition-colors hidden sm:inline-block">
          Đăng Ký
        </a>
      </div>
    `;
  }
}

function syncSharedHeader() {
  const header = document.querySelector('header');
  if (!header || document.getElementById('user-header-area')) return;

  header.innerHTML = `
    <div class="w-full max-w-7xl mx-auto px-4 lg:px-14 h-16 flex items-center justify-between gap-4">
      <a class="flex items-center gap-3 shrink-0" href="index.html" aria-label="Sử Việt Ký">
        <span class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
          <span class="material-symbols-outlined text-[22px]">account_balance</span>
        </span>
        <span class="flex flex-col">
          <span class="font-headline-sm text-[20px] text-primary font-bold tracking-tight">SỬ VIỆT KÝ</span>
          <span class="font-caption-era text-[11px] text-secondary tracking-wider uppercase hidden sm:inline">Dòng Chảy Lịch Sử Việt Nam</span>
        </span>
      </a>
      <div class="flex-1 max-w-2xl mx-auto hidden sm:flex justify-center">
        <div class="w-full flex items-center bg-white border border-[#e2e8f0] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 rounded-full px-4 py-2.5 shadow-md transition-all">
          <span class="material-symbols-outlined text-primary text-[24px] mr-3 shrink-0">search</span>
          <input class="shared-header-search bg-transparent text-on-surface placeholder:text-outline font-body-md text-[15px] focus:outline-none flex-1 min-w-0" placeholder="Tìm kiếm niên đại, nhân vật, sự kiện lịch sử..." type="search">
          <div class="flex items-center gap-1.5 shrink-0"><span class="font-label-sm text-[11px] text-secondary font-bold bg-[#f8fafc] border border-[#e2e8f0] rounded-md px-2 py-0.5">⌘K</span><span class="font-label-sm text-[11px] text-primary font-bold bg-primary/10 rounded-md px-2 py-0.5">VN</span></div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0" id="user-header-area">
        <a href="book.html" class="px-3 py-1.5 rounded-full bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9] text-on-surface font-label-sm text-[12px] flex items-center gap-1 transition-colors">
          <span class="material-symbols-outlined text-[16px] text-secondary">bookmarks</span><span class="hidden md:inline">Kho Lưu Trữ</span>
        </a>
      </div>
    </div>`;

  const input = header.querySelector('.shared-header-search');
  if (input && !input.dataset.bound) {
    const params = new URLSearchParams(window.location.search);
    input.value = params.get('q') || params.get('year') || '';
    input.dataset.bound = 'true';
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !input.value.trim()) return;
      const value = input.value.trim();
      const isYear = /^\d{4}$/.test(value);
      window.setAppToastForNextPage?.(isYear ? `Đang mở kết quả năm ${value}.` : `Đang tìm “${value}” trong kho sách.`, 'info');
      window.location.href = isYear
        ? `search.html?year=${encodeURIComponent(value)}`
        : `book.html?q=${encodeURIComponent(value)}`;
    });
  }
}

function handleRegisterSubmit(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  const name = form.querySelector('#reg-name')?.value;
  const email = form.querySelector('#reg-email')?.value;
  const password = form.querySelector('#reg-pwd')?.value;
  const passwordConfirmation = form.querySelector('#reg-pwd-confirm')?.value;

  if (password && passwordConfirmation && password !== passwordConfirmation) {
    authFeedback("Mật khẩu xác nhận không khớp.", 'error');
    return false;
  }

  return registerUser(name, email, password);
}

function isAdminPath() {
  const file = (window.location.pathname.split('/').pop() || '').toLowerCase();
  return file === 'admin.html' || file.startsWith('admin-');
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body && !isAdminPath()) syncSharedHeader();
    bindGoogleAuthButtons();
    hydrateSupabaseSession();
    checkAuthState();
    if (isAdminPath()) requireAdminPage();
  });
} else {
  if (!isAdminPath()) syncSharedHeader();
  bindGoogleAuthButtons();
  hydrateSupabaseSession();
  checkAuthState();
  if (isAdminPath()) requireAdminPage();
}