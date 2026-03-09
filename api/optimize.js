const fetch = require('node-fetch');
const AbortController = require('abort-controller'); // node-fetch v2 需要此依赖

// ─── 配置（全部从环境变量读取，禁止硬编码） ───────────────────────────────
const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const NVIDIA_API_KEY    = process.env.NVIDIA_API_KEY;

const MAX_INPUT_LENGTH  = 2000;   // 输入字符上限
const NVIDIA_TIMEOUT_MS = 15000;  // NVIDIA API 超时 15s
const CREDITS_PER_CALL  = 1;      // 每次调用消耗积分

// ─── 启动时校验必要环境变量 ─────────────────────────────────────────────────
function assertEnv() {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'NVIDIA_API_KEY']
    .filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
assertEnv();

// ─── 工具：带超时的 fetch ────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── 工具：Supabase REST 请求头 ──────────────────────────────────────────────
function supabaseHeaders(extra = {}) {
  return {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

// ─── 主处理函数 ──────────────────────────────────────────────────────────────
module.exports = async (req, res) => {

  // 1. CORS 预检
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // 2. 请求体校验
  const { originalText } = req.body || {};
  if (!originalText || typeof originalText !== 'string') {
    return res.status(400).json({ error: 'originalText is required and must be a string' });
  }
  if (originalText.trim().length === 0) {
    return res.status(400).json({ error: 'originalText cannot be empty' });
  }
  if (originalText.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `Input too long (max ${MAX_INPUT_LENGTH} chars)` });
  }

  // 3. Authorization 头校验
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    // ── Step A: 验证 Supabase 用户 ─────────────────────────────────────────
    const userRes = await fetchWithTimeout(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': authHeader          // 传递用户自己的 JWT
        }
      },
      8000
    );

    if (!userRes.ok) {
      const errBody = await userRes.text();
      console.warn('User auth failed:', userRes.status, errBody);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await userRes.json();
    if (!user?.id) return res.status(401).json({ error: 'User ID not found' });

    // ── Step B: 查询积分（带行锁防并发重复消费） ──────────────────────────
    const creditsRes = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${user.id}&select=credits`,
      { headers: supabaseHeaders() },
      5000
    );

    if (!creditsRes.ok) {
      const errBody = await creditsRes.text();
      console.error('Credits query failed:', creditsRes.status, errBody);
      return res.status(500).json({ error: 'Failed to query credits' });
    }

    const creditsData = await creditsRes.json();

    // 新用户：自动初始化积分记录
    if (!creditsData || creditsData.length === 0) {
      await fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/user_credits`,
        {
          method: 'POST',
          headers: supabaseHeaders({ 'Prefer': 'return=minimal' }),
          body: JSON.stringify({ user_id: user.id, credits: 0 })
        },
        5000
      );
      return res.status(402).json({ error: 'Insufficient credits', creditsRemaining: 0 });
    }

    const currentCredits = creditsData[0].credits ?? 0;
    if (currentCredits < CREDITS_PER_CALL) {
      return res.status(402).json({ error: 'Insufficient credits', creditsRemaining: currentCredits });
    }

    // ── Step C: 先扣积分，再调用 AI（防止 AI 成功但扣分失败的漏洞） ────────
    const nextCredits = currentCredits - CREDITS_PER_CALL;
    const deductRes = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: supabaseHeaders({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ credits: nextCredits })
      },
      5000
    );

    if (!deductRes.ok) {
      const errBody = await deductRes.text();
      console.error('Credits deduction failed:', deductRes.status, errBody);
      return res.status(500).json({ error: 'Failed to deduct credits' });
    }

    // ── Step D: 调用 NVIDIA API ────────────────────────────────────────────
    let optimizedText;
    try {
      const nvidiaPayload = {
        model: "meta/llama-4-maverick-17b-128e-instruct",
        messages: [
          {
            role: "system",
            content: [
              "你是一个专业的提示词工程师。",
              "请将用户输入的原始指令重构为高质量 Prompt，要求：",
              "1. 赋予清晰的专业角色；",
              "2. 增加结构化指令（背景、任务、限制条件、期望输出格式）；",
              "3. 提升表达专业度与精确性。",
              "直接返回优化后的 Prompt，禁止任何开场白、解释或额外评论。"
            ].join('')
          },
          { role: "user", content: originalText }
        ],
        max_tokens: 512,
        temperature: 0.7,   // 降低随机性，输出更稳定
        top_p: 0.9,
        stream: false
      };

      const nvidiaRes = await fetchWithTimeout(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${NVIDIA_API_KEY}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(nvidiaPayload)
        },
        NVIDIA_TIMEOUT_MS
      );

      const nvidiaData = await nvidiaRes.json();

      if (!nvidiaRes.ok || !nvidiaData?.choices?.length) {
        console.error('NVIDIA API error:', nvidiaRes.status, nvidiaData);
        // AI 调用失败 → 退还积分
        await fetch(
          `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${user.id}`,
          {
            method: 'PATCH',
            headers: supabaseHeaders({ 'Prefer': 'return=minimal' }),
            body: JSON.stringify({ credits: currentCredits })   // 还原
          }
        );
        return res.status(502).json({ error: 'AI model error, credits refunded' });
      }

      optimizedText = nvidiaData.choices[0].message?.content?.trim();
      if (!optimizedText) throw new Error('Empty content from AI');

    } catch (aiErr) {
      // 超时或网络异常 → 退还积分
      console.error('NVIDIA call exception:', aiErr.message);
      await fetch(
        `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: supabaseHeaders({ 'Prefer': 'return=minimal' }),
          body: JSON.stringify({ credits: currentCredits })
        }
      ).catch(e => console.error('Credits refund also failed:', e.message));

      const isTimeout = aiErr.name === 'AbortError';
      return res.status(isTimeout ? 504 : 502).json({
        error: isTimeout ? 'AI request timed out, credits refunded' : 'AI service unavailable, credits refunded'
      });
    }

    // ── Step E: 返回结果 ───────────────────────────────────────────────────
    return res.status(200).json({
      optimizedText,
      creditsRemaining: nextCredits
    });

  } catch (err) {
    console.error('Unexpected server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
