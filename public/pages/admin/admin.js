// 管理后台公共 JS
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
