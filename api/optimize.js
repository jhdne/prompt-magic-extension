const fetch = require('node-fetch');

// 配置信息
const SUPABASE_URL = 'https://mtuuwxcqvlcfgchaffee.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
// 注意：为了排查问题，你可以临时检查这个 key 是否正确加载
const NVIDIA_API_KEY = "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";

module.exports = async (req, res) => {
  // --- 1. 处理跨域与请求验证 ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { originalText } = req.body || {};
  if (!originalText) return res.status(400).json({ error: 'No text provided' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  try {
    // --- 2. Supabase 用户验证 ---
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': authHeader
      }
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Invalid User' });
    const user = await userRes.json();

    // --- 3. 获取积分 ---
    const creditsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${user.id}&select=credits`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    const creditsData = await creditsRes.json();
    const currentCredits = (creditsData && creditsData[0]) ? creditsData[0].credits : 0;

    if (currentCredits <= 0) return res.status(402).json({ error: 'Insufficient credits' });

    // --- 4. 调用 NVIDIA API (Llama-4-Maverick) ---
    const nvidiaPayload = {
      model: "meta/llama-4-maverick-17b-128e-instruct",
      messages: [
        {
          role: "system",
          content: "你是一个提示词专家。请将用户输入的原始命令重构为高质量 Prompt。要求：1.赋予专业角色；2.增加结构化指令（背景、任务、限制、输出格式）；3.提升表达专业度。直接返回优化后的结果，禁止任何开场白。"
        },
        { role: "user", content: originalText }
      ],
      max_tokens: 512,
      temperature: 1.0,
      top_p: 1.0,
      stream: false
    };

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(nvidiaPayload)
    });

    const data = await response.json();

    // 错误检查
    if (!response.ok || !data.choices || data.choices.length === 0) {
      console.error("NVIDIA API Detail Error:", data);
      return res.status(500).json({ error: "AI Model Response Error", details: data });
    }

    const optimizedText = data.choices[0].message.content;

    // --- 5. 扣除积分 ---
    const nextCredits = currentCredits - 1;
    await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ credits: nextCredits })
    });

    // --- 6. 返回结果 ---
    return res.status(200).json({
      optimizedText: optimizedText,
      creditsRemaining: nextCredits
    });

  } catch (err) {
    console.error('Runtime Error:', err);
    return res.status(500).json({ error: 'Server internal error', message: err.message });
  }
};
