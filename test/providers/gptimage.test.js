const assert = require('node:assert/strict');
const test = require('node:test');
const gptimageProvider = require('../../providers/gptimage');

function baseArgs(overrides = {}) {
  return {
    env: {},
    gptimage: {
      apiUrl: 'https://primary.example/v1/images/generations',
      apiKey: 'primary-key',
      model: 'gpt-image-2',
      fallback: {
        apiUrl: 'https://cf.api.fan/v1/images/generations',
        apiKey: 'packy-key',
        model: 'gpt-image-2',
        timeout: 180000,
      },
    },
    mode: 'txt2img',
    prompt: '一只橘猫',
    negativePrompt: '',
    n: 4,
    hd: false,
    aspectRatio: '1:1',
    uploadedUrls: [],
    baseDim: null,
    timeoutMs: 120000,
    ...overrides,
  };
}

test('主渠道文生图失败后使用 Packy Images API', async (t) => {
  t.mock.method(console, 'log', () => {});
  const calls = [];
  const axios = {
    async post(url, body, options) {
      calls.push({ url, body, options });
      if (url.startsWith('https://primary.example/')) {
        const error = new Error('primary unavailable');
        error.response = { status: 503, data: { error: 'unavailable' } };
        throw error;
      }
      return {
        data: {
          created: 1776923999,
          data: [{ url: 'https://external-resources.packyapi.ai/fallback.png' }],
        },
      };
    },
  };

  const result = await gptimageProvider.generate(baseArgs({
    axios,
    prompt: '一只橘猫',
    negativePrompt: '水印',
    hd: true,
    aspectRatio: '16:9',
  }));

  assert.deepEqual(result.outputImageUrls, ['https://external-resources.packyapi.ai/fallback.png']);
  assert.equal(calls.length, 2);
  const fallbackCall = calls[1];
  assert.equal(fallbackCall.url, 'https://cf.api.fan/v1/images/generations');
  assert.deepEqual(fallbackCall.body, {
    model: 'gpt-image-2',
    prompt: '一只橘猫\n\n不要出现：水印',
    size: '2048x1152',
    quality: 'high',
    output_format: 'png',
    n: 1,
  });
  assert.equal(fallbackCall.options.headers.Authorization, 'Bearer packy-key');
  assert.equal(fallbackCall.options.timeout, 180000);
});

test('主渠道图生图失败后使用基准图调用 Packy edits API', async (t) => {
  t.mock.method(console, 'log', () => {});
  const postCalls = [];
  const getCalls = [];
  const axios = {
    async get(url) {
      getCalls.push(url);
      return {
        data: Buffer.from(url.endsWith('base.png') ? 'BASE_IMAGE' : 'REFERENCE_IMAGE'),
        headers: { 'content-type': 'image/png' },
      };
    },
    async post(url, body, options) {
      postCalls.push({ url, body, options });
      if (url.startsWith('https://primary.example/')) {
        const error = new Error('primary edit unavailable');
        error.response = { status: 502, data: { error: 'bad gateway' } };
        throw error;
      }
      return {
        data: {
          data: [{ url: 'https://external-resources.packyapi.ai/edited.png' }],
        },
      };
    },
  };

  const result = await gptimageProvider.generate(baseArgs({
    axios,
    mode: 'img2img',
    uploadedUrls: [
      'https://oss.example/reference.png',
      'https://oss.example/base.png',
    ],
    aspectRatio: null,
    baseDim: { width: 900, height: 1200 },
  }));

  assert.deepEqual(result.outputImageUrls, ['https://external-resources.packyapi.ai/edited.png']);
  assert.deepEqual(getCalls, [
    'https://oss.example/reference.png',
    'https://oss.example/base.png',
    'https://oss.example/base.png',
  ]);
  assert.equal(postCalls.length, 2);

  const fallbackCall = postCalls[1];
  assert.equal(fallbackCall.url, 'https://cf.api.fan/v1/images/edits');
  assert.match(fallbackCall.options.headers['content-type'], /^multipart\/form-data; boundary=/);
  assert.equal(fallbackCall.options.headers.Authorization, 'Bearer packy-key');

  const multipartBody = fallbackCall.body.getBuffer().toString('utf8');
  assert.match(multipartBody, /name="model"[\s\S]*gpt-image-2/);
  assert.match(multipartBody, /name="size"[\s\S]*1536x2048/);
  assert.match(multipartBody, /name="input_fidelity"[\s\S]*high/);
  assert.doesNotMatch(multipartBody, /name="response_format"/);
  assert.match(multipartBody, /BASE_IMAGE/);
  assert.doesNotMatch(multipartBody, /REFERENCE_IMAGE/);
});

test('主渠道成功时不调用 Packy fallback', async () => {
  const calls = [];
  const axios = {
    async post(url) {
      calls.push(url);
      return { data: { data: [{ url: 'https://primary.example/result.png' }] } };
    },
  };

  const result = await gptimageProvider.generate(baseArgs({ axios }));

  assert.deepEqual(result.outputImageUrls, ['https://primary.example/result.png']);
  assert.deepEqual(calls, ['https://primary.example/v1/images/generations']);
});

test('Packy fallback 返回 b64_json 时解码为图片 Buffer', async (t) => {
  t.mock.method(console, 'log', () => {});
  const expected = Buffer.from('packy-image-data');
  const axios = {
    async post(url) {
      if (url.startsWith('https://primary.example/')) {
        throw new Error('primary unavailable');
      }
      return {
        data: {
          data: [{ b64_json: expected.toString('base64') }],
        },
      };
    },
  };

  const result = await gptimageProvider.generate(baseArgs({ axios }));

  assert.deepEqual(result.outputImageUrls, []);
  assert.equal(result.base64Buffers.length, 1);
  assert.deepEqual(result.base64Buffers[0], expected);
});

test('后台选择 Packy 为主供应商时优先调用 Packy', async () => {
  const calls = [];
  const axios = {
    async post(url, body) {
      calls.push({ url, body });
      return { data: { data: [{ url: 'https://packy.example/result.png' }] } };
    },
  };

  const result = await gptimageProvider.generate(baseArgs({
    axios,
    gptImagePrimaryProvider: 'packy',
  }));

  assert.deepEqual(result.outputImageUrls, ['https://packy.example/result.png']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://cf.api.fan/v1/images/generations');
  assert.equal(calls[0].body.n, 1);
});

test('Packy 主供应商失败时回退到原供应商', async (t) => {
  t.mock.method(console, 'log', () => {});
  const calls = [];
  const axios = {
    async post(url, body) {
      calls.push({ url, body });
      if (url.startsWith('https://cf.api.fan/')) {
        const error = new Error('packy unavailable');
        error.response = { status: 503, data: { error: 'unavailable' } };
        throw error;
      }
      return { data: { data: [{ url: 'https://primary.example/fallback.png' }] } };
    },
  };

  const result = await gptimageProvider.generate(baseArgs({
    axios,
    gptImagePrimaryProvider: 'packy',
  }));

  assert.deepEqual(result.outputImageUrls, ['https://primary.example/fallback.png']);
  assert.deepEqual(calls.map(call => call.url), [
    'https://cf.api.fan/v1/images/generations',
    'https://primary.example/v1/images/generations',
  ]);
  assert.equal(calls[1].body.n, 4);
});
