# ai-image

一个轻量的 Web UI：上传本地图片 + 填写提示词，进行图片生成/重绘。内置帐号系统与每月额度（默认 200 张/月）。

## 功能

- 登录/注册（注册需要注册码）
- 每月额度：默认 `200` 张/账号/月，页面右上角展示剩余
- 输入图片预览、常用修图/二次元提示词快捷按钮
- “面部重绘”开关 + 重绘程度（1–5）
- 提示词历史：自动保存使用过的提示词，支持快速复用和删除
- 管理后台：用户管理、额度调整、统计数据

## 环境要求

- Node.js 18+（建议）
- MySQL 8.0+（或兼容 MySQL 的数据库）
- 阿里云百炼 API Key
- 阿里云 OSS（用于存储输入图片）

## 快速开始

1) 安装依赖

```bash
npm i
```

2) 初始化数据库

```bash
mysql -u root -p < init_data.sql
```

3) 配置环境变量（推荐）或在本地创建 `config.js`

建议从 `config.bac` 复制一份：

```bash
cp config.bac config.js
```

4) 启动

```bash
npm start
```

打开：`http://localhost:7993`

### docker 部署

```bash
docker build -t ai-image:0.0.1 .

docker run --name ai-image  -d -p 7993:7993 -v ./config.js:/home/www/ai-image/config.js  ai-image:0.0.1 start
```

## 配置说明

### 必需

- `DASHSCOPE_API_KEY`：DashScope API Key
- `REGISTRATION_CODE`：注册需要的注册码（支持多个，英文逗号分隔，如：`codeA,codeB`）

### 可选（Google 模型）

UI 可切换到 `Google Nano banana pro`（通过 NanoAI 网关）。

- `NANOAI_API_KEY`（必需）
- `NANOAI_API_URL`（可选，默认 `https://bapi.nanoai.cn/api/v1/images/gemini3pro`）
- `NANOAI_MODEL`（可选，默认 `gemini-3-pro-image-preview`）
- `NANOAI_IMAGE_SIZE`（可选，默认 `2K`）
- `NANOAI_IMAGE_SIZE_HD`（可选，默认 `4K`，勾选超清时使用）
- `NANOAI_TIMEOUT`（ms，可选）

### 可选（DashScope）

- `DASHSCOPE_URL`
- `DASHSCOPE_MODEL`
- `DASHSCOPE_TIMEOUT`（ms）

### MySQL

- `MYSQL_HOST`（默认 `127.0.0.1`）
- `MYSQL_PORT`（默认 `3306`）
- `MYSQL_USER`（默认 `root`）
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`（默认 `ai_image`）

### 额度/会话

- `MONTHLY_LIMIT`（默认 `200`）
- `SESSION_TTL_DAYS`（默认 `30`）

## 数据库表

建表文件：`init_data.sql`

- `users`：用户账号与密码哈希
- `sessions`：登录会话（Cookie `sid` 的 hash）
- `usage_monthly`：按月用量统计（`YYYY-MM`）
- `generation_history`：图片生成历史记录
- `favorites`：用户收藏的图片
- `gallery`：首页展示的图片（用户分享 + 管理员添加）
- `prompt_history`：提示词历史记录（自动保存，最多 100 条/用户）
- `admin_users`：管理员账号
- `admin_sessions`：管理员会话

### 数据库升级

如果你已经部署了旧版本，可以使用迁移脚本升级数据库：

```bash
# 添加提示词历史功能
mysql -u root -p ai_image < migrations/001_add_prompt_history.sql

# 添加管理后台功能
mysql -u root -p ai_image < migrations/002_add_admin_system.sql
```

## 管理后台

访问地址：`http://localhost:7993/pages/admin/login.html`

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

**重要：首次登录后请立即修改密码！**

### 管理后台功能

- **仪表盘**：查看系统统计数据（用户数、生成次数等）
- **用户管理**：查看、搜索、禁用/启用、删除用户
- **额度管理**：查询用户额度、调整额度、重置额度

## API（简要）

### 用户 API

- `POST /api/register` `{ username, password, inviteCode }`
- `POST /api/login` `{ username, password }`
- `POST /api/logout`
- `GET /api/me`
- `POST /api/generate` `{ images, prompt, n }`（需登录，且有额度）
- `GET /api/prompt-history?limit=20`（获取提示词历史）
- `DELETE /api/prompt-history` `{ id }`（删除提示词历史）

### 管理后台 API

- `POST /api/admin/login` `{ username, password }`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET /api/admin/stats`（获取统计数据）
- `GET /api/admin/users?page=1&limit=20&search=`（用户列表）
- `GET /api/admin/users/detail?id=`（用户详情）
- `POST /api/admin/users/toggle-status` `{ id, isDisabled }`（禁用/启用用户）
- `DELETE /api/admin/users` `{ id }`（删除用户）
- `GET /api/admin/quota?userId=&month=`（查询用户额度）
- `POST /api/admin/quota/adjust` `{ userId, month, delta }`（调整额度）
- `POST /api/admin/quota/reset` `{ userId, month }`（重置额度）

## 项目结构

### 页面目录结构

```
public/
├── common/                    # 公共资源
│   ├── styles.css            # 全局样式
│   ├── styles-enhance.css    # 全局样式增强
│   ├── components.js         # 公共组件（导航栏、模态框）
│   └── auth.js               # 认证逻辑
├── pages/                     # 页面目录
│   ├── home/                 # 首页
│   │   ├── index.html
│   │   ├── home.css
│   │   └── home.js
│   ├── generate/             # 生成页
│   │   ├── generate.html
│   │   ├── generate-layout.css
│   │   └── app.js
│   └── profile/              # 个人中心
│       ├── profile.html
│       ├── profile.css
│       ├── profile-enhance.css
│       └── profile.js
```

## 安全提示

- `config.js` 包含密钥/账号信息，已在 `.gitignore` 中忽略，请勿提交。

## 版权与许可

本项目采用 MIT License，可商用。详见 `LICENSE`。
