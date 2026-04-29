// 管理后台公共 JS

const NAV_ITEMS = [
  { key: 'dashboard', href: '/pages/admin/dashboard.html', icon: '📊', label: '仪表盘' },
  { key: 'users',     href: '/pages/admin/users.html',     icon: '👥', label: '用户管理' },
  { key: 'quota',     href: '/pages/admin/quota.html',     icon: '💰', label: '额度管理' },
  { key: 'announcements', href: '/pages/admin/announcements.html', icon: '📢', label: '公告管理' },
  { key: 'reg-codes', href: '/pages/admin/reg-codes.html', icon: '🔑', label: '注册码管理' },
  { key: 'settings',  href: '/pages/admin/settings.html',  icon: '⚙️', label: '系统设置' },
];

const AdminLayout = {
  renderSidebar(activePage) {
    const navLinks = NAV_ITEMS.map(item =>
      `<a href="${item.href}" class="admin-nav-item${item.key === activePage ? ' active' : ''}"><span>${item.icon}</span> ${item.label}</a>`
    ).join('\n          ');

    return `
      <aside class="admin-sidebar">
        <div class="admin-logo">管理后台</div>
        <nav class="admin-nav">
          ${navLinks}
        </nav>
        <div class="admin-user">
          <div id="adminUsername">加载中...</div>
          <div style="display: flex; gap: 8px;">
            <button id="changePwdBtn" class="btn-logout" style="flex: 1;">修改密码</button>
            <button id="logoutBtn" class="btn-logout" style="flex: 1;">退出登录</button>
          </div>
        </div>
      </aside>

      <div id="changePwdModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000; place-items:center;">
        <div style="background:#1e293b; border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:32px; width:min(400px,90%); margin:auto; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);">
          <h3 style="color:#fff; margin:0 0 20px 0; font-size:18px;">修改密码</h3>
          <div style="margin-bottom:16px;">
            <label style="display:block; font-size:14px; color:rgba(255,255,255,0.7); margin-bottom:6px;">旧密码</label>
            <input id="oldPassword" type="password" class="search-input" placeholder="请输入旧密码" autocomplete="current-password" />
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block; font-size:14px; color:rgba(255,255,255,0.7); margin-bottom:6px;">新密码</label>
            <input id="newPassword" type="password" class="search-input" placeholder="至少 6 位" autocomplete="new-password" />
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block; font-size:14px; color:rgba(255,255,255,0.7); margin-bottom:6px;">确认新密码</label>
            <input id="confirmPassword" type="password" class="search-input" placeholder="再次输入新密码" autocomplete="new-password" />
          </div>
          <div id="changePwdError" style="color:#ef4444; font-size:14px; margin-bottom:12px; display:none;"></div>
          <div style="display:flex; gap:12px; justify-content:flex-end;">
            <button id="changePwdCancel" class="btn-secondary">取消</button>
            <button id="changePwdSubmit" class="btn-primary">确认修改</button>
          </div>
        </div>
      </div>
    `;
  },

  init({ activePage = '' } = {}) {
    const container = document.getElementById('admin-sidebar-container');
    if (container) {
      container.outerHTML = this.renderSidebar(activePage);
    }
    AdminAuth.init();
    this.bindChangePassword();
  },

  bindChangePassword() {
    const btn = document.getElementById('changePwdBtn');
    const modal = document.getElementById('changePwdModal');
    const cancelBtn = document.getElementById('changePwdCancel');
    const submitBtn = document.getElementById('changePwdSubmit');
    if (!btn || !modal) return;

    btn.addEventListener('click', () => { modal.style.display = 'block'; });
    cancelBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
      clearPwdForm();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) { modal.style.display = 'none'; clearPwdForm(); }
    });

    submitBtn?.addEventListener('click', async () => {
      const oldPwd = document.getElementById('oldPassword').value;
      const newPwd = document.getElementById('newPassword').value;
      const confirmPwd = document.getElementById('confirmPassword').value;
      const errEl = document.getElementById('changePwdError');

      errEl.style.display = 'none';

      if (!oldPwd || !newPwd) { showPwdError('请填写完整'); return; }
      if (newPwd.length < 6) { showPwdError('新密码长度至少 6 位'); return; }
      if (newPwd !== confirmPwd) { showPwdError('两次输入的新密码不一致'); return; }

      submitBtn.disabled = true;
      try {
        const resp = await fetch('/api/admin/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
        });
        const data = await resp.json();
        if (!resp.ok) { showPwdError(data.error || '修改失败'); return; }
        showToast('密码修改成功', 'success');
        modal.style.display = 'none';
        clearPwdForm();
      } catch { showPwdError('网络错误'); } finally { submitBtn.disabled = false; }
    });

    function showPwdError(msg) {
      const el = document.getElementById('changePwdError');
      if (el) { el.textContent = msg; el.style.display = 'block'; }
    }
    function clearPwdForm() {
      document.getElementById('oldPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
      const el = document.getElementById('changePwdError');
      if (el) el.style.display = 'none';
    }
  },
};

const AdminAuth = {
  async init() {
    await this.checkAuth();
    this.bindLogout();
  },

  async checkAuth() {
    try {
      const response = await fetch('/api/admin/me');
      if (!response.ok) {
        window.location.href = '/pages/admin/login.html';
        return;
      }

      const data = await response.json();
      const usernameEl = document.getElementById('adminUsername');
      if (usernameEl) {
        usernameEl.textContent = data.username;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/pages/admin/login.html';
    }
  },

  bindLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('/api/admin/logout', { method: 'POST' });
          window.location.href = '/pages/admin/login.html';
        } catch (error) {
          console.error('Logout failed:', error);
        }
      });
    }
  },
};

// 工具函数
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}
