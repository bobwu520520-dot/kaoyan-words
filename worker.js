// Cloudflare Worker — DeepSeek API 代理
// 用途: 前端不直接暴露 API Key;Key 存在 Worker 环境变量 DEEPSEEK_API_KEY 中。
// 部署: 在 Cloudflare Dashboard → Workers → 创建 → 粘贴本文件 → 设置变量 DEEPSEEK_API_KEY。
// 配置: 前端「AI 设置」→ API 地址填 https://你的worker名.workers.dev/v1(或自定义域),模型填 deepseek-chat,Key 可留空。
const UPSTREAM = 'https://api.deepseek.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    if (!url.pathname.endsWith('/chat/completions')) {
      return new Response('Not Found', { status: 404, headers: CORS });
    }
    if (!env.DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ error: { message: '服务端未配置 DEEPSEEK_API_KEY' } }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } });
    }
    const body = await request.text();
    const resp = await fetch(UPSTREAM + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.DEEPSEEK_API_KEY },
      body,
    });
    const text = await resp.text();
    return new Response(text, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  },
};
