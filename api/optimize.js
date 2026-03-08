const fetch = require('node-fetch');

const SUPABASE_URL = 'https://mtuuwxcqvlcfgchaffee.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { originalText } = req.body || {};
  if (!originalText) return res.status(400).json({ error: 'No text provided' });

  // 1. 验证用户 JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required. Please log in to use optimization.' });
  }

  try {
    // 2. 验证 token 获取用户信息
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': authHeader
      }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }

    const user = await userRes.json();

    // 3. 查询当前积分
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
    const currentCredits = Array.isArray(creditsData) && creditsData.length > 0
      ? creditsData[0].credits : 0;

    if (currentCredits <= 0) {
      return res.status(402).json({ error: 'Insufficient credits. Please recharge.' });
    }

    // 4. 调用 NVIDIA API 进行提示词优化
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen2.5-coder-32b-instruct',
        messages: [
          {
            role: 'system',
            content: '你是一个提示词专家。请将用户输入的原始命令重构为高质量 Prompt。要求：1.赋予专业角色；2.增加结构化指令（背景、任务、限制、输出格式）；3.提升表达专业度。直接返回优化后的结果，禁止任何开场白或解释。'
          },
          { role: 'user', content: originalText }
        ],
        temperature: 0.6
      })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'NVIDIA API error', details: data });
    }

    // 5. 扣除 1 积分
    await fetch(
      `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ credits: currentCredits - 1 })
      }
    );

    return res.status(200).json({
      optimizedText: data.choices[0].message.content,
      creditsRemaining: currentCredits - 1
    });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

};
