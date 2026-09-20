// auth.js - Xử lý logic Đăng ký, Đăng nhập, LocalStorage và Trạng thái người dùng

// 1. Hàm Đăng Ký
function registerUser(name, email, password) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  name = name.trim();
  email = email.trim().toLowerCase();

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    alert("Email này đã được đăng ký! Vui lòng chọn đăng nhập.");
    return false;
  }

  if (name.length < 2 || password.length < 8) {
    alert("Họ tên phải có ít nhất 2 ký tự và mật khẩu phải có ít nhất 8 ký tự.");
    return false;
  }

  const newUser = { name, email, password };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  // Tự động đăng nhập người dùng vừa đăng ký
  localStorage.setItem('currentUser', JSON.stringify({ name: newUser.name, email: newUser.email, role: 'user', loginAt: Date.now() }));
  alert(`Xin chào, ${newUser.name}! Bạn đã đăng ký thành công.`);
  window.location.href = "index.html";
  return true;
}

// 2. Hàm Đăng Nhập
function loginUser(email, password) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  email = email.trim().toLowerCase();

  if (email === 'admin@123' && password === '030312') {
    const adminUser = { name: 'Quản trị viên', email: 'admin@123', role: 'admin', loginAt: Date.now() };
    localStorage.setItem('currentUser', JSON.stringify(adminUser));
    alert('Đăng nhập tài khoản quản trị thành công.');
    window.location.href = 'admin.html';
    return true;
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email, role: user.role || 'user', loginAt: Date.now() }));
    alert(`Xin chào, ${user.name}! Bạn đã đăng nhập thành công.`);
    window.location.href = "index.html";
    return true;
  } else {
    alert("Email hoặc mật khẩu không chính xác!");
    return false;
  }
}

// 3. Hàm Đăng Xuất
function logoutUser() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

function isAdminUser() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser && currentUser.email === 'admin@123' && currentUser.role === 'admin';
}

function requireAdminPage() {
  if (!isAdminUser()) window.location.replace('login.html?admin=1');
}

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
}

function recordSiteView() {
  const views = JSON.parse(localStorage.getItem('siteViews') || '[]');
  views.push(Date.now());
  localStorage.setItem('siteViews', JSON.stringify(views.slice(-10000)));
}

// 4. Kiểm tra trạng thái đăng nhập và hiển thị tên trên Header của index.html
function checkAuthState() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const headerRightDiv = document.getElementById('user-header-area');

  if (headerRightDiv && currentUser) {
    headerRightDiv.innerHTML = `
      <div class="flex items-center gap-2">
        ${isAdminUser()
          ? `<a href="admin.html" class="font-label-sm text-[12px] bg-primary text-on-primary hover:bg-primary-container px-2.5 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>Admin</a>`
          : `<a href="login.html?admin=1" class="font-label-sm text-[12px] bg-primary text-on-primary hover:bg-primary-container px-2.5 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>Đăng nhập Admin</a>`}
        <span class="font-body-sm text-[14px] text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px]">person</span>
          Xin chào, ${currentUser.name}
        </span>
        <button onclick="logoutUser()" class="font-label-sm text-[12px] bg-red-100 text-red-700 hover:bg-red-200 px-2.5 py-1.5 rounded-lg transition-all font-semibold">
          Đăng xuất
        </button>
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
      window.location.href = /^\d{4}$/.test(value)
        ? `search.html?year=${encodeURIComponent(value)}`
        : `book.html?q=${encodeURIComponent(value)}`;
    });
  }
}

function handleRegisterSubmit(formId) {
  const form = document.getElementById(formId);
  const password = form.querySelector('#reg-pwd').value;
  const passwordConfirmation = form.querySelector('#reg-pwd-confirm').value;

  if (password !== passwordConfirmation) {
    alert("Mật khẩu xác nhận không khớp.");
    return false;
  }

  return registerUser(
    form.querySelector('#reg-name').value,
    form.querySelector('#reg-email').value,
    password,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body && !window.location.pathname.endsWith('/admin.html')) syncSharedHeader();
    checkAuthState();
    if (window.location.pathname.endsWith('/admin.html')) requireAdminPage();
  });
} else {
  if (!window.location.pathname.endsWith('/admin.html')) syncSharedHeader();
  checkAuthState();
  if (window.location.pathname.endsWith('/admin.html')) requireAdminPage();
}