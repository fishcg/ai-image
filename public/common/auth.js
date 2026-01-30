/**
 * 公共认证逻辑
 * 处理登录、注册、退出等功能
 */

const Auth = {
  currentUser: null,
  currentQuota: null,

  /**
   * 初始化认证系统
   */
  async init() {
    await this.checkAuth();
    this.bindEvents();
  },

  /**
   * 检查用户认证状态
   */
  async checkAuth() {
    try {
      const resp = await fetch('/api/me', { credentials: 'include' });
      const data = await resp.json();

      if (resp.ok && data.user) {
        this.currentUser = data.user;
        this.currentQuota = data.quota;
        this.updateUI(true);
        return true;
      } else {
        this.currentUser = null;
        this.currentQuota = null;
        this.updateUI(false);
        return false;
      }
    } catch (err) {
      console.error('认证检查失败:', err);
      this.updateUI(false);
      return false;
    }
  },

  /**
   * 更新 UI 显示
   * @param {boolean} isLoggedIn - 是否已登录
   */
  updateUI(isLoggedIn) {
    const navUser = document.getElementById('navUser');
    const navGuest = document.getElementById('navGuest');
    const navProfile = document.getElementById('navProfile');
    const navUsername = document.getElementById('navUsername');

    if (isLoggedIn && this.currentUser) {
      if (navUser) navUser.style.display = 'flex';
      if (navGuest) navGuest.style.display = 'none';
      if (navProfile) navProfile.style.display = '';
      if (navUsername) navUsername.textContent = this.currentUser.username;

      // 更新额度显示（如果存在）
      const quotaEl = document.getElementById('quota');
      if (quotaEl && this.currentQuota) {
        quotaEl.textContent = `本月剩余额度: ${this.currentQuota.remaining}/${this.currentQuota.total}`;
      }

      // 更新 me 显示（如果存在）
      const meEl = document.getElementById('me');
      if (meEl) {
        meEl.textContent = `当前用户: ${this.currentUser.username}`;
      }

      // 显示需要认证的元素
      document.querySelectorAll('[data-auth="required"]').forEach(el => {
        el.style.display = '';
      });

      // 隐藏游客元素
      document.querySelectorAll('[data-auth="guest"]').forEach(el => {
        el.style.display = 'none';
      });
    } else {
      if (navUser) navUser.style.display = 'none';
      if (navGuest) navGuest.style.display = 'flex';
      if (navProfile) navProfile.style.display = 'none';

      // 隐藏需要认证的元素
      document.querySelectorAll('[data-auth="required"]').forEach(el => {
        el.style.display = 'none';
      });

      // 显示游客元素
      document.querySelectorAll('[data-auth="guest"]').forEach(el => {
        el.style.display = '';
      });

      // 更新 me 显示
      const meEl = document.getElementById('me');
      if (meEl) {
        meEl.textContent = '未登录';
      }
    }
  },

  /**
   * 绑定事件
   */
  bindEvents() {
    // 登录按钮
    const loginBtns = document.querySelectorAll('#navLogin, #guestLogin, #heroLogin');
    loginBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => this.openModal('loginModal'));
      }
    });

    // 注册按钮
    const registerBtns = document.querySelectorAll('#navRegister, #guestRegister');
    registerBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => this.openModal('registerModal'));
      }
    });

    // 退出按钮
    const logoutBtn = document.getElementById('navLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // 执行登录
    const doLoginBtn = document.getElementById('doLogin');
    if (doLoginBtn) {
      doLoginBtn.addEventListener('click', () => this.doLogin());

      // 回车键登录
      const loginPassword = document.getElementById('loginPassword');
      if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.doLogin();
        });
      }
    }

    // 执行注册
    const doRegisterBtn = document.getElementById('doRegister');
    if (doRegisterBtn) {
      doRegisterBtn.addEventListener('click', () => this.doRegister());
    }

    // 关闭模态框
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.closest('[data-close-modal]').getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    // 点击模态框外部关闭
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });
  },

  /**
   * 打开模态框
   */
  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * 关闭模态框
   */
  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
  },

  /**
   * 设置表单错误
   */
  setFormError(id, message) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = message;
      el.hidden = !message;
    }
  },

  /**
   * 执行登录
   */
  async doLogin() {
    const username = document.getElementById('loginUsername')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!username || !password) {
      this.setFormError('loginError', '请输入用户名和密码');
      return;
    }

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await resp.json();

      if (resp.ok) {
        this.closeModal('loginModal');
        this.setFormError('loginError', '');
        await this.checkAuth();
        location.reload();
      } else {
        this.setFormError('loginError', data.error || '登录失败');
      }
    } catch (err) {
      this.setFormError('loginError', '网络错误，请重试');
    }
  },

  /**
   * 执行注册
   */
  async doRegister() {
    const username = document.getElementById('registerUsername')?.value?.trim();
    const password = document.getElementById('registerPassword')?.value;
    const inviteCode = document.getElementById('inviteCode')?.value?.trim();

    if (!username || !password || !inviteCode) {
      this.setFormError('registerError', '请填写所有字段');
      return;
    }

    try {
      const resp = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, inviteCode }),
        credentials: 'include',
      });

      const data = await resp.json();

      if (resp.ok) {
        this.closeModal('registerModal');
        this.setFormError('registerError', '');
        await this.checkAuth();
        location.reload();
      } else {
        this.setFormError('registerError', data.error || '注册失败');
      }
    } catch (err) {
      this.setFormError('registerError', '网络错误，请重试');
    }
  },

  /**
   * 退出登录
   */
  async logout() {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      this.currentUser = null;
      this.currentQuota = null;
      location.reload();
    } catch (err) {
      console.error('退出失败:', err);
    }
  }
};

// 导出到全局
if (typeof window !== 'undefined') {
  window.Auth = Auth;
}
