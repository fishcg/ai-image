# 管理后台使用说明

## 访问地址

`http://localhost:7993/pages/admin/login.html`

## 默认账号

- 用户名：`admin`
- 密码：`admin123`

**⚠️ 重要：首次登录后请立即修改密码！**

## 功能说明

### 1. 仪表盘

显示系统整体统计数据：

- 总用户数
- 活跃用户数
- 禁用用户数
- 总生成次数
- 本月生成次数

### 2. 用户管理

#### 查看用户列表

- 显示所有用户的基本信息（ID、用户名、本月使用量、状态、注册时间）
- 支持按用户名搜索
- 分页显示，每页 20 条

#### 禁用/启用用户

- 点击"禁用"按钮可以禁止用户登录和使用服务
- 点击"启用"按钮可以恢复用户的访问权限
- 禁用的用户无法登录，已登录的会话会失效

#### 删除用户

- 点击"删除"按钮可以永久删除用户
- **此操作不可恢复**，会同时删除用户的所有数据：
  - 会话记录
  - 额度记录
  - 生成历史
  - 收藏记录
  - 提示词历史

### 3. 额度管理

#### 查询用户额度

1. 输入用户 ID
2. 选择月份（默认为当前月）
3. 点击"查询"按钮

显示信息：
- 用户名
- 月份
- 已使用额度
- 剩余额度

#### 调整额度

在查询结果页面：

1. 输入调整数量
   - 正数：增加额度（例如：输入 50 表示增加 50 次）
   - 负数：减少额度（例如：输入 -30 表示减少 30 次）
2. 点击"调整"按钮

**注意**：
- 减少额度时，已使用量会相应增加
- 已使用量不会小于 0

#### 重置额度

点击"重置为 0"按钮可以将用户当月的已使用额度清零，相当于给用户重新分配满额度。

## 安全建议

### 修改默认密码

默认管理员密码是公开的，**必须**在首次登录后立即修改。

修改方法（需要手动操作数据库）：

```bash
# 1. 生成新密码的哈希值（在 Node.js 环境中）
node -e "console.log(require('crypto').createHash('sha256').update('你的新密码').digest('hex'))"

# 2. 更新数据库
mysql -u root -p ai_image
UPDATE admin_users SET password_hash = '新密码的哈希值' WHERE username = 'admin';
```

### 创建新管理员

```sql
-- 在 MySQL 中执行
USE ai_image;

-- 生成密码哈希（在 Node.js 中）
-- node -e "console.log(require('crypto').createHash('sha256').update('密码').digest('hex'))"

INSERT INTO admin_users (username, password_hash, role) VALUES
('新用户名', '密码哈希值', 'admin');
```

### 角色说明

- `super_admin`：超级管理员（预留，当前与 admin 权限相同）
- `admin`：普通管理员

## 常见问题

### Q: 忘记管理员密码怎么办？

A: 通过数据库重置密码：

```sql
-- 重置为 admin123
UPDATE admin_users SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' WHERE username = 'admin';
```

### Q: 如何批量调整用户额度？

A: 当前版本需要逐个调整。如需批量操作，可以直接操作数据库：

```sql
-- 给所有用户本月增加 100 次额度
UPDATE usage_monthly 
SET used = GREATEST(0, used - 100) 
WHERE month = '2026-04';
```

### Q: 管理后台会话多久过期？

A: 默认 7 天。过期后需要重新登录。

### Q: 可以查看用户的生成历史吗？

A: 当前版本暂不支持。可以通过数据库查询：

```sql
SELECT * FROM generation_history WHERE user_id = 用户ID ORDER BY created_at DESC LIMIT 20;
```

## 技术细节

### 认证机制

- 使用 Cookie 存储会话令牌（`admin_sid`）
- 令牌经过 SHA256 哈希后存储在数据库
- 会话有效期 7 天

### 密码存储

- 使用 SHA256 哈希存储密码
- 不存储明文密码

### API 权限

所有 `/api/admin/*` 接口都需要管理员登录才能访问。
