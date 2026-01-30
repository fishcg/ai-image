/**
 * AI 辅助服务
 * 提供 Prompt 增强和图片风格识别功能
 */

const OpenAI = require('openai');

/**
 * 初始化 OpenAI 客户端（阿里百炼）
 */
function createDashScopeClient(apiKey) {
  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  });
}

/**
 * Prompt 增强
 * 将用户的简单描述扩展为详细的图片生成 prompt
 *
 * @param {Object} params
 * @param {string} params.userInput - 用户输入的简单描述
 * @param {string} params.mode - 生成模式 'txt2img' 或 'img2img'
 * @param {string} params.apiKey - DashScope API Key
 * @returns {Promise<Object>} { enhancedPrompt: string, tags: string[] }
 */
async function enhancePrompt({ userInput, mode = 'txt2img', apiKey }) {
  const client = createDashScopeClient(apiKey);

  const systemPrompt = mode === 'txt2img'
    ? `你是一个专业的 AI 图片生成 prompt 增强助手。
用户会输入简单的描述，你需要将其扩展为详细的、高质量的图片生成 prompt。

要求：
1. 保留用户的核心意图
2. 添加视觉细节（光影、色彩、氛围、质感）
3. 添加专业术语（如"电影级光影"、"超清细节"、"景深"等）
4. 适当添加艺术风格描述
5. 控制在 100-200 字符内
6. 提取 3-5 个关键标签

返回 JSON 格式：
{
  "enhancedPrompt": "增强后的详细 prompt",
  "tags": ["标签1", "标签2", "标签3"]
}

示例：
用户输入："二次元女孩"
输出：
{
  "enhancedPrompt": "二次元女孩，樱花雨，电影级光影，超清细节，柔和光照，浅景深，高质量插画，干净线条，温暖色调",
  "tags": ["二次元", "女孩", "樱花", "插画", "柔光"]
}`
    : `你是一个专业的 AI 图片编辑 prompt 增强助手。
用户会输入简单的修图需求，你需要将其扩展为详细的图片编辑 prompt。

要求：
1. 保留用户的核心修图意图
2. 明确具体的调整方向（提升/降低/增强/减少）
3. 添加专业修图术语
4. 适当添加效果描述
5. 控制在 100-200 字符内
6. 提取 3-5 个关键标签

返回 JSON 格式：
{
  "enhancedPrompt": "增强后的详细 prompt",
  "tags": ["标签1", "标签2", "标签3"]
}

示例：
用户输入："让照片更好看"
输出：
{
  "enhancedPrompt": "电影调色，HDR 质感，锐化细节，肤色校正，面部高光，背景虚化，提升整体质感",
  "tags": ["调色", "HDR", "锐化", "人像优化", "虚化"]
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'qwen3-max-2026-01-23', // 使用快速模型
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      response_format: {
        type: 'json_object'
      },
      temperature: 0.7 // 稍微增加创造性
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      enhancedPrompt: result.enhancedPrompt || result.enhanced_prompt || '',
      tags: result.tags || []
    };
  } catch (error) {
    console.error('Prompt enhancement failed:', error);
    throw new Error('Prompt 增强失败: ' + error.message);
  }
}

/**
 * 图片风格提取
 * 分析参考图片，提取风格描述和关键特征
 *
 * @param {Object} params
 * @param {string} params.imageUrl - 参考图片 URL
 * @param {string} params.apiKey - DashScope API Key
 * @returns {Promise<Object>} { styleDescription: string, keywords: string[], suggestedPrompt: string }
 */
async function extractImageStyle({ imageUrl, apiKey }) {
  const client = createDashScopeClient(apiKey);

  const systemPrompt = `你是一个专业的图片风格分析师。
分析图片的视觉风格，提取关键特征，用于指导 AI 图片生成。

请从以下维度分析：
1. 艺术风格（写实、插画、油画、水彩、赛璐璐等）
2. 色彩特征（色调、饱和度、对比度）
3. 光影特点（光源、氛围、明暗对比）
4. 构图特点（视角、景深、焦点）
5. 细节质感（清晰度、纹理、颗粒感）
6. 影调（色温、色调）

若有主体人物，则还需要分析
1. 皮肤（冷白皮、肤色等）
2. 妆容
3. 五官（高鼻梁等）

**重要要求**：
- 所有输出必须使用中文
- suggestedPrompt 必须是中文描述，适合中文图片生成模型使用
- 避免使用英文术语，用中文表达所有概念

返回 JSON 格式：
{
  "styleDescription": "完整的风格描述（50-100字中文）",
  "keywords": ["中文关键词1", "中文关键词2", "中文关键词3", "中文关键词4", "中文关键词5"],
  "suggestedPrompt": "可直接用于生成的中文 prompt（简洁版，80-150字中文）"
}

示例输出：
{
  "styleDescription": "日系清新插画风格，柔和的暖色调，低饱和度，柔光照明营造温馨氛围，浅景深突出主体，细腻的线条和渐变，整体呈现宁静唯美的质感",
  "keywords": ["日系", "插画", "暖色调", "柔光", "浅景深"],
  "suggestedPrompt": "日系插画风格，温暖柔和色调，柔光照明，浅景深，细腻线条，宁静氛围，高质量细节"
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'qwen3-vl-plus', // 使用视觉模型
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            },
            {
              type: 'text',
              text: '请分析这张图片的艺术风格和视觉特征，提取关键要素用于 AI 图片生成。注意：必须使用纯中文输出，suggestedPrompt 字段必须是完整的中文描述，不要包含任何英文单词。'
            }
          ]
        }
      ],
      response_format: {
        type: 'json_object'
      },
      temperature: 0.5
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      styleDescription: result.styleDescription || result.style_description || '',
      keywords: result.keywords || [],
      suggestedPrompt: result.suggestedPrompt || result.suggested_prompt || ''
    };
  } catch (error) {
    console.error('Image style extraction failed:', error);
    throw new Error('风格提取失败: ' + error.message);
  }
}

/**
 * 智能场景识别
 * 识别图片中的场景、物体、人物等信息
 *
 * @param {Object} params
 * @param {string} params.imageUrl - 图片 URL
 * @param {string} params.apiKey - DashScope API Key
 * @returns {Promise<Object>} { scene: string, objects: string[], description: string }
 */
async function recognizeScene({ imageUrl, apiKey }) {
  const client = createDashScopeClient(apiKey);

  try {
    const response = await client.chat.completions.create({
      model: 'qwen3-vl-plus',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            },
            {
              type: 'text',
              text: '请详细描述这张图片的内容，包括：场景类型、主要物体、人物（如有）、环境氛围。用 JSON 格式返回：{"scene": "场景类型", "objects": ["物体1", "物体2"], "description": "详细描述"}'
            }
          ]
        }
      ],
      response_format: {
        type: 'json_object'
      }
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      scene: result.scene || '',
      objects: result.objects || [],
      description: result.description || ''
    };
  } catch (error) {
    console.error('Scene recognition failed:', error);
    throw new Error('场景识别失败: ' + error.message);
  }
}

module.exports = {
  enhancePrompt,
  extractImageStyle,
  recognizeScene
};
