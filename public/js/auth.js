/* bugket — Auth + Navbar UI */

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getInitials(name) {
  const clean = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "");
  return clean.join("") || "?";
}

function buildNavUserDropdown(user, email) {
  const safeName = escapeHtml(user?.name || "User");
  const safeEmail = escapeHtml(email || user?.email || "");

  const area = document.createElement("div");
  area.className = "nav-user-area";
  area.id = "nav-user-area";

  area.innerHTML = `
    <button class="nav-user-btn" id="nav-user-btn" aria-haspopup="true" aria-expanded="false">
      <div class="nav-avatar">${escapeHtml(getInitials(user?.name))}</div>
      <span class="nav-username">${safeName}</span>
      <svg class="nav-chevron" viewBox="0 0 24 24" fill="none">
        <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="nav-dropdown" id="nav-dropdown" role="menu">
      <div class="nav-dropdown-header">
        <div class="nav-dropdown-name">${safeName}</div>
        <div class="nav-dropdown-email">${safeEmail}</div>
      </div>
      <a href="/dashboard.html" class="nav-dropdown-item" role="menuitem">
        <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/></svg>
        Dashboard
      </a>
      <a href="/social.html" class="nav-dropdown-item" role="menuitem">
        <svg viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Trò chuyện & Kết bạn
      </a>
      <div class="nav-dropdown-divider"></div>
      <button class="nav-dropdown-item danger" id="logout-btn" role="menuitem">
        <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Đăng xuất
      </button>
    </div>
  `;

  return area;
}

function buildNavLoginBtn() {
  const btn = document.createElement("a");
  btn.href = "/login.html";
  btn.className = "nav-login-btn";
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Đăng nhập
  `;
  return btn;
}

function setupNavDropdown(area) {
  const btn = area.querySelector("#nav-user-btn");
  const dropdown = area.querySelector("#nav-dropdown");
  const logoutBtn = area.querySelector("#logout-btn");
  if (!btn || !dropdown || !logoutBtn) return;

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = area.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", () => {
    area.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  });

  dropdown.addEventListener("click", (event) => event.stopPropagation());

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    window.location.href = "/";
  });
}

function initNavbar() {
  const menu = document.querySelector(".menu");
  if (!menu) return;

  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  const email = localStorage.getItem("email") || "";

  if (token && userRaw) {
    try {
      const user = JSON.parse(userRaw);
      if (!user || !user.name) throw new Error("Invalid user data");
      const area = buildNavUserDropdown(user, email);
      menu.appendChild(area);
      setupNavDropdown(area);
      return;
    } catch (_error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }

  menu.appendChild(buildNavLoginBtn());
}

function setError(message) {
  const el = document.getElementById("error-msg");
  if (!el) return;
  el.textContent = message || "";
  el.style.animation = "none";
  requestAnimationFrame(() => {
    el.style.animation = "";
  });
}

function setLoading(btnId, spinnerId, textId, isLoading) {
  const btn = document.getElementById(btnId);
  const spinner = document.getElementById(spinnerId);
  const text = document.getElementById(textId);

  if (!btn) return;

  btn.disabled = isLoading;
  btn.setAttribute("aria-busy", String(isLoading));

  if (spinner) spinner.hidden = !isLoading;
  if (text) text.style.opacity = isLoading ? "0.5" : "1";
}

function bindFieldClearErrors(form) {
  if (!form) return;
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const error = document.getElementById("error-msg");
      if (error && error.textContent) setError("");
    });
  });
}

function setupPasswordToggle() {
  const toggleBtn = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");
  const eyeIcon = document.getElementById("eye-icon");

  if (!toggleBtn || !passwordInput || !eyeIcon) return;

  toggleBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    eyeIcon.innerHTML = isHidden
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 2 12 2 12a13.4 13.4 0 0 1 3.06-4.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.4 13.4 0 0 1-1.67 2.68M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      : '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>';
  });
}

function setupPasswordStrength() {
  const input = document.getElementById("password");
  const strengthBox = document.getElementById("pwd-strength");
  const fill = document.getElementById("pwd-fill");
  const label = document.getElementById("pwd-label");

  if (!input || !strengthBox || !fill || !label) return;

  const levels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
  const colors = ["#ff4757", "#ff6b81", "#fbbf24", "#34d399", "#19c3a6"];

  input.addEventListener("input", () => {
    const value = input.value;
    if (!value) {
      strengthBox.hidden = true;
      fill.style.width = "0%";
      label.textContent = "";
      return;
    }

    let score = 0;
    if (value.length >= 6) score += 1;
    if (value.length >= 10) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    const index = Math.max(0, score - 1);
    strengthBox.hidden = false;
    fill.style.width = `${(score / 5) * 100}%`;
    fill.style.background = colors[index];
    label.textContent = levels[index];
    label.style.color = colors[index];
  });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  bindFieldClearErrors(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = normalizeEmail(document.getElementById("email")?.value);
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading("login-btn", "login-spinner", "login-btn-text", true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Đăng nhập thất bại. Vui lòng thử lại.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("email", email);
      window.location.href = "/";
    } catch (_error) {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading("login-btn", "login-spinner", "login-btn-text", false);
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  bindFieldClearErrors(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = String(document.getElementById("name")?.value || "").trim();
    const email = normalizeEmail(document.getElementById("email")?.value);
    const password = document.getElementById("password")?.value || "";

    if (!name || !email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (name.length < 2) {
      setError("Tên hiển thị cần tối thiểu 2 ký tự.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading("register-btn", "register-spinner", "register-btn-text", true);
    setError("");

    try {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setError(registerData.error || "Đăng ký thất bại. Vui lòng thử lại.");
        return;
      }

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        window.location.href = "/login.html";
        return;
      }

      localStorage.setItem("token", loginData.token);
      localStorage.setItem("user", JSON.stringify(loginData.user));
      localStorage.setItem("email", email);
      window.location.href = "/";
    } catch (_error) {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading("register-btn", "register-spinner", "register-btn-text", false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  setupPasswordToggle();
  setupPasswordStrength();
  initLoginForm();
  initRegisterForm();
});
