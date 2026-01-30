# 即梦4.0 配置说明

## 简介

即梦4.0 是火山引擎提供的图像生成能力，支持文生图和图生图功能，具有以下特点：
- 支持 4K 超高清输出
- 中文生成准确率高
- 支持单次输入最多 10 张图像
- 可一次性输出最多 15 张图像
- 速度适中，通常在 1-2 分钟内完成

## 配置步骤

### 1. 获取火山引擎 API 密钥

1. 访问火山引擎官网：https://www.volcengine.com/
2. 注册并登录账号
3. 前往控制台获取以下信息：
   - Access Key ID（访问密钥 ID）
   - Secret Access Key（访问密钥）

### 2. 配置密钥

在 `config.js` 文件中配置即梦密钥：

```javascript
const jimeng = {
  ACCESS_KEY_ID: process.env.JIMENG_ACCESS_KEY_ID || 'your_jimeng_access_key_id',
  SECRET_ACCESS_KEY: process.env.JIMENG_SECRET_ACCESS_KEY || 'your_jimeng_secret_access_key',
  TIMEOUT: Number(process.env.JIMENG_TIMEOUT || 180000), // 超时时间，单位 ms（3分钟）
};
```

**替换步骤**：
1. 打开 `config.js` 文件
2. 找到 `jimeng` 配置项
3. 将 `'your_jimeng_access_key_id'` 替换为您的实际 Access Key ID
4. 将 `'your_jimeng_secret_access_key'` 替换为您的实际 Secret Access Key

**或使用环境变量**（可选）：

如果不想在代码中直接写入密钥，可以在项目根目录创建 `.env` 文件：

```bash
# 即梦4.0 API 配置
JIMENG_ACCESS_KEY_ID=your_access_key_id_here
JIMENG_SECRET_ACCESS_KEY=your_secret_access_key_here

# 可选：设置超时时间（毫秒，默认 180000 = 3分钟）
JIMENG_TIMEOUT=180000
```

环境变量的优先级高于 `config.js` 中的默认值。

### 3. 重启服务

配置完成后，重启服务使配置生效：

```bash
npm start
```

或使用 PM2：

```bash
pm2 restart ai-image
```

## 使用说明

### 前端使用

1. 在 "AI 创作" 页面中
2. 选择模型下拉框中选择 "即梦4.0（支持4K超清，速度适中）"
3. 输入 Prompt 描述
4. 选择是否启用超清模式（4K）
5. 点击"开始生成"

### 支持的功能

- **文生图**：仅输入文字 Prompt 生成图像
- **图生图**：上传图片 + Prompt 进行图像编辑
- **超清模式**：勾选后支持 4K 分辨率输出
- **多图生成**：最多可生成 15 张图片（会消耗更多配额）

### 生成数量说明

即梦 API 的图片数量控制机制：
- 当设置生成数量为 1 时：强制生成单张图片
- 当设置生成数量 > 1 时：系统会在 Prompt 前自动添加"生成N张图片"的提示，引导 AI 生成指定数量的图片
- 实际生成数量可能与设置略有差异，因为 AI 会综合理解 Prompt 内容来决定最终输出

**建议**：
- 如果需要精确控制数量，建议在 Prompt 中明确说明（例如："生成3张不同角度的产品图"）
- 生成多张图片时会增加处理时间和配额消耗
- 建议单次生成不超过 6 张图片，以获得更好的效果和速度

### 画幅比例

文生图模式支持以下画幅比例：
- 1:1（方形）- 2K: 2048x2048, 4K: 4096x4096
- 4:3（横向）- 2K: ~2730x2048, 4K: ~5461x4096
- 3:4（纵向）- 2K: 2048x~2730, 4K: 4096x~5461
- 16:9（宽屏）- 2K: ~3641x2048, 4K: ~7281x4096
- 9:16（竖屏）- 2K: 2048x~3641, 4K: 4096x~7281

## 注意事项

1. **API 配额**：即梦 API 需要付费使用，请注意控制使用量
2. **超时设置**：因为是异步任务，建议设置较长的超时时间（默认 3 分钟）
3. **图片数量**：
   - 输入图片：最多 10 张（建议 6 张以内）
   - 输出图片：最多 15 张（输出数量 = 15 - 输入图数量）
4. **分辨率**：分辨率越大、输出图片数量越多，延迟越明显
5. **审核限制**：输入的文字和图片需要通过火山引擎的内容审核

## 错误排查

### 1. "Missing JiMeng credentials" 错误
- 检查 `config.js` 中的密钥是否已正确替换
- 如果使用环境变量，确认 `.env` 文件是否在项目根目录
- 确认密钥格式正确（不要有多余的空格或引号）
- 确认服务是否已重启

### 2. 生成超时

即梦任务通常需要 1-3 分钟完成，系统已配置：
- 最大等待时间：3 分钟（90次重试 × 2秒间隔）
- 单次请求超时：30 秒

**如果仍然超时**：
1. 检查网络连接是否稳定
2. 减少输出图片数量（建议不超过 6 张）
3. 降低输出分辨率（取消勾选超清）
4. 查看服务器日志，确认任务状态：
   ```bash
   # 查看日志中的任务进度
   # 会显示：[JiMeng] Task xxx status: generating, retry xx/90
   ```
5. 如需调整全局超时，修改 `config.js`：
   ```javascript
   const jimeng = {
     TIMEOUT: Number(process.env.JIMENG_TIMEOUT || 300000), // 改为5分钟
   };
   ```

### 3. 审核不通过（错误码 50413）
- 检查 Prompt 是否包含敏感词汇
- 检查输入图片是否包含敏感内容

## 参考文档

- 即梦4.0 API 文档：https://www.volcengine.com/docs/6444/1340578
- 火山引擎签名文档：https://www.volcengine.com/docs/6369/67269

## 快速配置示例

在 `config.js` 文件中，找到如下代码：

```javascript
const jimeng = {
  ACCESS_KEY_ID: process.env.JIMENG_ACCESS_KEY_ID || 'your_jimeng_access_key_id',
  SECRET_ACCESS_KEY: process.env.JIMENG_SECRET_ACCESS_KEY || 'your_jimeng_secret_access_key',
  TIMEOUT: Number(process.env.JIMENG_TIMEOUT || 180000),
};
```

修改为：

```javascript
const jimeng = {
  ACCESS_KEY_ID: process.env.JIMENG_ACCESS_KEY_ID || 'AKLTZjY3YzFmOTYt...',  // 替换为您的实际密钥
  SECRET_ACCESS_KEY: process.env.JIMENG_SECRET_ACCESS_KEY || 'WVdGaU5qY3pabU...',  // 替换为您的实际密钥
  TIMEOUT: Number(process.env.JIMENG_TIMEOUT || 180000),
};
```

保存文件并重启服务即可。

## 技术支持

如有问题，请参考 `jimeng.md` 文件了解完整的 API 接口说明。
