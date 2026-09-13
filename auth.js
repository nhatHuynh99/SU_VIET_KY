// auth.js - Xử lý logic Đăng ký, Đăng nhập, LocalStorage và Trạng thái người dùng

// 1. Hàm Đăng Ký
function registerUser(name, email, password) {
  let users = JSON.parse(localStorage.getItem('users')) || [];

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    alert("Email này đã được đăng ký! Vui lòng chọn đăng nhập.");
    return false;
  }

  const newUser = { name, email, password };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  // Tự động đăng nhập người dùng vừa đăng ký
  localStorage.setItem('currentUser', JSON.stringify({ name: newUser.name, email: newUser.email }));
  alert(`Xin chào, ${newUser.name}! Bạn đã đăng ký thành công.`);
  window.location.href = "index.html";
  return true;
}

// 2. Hàm Đăng Nhập
function loginUser(email, password) {
  let users = JSON.parse(localStorage.getItem('users')) || [];

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email }));
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
  window.location.reload();
}

// 4. Kiểm tra trạng thái đăng nhập và hiển thị tên trên Header của index.html
function checkAuthState() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const headerRightDiv = document.getElementById('user-header-area');

  if (headerRightDiv && currentUser) {
    headerRightDiv.innerHTML = `
      <div class="flex items-center gap-2">
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