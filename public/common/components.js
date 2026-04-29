/**
 * 公共组件库
 * 用于渲染导航栏、模态框等公共组件
 */

const Components = {
  /**
   * 渲染导航栏
   * @param {string} activePage - 当前激活的页面 ('home' | 'generate' | 'profile')
   * @returns {string} HTML 字符串
   */
  renderNavbar(activePage = '') {
    const isHome = activePage === 'home';
    const isGenerate = activePage === 'generate';
    const isProfile = activePage === 'profile';

    return `
      <nav class="navbar">
        <div class="nav-container">
          <div class="nav-brand">
            <h1 class="nav-logo">P了么</h1>
            <span class="nav-tagline"></span>
          </div>
          <div class="nav-links">
            <a href="/pages/home/index.html" class="nav-link ${isHome ? 'active' : ''}" target="_blank">首页</a>
            <a href="/pages/generate/generate.html" class="nav-link ${isGenerate ? 'active' : ''}" target="_blank">AI 创作</a>
            <a href="/pages/profile/profile.html" id="navProfile" class="nav-link ${isProfile ? 'active' : ''}" style="display:none" target="_blank">个人中心</a>
            <a href="/pages/admin/dashboard.html" id="navAdmin" class="nav-link" style="display:none" target="_blank">后台管理</a>
          </div>
          <div class="nav-actions">
            <div id="navUser" class="nav-user" style="display:none">
              <span id="navUsername"></span>
              <button id="navLogout" class="nav-btn secondary">退出</button>
            </div>
            <div id="navGuest" class="nav-guest">
              <button id="navLogin" class="nav-btn secondary">登录</button>
              <button id="navRegister" class="nav-btn primary">注册</button>
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  /**
   * 渲染登录模态框
   * @returns {string} HTML 字符串
   */
  renderLoginModal() {
    return `
      <div id="loginModal" class="modal" hidden>
        <div class="modalCard" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
          <div class="modalHeader">
            <div id="loginTitle" class="modalTitle">登录</div>
            <button class="iconBtn" type="button" data-close-modal="loginModal" aria-label="关闭">×</button>
          </div>
          <div class="modalBody">
            <div class="row grid2">
              <div>
                <label class="label" for="loginUsername">用户名</label>
                <input id="loginUsername" type="text" autocomplete="username" placeholder="a-z0-9._-" />
              </div>
              <div>
                <label class="label" for="loginPassword">密码</label>
                <input id="loginPassword" type="password" autocomplete="current-password" placeholder="至少 6 位" />
              </div>
            </div>
            <div id="loginError" class="formError" hidden></div>
          </div>
          <div class="modalFooter">
            <button class="secondary" type="button" data-close-modal="loginModal">取消</button>
            <button id="doLogin" class="primary" type="button">登录</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 渲染注册模态框
   * @returns {string} HTML 字符串
   */
  renderRegisterModal() {
    return `
      <div id="registerModal" class="modal" hidden>
        <div class="modalCard" role="dialog" aria-modal="true" aria-labelledby="registerTitle">
          <div class="modalHeader">
            <div id="registerTitle" class="modalTitle">注册</div>
            <button class="iconBtn" type="button" data-close-modal="registerModal" aria-label="关闭">×</button>
          </div>
          <div class="modalBody">
            <div class="row grid2">
              <div>
                <label class="label" for="registerUsername">用户名</label>
                <input id="registerUsername" type="text" autocomplete="username" placeholder="a-z0-9._-" />
              </div>
              <div>
                <label class="label" for="registerPassword">密码</label>
                <input id="registerPassword" type="password" autocomplete="new-password" placeholder="至少 6 位" />
              </div>
            </div>
            <div class="row">
              <label class="label" for="inviteCode">注册码</label>
              <input id="inviteCode" type="text" autocomplete="off" placeholder="请输入注册码" />
              <div class="hint">注册需要有效的注册码。</div>
            </div>
            <div id="registerError" class="formError" hidden></div>
          </div>
          <div class="modalFooter">
            <button class="secondary" type="button" data-close-modal="registerModal">取消</button>
            <button id="doRegister" class="primary" type="button">注册</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 初始化公共组件
   * @param {Object} options - 配置选项
   * @param {string} options.activePage - 当前激活的页面
   * @param {boolean} options.includeModals - 是否包含模态框（默认 true）
   */
  init(options = {}) {
    const { activePage = '', includeModals = true } = options;

    // 插入导航栏
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
      navbarContainer.innerHTML = this.renderNavbar(activePage);
    } else {
      // 如果没有容器，插入到 body 开头
      const navbar = document.createElement('div');
      navbar.innerHTML = this.renderNavbar(activePage);
      document.body.insertBefore(navbar.firstElementChild, document.body.firstChild);
    }

    // 插入模态框
    if (includeModals) {
      const modalsContainer = document.getElementById('modals-container');
      const modalsHtml = this.renderLoginModal() + this.renderRegisterModal();

      if (modalsContainer) {
        modalsContainer.innerHTML = modalsHtml;
      } else {
        // 如果没有容器，插入到 body 末尾
        const modals = document.createElement('div');
        modals.innerHTML = modalsHtml;
        while (modals.firstChild) {
          document.body.appendChild(modals.firstChild);
        }
      }
    }

    // 加载公告
    this.loadAnnouncements();

    // 添加反馈浮窗
    this.initFeedback();
  },

  async loadAnnouncements() {
    try {
      const resp = await fetch('/api/announcements');
      if (!resp.ok) return;
      const data = await resp.json();
      const announcements = data.announcements || [];
      if (announcements.length === 0) return;

      const typeColors = {
        info: { bg: '#1e40af', border: '#3b82f6' },
        warning: { bg: '#92400e', border: '#f59e0b' },
        success: { bg: '#065f46', border: '#10b981' },
      };

      const container = document.createElement('div');
      container.id = 'announcements-container';
      container.style.cssText = 'position: fixed; top: 60px; left: 50%; transform: translateX(-50%); z-index: 9000; width: 90%; max-width: 700px; display: flex; flex-direction: column; gap: 8px;';

      for (const ann of announcements) {
        if (localStorage.getItem(`dismissed_ann_${ann.id}`)) continue;
        const colors = typeColors[ann.type] || typeColors.info;
        const div = document.createElement('div');
        div.style.cssText = `padding: 12px 16px; background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; color: #fff; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);`;
        div.innerHTML = `
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; margin-bottom: 4px;">${this.escapeHtml(ann.title)}</div>
            <div style="font-size: 14px; opacity: 0.9;">${this.escapeHtml(ann.content)}</div>
          </div>
          <button style="flex-shrink: 0; background: none; border: none; color: rgba(255,255,255,0.7); font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1;" data-dismiss-ann="${ann.id}">×</button>
        `;
        div.querySelector('[data-dismiss-ann]').addEventListener('click', () => {
          localStorage.setItem(`dismissed_ann_${ann.id}`, '1');
          div.remove();
          if (container.children.length === 0) container.remove();
        });
        container.appendChild(div);
      }

      if (container.children.length > 0) {
        document.body.appendChild(container);
      }
    } catch (err) {
      // 静默失败
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  initFeedback() {
    // 浮动按钮
    const btn = document.createElement('button');
    btn.id = 'feedbackBtn';
    btn.innerHTML = '💬';
    btn.title = '意见反馈';
    btn.style.cssText = 'position:fixed;bottom:24px;right:24px;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#10b981,#34d399);color:#fff;border:none;font-size:22px;cursor:pointer;box-shadow:0 4px 16px rgba(16,185,129,0.4);z-index:8000;transition:transform 0.2s;display:flex;align-items:center;justify-content:center;';
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.1)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });

    // 反馈面板
    const panel = document.createElement('div');
    panel.id = 'feedbackPanel';
    panel.style.cssText = 'display:none;position:fixed;bottom:84px;right:24px;width:320px;background:rgba(30,41,59,0.98);border:1px solid rgba(255,255,255,0.15);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:8000;backdrop-filter:blur(10px);';
    panel.innerHTML = `
      <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:16px;font-weight:600;color:#fff;">意见反馈</span>
        <button id="feedbackClose" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;padding:0 4px;">×</button>
      </div>
      <div style="padding:16px 20px;">
        <textarea id="feedbackContent" placeholder="请描述你的建议或遇到的问题..." style="width:100%;height:100px;resize:vertical;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;padding:10px;font-size:14px;"></textarea>
        <input id="feedbackContact" type="text" placeholder="联系方式（可选）" style="width:100%;margin-top:10px;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:14px;" />
        <button id="feedbackSubmit" style="width:100%;margin-top:12px;padding:10px;background:linear-gradient(135deg,#10b981,#34d399);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">提交反馈</button>
        <div id="feedbackMsg" style="margin-top:8px;font-size:13px;text-align:center;display:none;"></div>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    btn.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('feedbackClose').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    document.getElementById('feedbackSubmit').addEventListener('click', async () => {
      const content = document.getElementById('feedbackContent').value.trim();
      const contact = document.getElementById('feedbackContact').value.trim();
      const msgEl = document.getElementById('feedbackMsg');
      const submitBtn = document.getElementById('feedbackSubmit');

      if (!content) { msgEl.textContent = '请输入反馈内容'; msgEl.style.color = '#ef4444'; msgEl.style.display = 'block'; return; }

      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';
      try {
        const resp = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, contact }),
        });
        if (!resp.ok) { const d = await resp.json(); throw new Error(d.error || '提交失败'); }
        msgEl.textContent = '感谢你的反馈！';
        msgEl.style.color = '#10b981';
        msgEl.style.display = 'block';
        document.getElementById('feedbackContent').value = '';
        document.getElementById('feedbackContact').value = '';
        setTimeout(() => { panel.style.display = 'none'; msgEl.style.display = 'none'; }, 2000);
      } catch (err) {
        msgEl.textContent = err.message || '提交失败';
        msgEl.style.color = '#ef4444';
        msgEl.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '提交反馈';
      }
    });
  }
};

// 导出到全局
if (typeof window !== 'undefined') {
  window.Components = Components;
}
