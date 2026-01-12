# ai-image

一个轻量的 Web UI：上传本地图片 + 填写提示词，进行图片生成/重绘。内置帐号系统与每月额度（默认 200 张/月）。

## 功能

- 登录/注册（注册需要注册码）
- 每月额度：默认 `200` 张/账号/月，页面右上角展示剩余
- 输入图片预览、常用修图/二次元提示词快捷按钮
- “面部重绘”开关 + 重绘程度（1–5）

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
mysql -u root -p < accounts.sql
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

## 配置说明

### 必需

- `DASHSCOPE_API_KEY`：DashScope API Key
- `REGISTRATION_CODE`：注册需要的注册码（支持多个，英文逗号分隔，如：`codeA,codeB`）

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

建表文件：`accounts.sql`

- `users`：用户账号与密码哈希
- `sessions`：登录会话（Cookie `sid` 的 hash）
- `usage_monthly`：按月用量统计（`YYYY-MM`）

## API（简要）

- `POST /api/register` `{ username, password, inviteCode }`
- `POST /api/login` `{ username, password }`
- `POST /api/logout`
- `GET /api/me`
- `POST /api/generate` `{ images, prompt, n }`（需登录，且有额度）

## 安全提示

- `config.js` 包含密钥/账号信息，已在 `.gitignore` 中忽略，请勿提交。

## 版权与许可

本项目采用 MIT License，可商用。详见 `LICENSE`。
