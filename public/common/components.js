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
  }
};

// 导出到全局
if (typeof window !== 'undefined') {
  window.Components = Components;
}
