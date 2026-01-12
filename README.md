# ai-image

## 数据库（MySQL）

1. 创建库和表：执行 `accounts.sql`
2. 配置连接信息（推荐环境变量，或写到 `config.js` 的 `mysql` 字段）

环境变量：
- `MYSQL_HOST` / `MYSQL_PORT`
- `MYSQL_USER` / `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `REGISTRATION_CODE`（注册需要，支持多个用英文逗号分隔）

## 帐号与额度

- 访问页面后可注册/登录
- 每个帐号每月默认最多生成 `200` 张（按请求 `n` 预扣，失败会返还；成功但实际返回更少会返还差额）
