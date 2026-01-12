const axios = require('axios');
const fs = require('fs');
const path = require('path');
const process = require('process'); // 虽然 process 是全局变量，但显式引入是个好习惯
const { UploadFile } = require('./lib/OSS');
const { dc, ai } = require('./config.js');

// 1. 配置 API Key 和 URL
const apiKey = ai.API_KEY;

// 如果没有配置环境变量，可以直接在这里写死，例如： const apiKey = "sk-xxxxxxxx";
if (!apiKey) {
  console.error("错误：未检测到 DASHSCOPE_API_KEY 环境变量。");
  console.error("请先设置环境变量，或在代码中填入 API Key。");
  process.exit(1);
}

const apiUrl = ai.URL

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
}

function buildUserPrompt(imageCount) {
  return '保持人物比例不变，脸部不变，人物头发飘逸，光影效果自然，武器发光，背景丰富且有层次感且有武侠风格'
}

async function uploadSampleImagesFromDir({ maxImages = 3 } = {}) {
  const imagesDir = path.join(__dirname, 'images');

  let entries;
  try {
    entries = await fs.promises.readdir(imagesDir, { withFileTypes: true });
  } catch (err) {
    throw new Error(`读取目录失败：${imagesDir}，请确认已创建并放入图片。`);
  }

  const filenames = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter(isImageFile)
    .sort();

  if (filenames.length === 0) {
    throw new Error(`未找到可用图片：${imagesDir}（支持 png/jpg/jpeg/webp/gif）`);
  }

  const selected = filenames.slice(0, maxImages);
  const uploadedUrls = [];

  for (const filename of selected) {
    const localPath = path.join(imagesDir, filename);
    const objectKey = path.posix.join(
      (dc && dc.ossFilePath) ? String(dc.ossFilePath) : 'ai-image',
      'samples',
      `${Date.now()}_${filename}`
    );

    const url = await UploadFile(objectKey, localPath);
    uploadedUrls.push(url);
    console.log(`[成功] 已上传到 OSS: ${localPath} -> ${url}`);
  }

  return uploadedUrls;
}

const config = {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  //  'X-DashScope-WorkSpace': 'default'
  }
};

// 3. 定义下载图片的辅助函数
async function downloadImage(url, filename) {
  try {
    // 关键点：responseType 必须是 arraybuffer
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // 确保保存目录存在
    const dir = path.join(__dirname, 'result'); // 使用 __dirname 确保路径相对于当前脚本
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    const filePath = path.join(dir, filename);

    // 写入文件
    await fs.promises.writeFile(filePath, response.data);
    console.log(`[成功] 图片已保存: ${filePath}`);
  } catch (err) {
    console.error(`[失败] 下载图片 ${filename} 出错:`, err.message);
  }
}

// 4. 主流程函数
async function callDashScope() {
  try {
    const imageUrls = await uploadSampleImagesFromDir({ maxImages: 3 });
    const payload = {
      model: "qwen-image-edit-plus-2025-12-15",
      input: {
        messages: [
          {
            role: "user",
            content: [
              ...imageUrls.map((url) => ({ image: url })),
              { text: buildUserPrompt(imageUrls.length) }
            ]
          }
        ]
      },
      parameters: {
        n: 2, // 生成两张图
        watermark: false,
        negative_prompt: "低质量",
        prompt_extend: true,
        size: "2048*2048"
      }
    };

    console.log("正在请求百炼 API (CommonJS版)...");
    const response = await axios.post(apiUrl, payload, config);
    const responseData = response.data;

    // 检查业务逻辑错误码
    if (responseData.code) {
      console.error(`API 错误: ${responseData.code}`);
      console.error(`错误信息: ${responseData.message}`);
      return;
    }

    // 解析并下载
    if (responseData.output &&
      responseData.output.choices &&
      responseData.output.choices.length > 0) {

      const messageContent = responseData.output.choices[0].message.content;

      // 遍历 content 数组
      for (let i = 0; i < messageContent.length; i++) {
        const item = messageContent[i];
        if (item.image) {
          const imgUrl = item.image;
          // 生成文件名，防止覆盖
          const fileName = `output_${Date.now()}_${i + 1}.png`;

          console.log(`正在处理第 ${i + 1} 张图片...`);
          await downloadImage(imgUrl, fileName);
        }
      }
    } else {
      console.log("未在响应中找到图片数据。");
      console.log("完整响应:", JSON.stringify(responseData, null, 2));
    }

  } catch (error) {
    if (error.response) {
      console.error(`HTTP 错误: ${error.response.status}`);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("请求失败:", error.message);
    }
  }
}

// 执行
callDashScope();
